package com.calishealth.api.service.motion;

import com.calishealth.api.dto.LevelEngineDtos.SubmitTestResultRequest;
import com.calishealth.api.dto.MotionDtos.*;
import com.calishealth.api.engine.motion.MotionRuleEngine;
import com.calishealth.api.engine.motion.MotionTypes.*;
import com.calishealth.api.entity.*;
import com.calishealth.api.repository.*;
import com.calishealth.api.service.level.PeriodicAssessmentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Phiên phân tích chuyển động: client (MediaPipe) gửi lô landmark -> engine -> phản hồi đã tổng hợp.
 * Tách khỏi transport (REST hôm nay, có thể bọc WebSocket sau). Chỉ rule PUBLISHED được chạy.
 * Không gọi TTS ở đây: chỉ trả audio đã có trong cache, thiếu thì needsTts để client tự đọc.
 */
@Service
public class MotionRuntimeService {
    private static final Logger log = LoggerFactory.getLogger(MotionRuntimeService.class);
    static final int MAX_FRAMES_PER_BATCH = 120;
    static final Duration IDLE_TIMEOUT = Duration.ofMinutes(30);
    static final long RECOMMENDED_BATCH_MS = 400;

    private static final class Runtime {
        final long movementSessionId;
        final long userId;
        final ExerciseAiProfile profile;
        final ProfileDef profileDef;
        final MotionRuleEngine engine;
        final String context;
        final Long assessmentSessionId, testItemId;
        int repCount, validReps;
        volatile Instant lastSeen = Instant.now();

        Runtime(long movementSessionId, long userId, ExerciseAiProfile profile, ProfileDef def, MotionRuleEngine engine, String context,
                Long assessmentSessionId, Long testItemId) {
            this.movementSessionId = movementSessionId;
            this.userId = userId;
            this.profile = profile;
            this.profileDef = def;
            this.engine = engine;
            this.context = context;
            this.assessmentSessionId = assessmentSessionId;
            this.testItemId = testItemId;
        }
    }

    private final Map<Long, Runtime> sessions = new ConcurrentHashMap<>();

    private final ExerciseAiProfileRepository profiles;
    private final ExerciseRepository exercises;
    private final AiMotionRuleRepository rules;
    private final MotionRuleThresholdRepository thresholds;
    private final MovementSessionRepository movementSessions;
    private final MotionViolationEventRepository violationEvents;
    private final MotionRepResultRepository repResults;
    private final FormAnalysisRepository formAnalyses;
    private final MotionFeedbackService feedback;
    private final MotionRuleMapper mapper;
    private final PeriodicAssessmentService periodic;
    private final WorkoutSessionRepository workoutSessions;
    private final ObjectMapper json = new ObjectMapper();

    public MotionRuntimeService(ExerciseAiProfileRepository profiles, ExerciseRepository exercises, AiMotionRuleRepository rules,
                                MotionRuleThresholdRepository thresholds, MovementSessionRepository movementSessions,
                                MotionViolationEventRepository violationEvents, MotionRepResultRepository repResults,
                                FormAnalysisRepository formAnalyses, MotionFeedbackService feedback, MotionRuleMapper mapper,
                                PeriodicAssessmentService periodic, WorkoutSessionRepository workoutSessions) {
        this.profiles = profiles;
        this.exercises = exercises;
        this.rules = rules;
        this.thresholds = thresholds;
        this.movementSessions = movementSessions;
        this.violationEvents = violationEvents;
        this.repResults = repResults;
        this.formAnalyses = formAnalyses;
        this.feedback = feedback;
        this.mapper = mapper;
        this.periodic = periodic;
        this.workoutSessions = workoutSessions;
    }

    // ============================== Bắt đầu ==============================

    @Transactional
    public StartMotionSessionResponse start(Long userId, StartMotionSessionRequest req) {
        purgeIdle();
        ExerciseAiProfile p = resolveProfile(req);
        String context = "ASSESSMENT".equals(req.context()) ? "ASSESSMENT" : "TRAINING";
        if ("ASSESSMENT".equals(context) && (req.assessmentSessionId() == null || req.testItemId() == null)) {
            throw new IllegalArgumentException("Phiên đánh giá cần assessmentSessionId và testItemId.");
        }
        List<RuleDef> defs = publishedRules(p.getId());
        String camera = req.cameraView() != null && !req.cameraView().isBlank() ? req.cameraView() : p.getCameraView();
        ProfileDef def = mapper.toProfileDef(p);
        MotionRuleEngine engine = new MotionRuleEngine(def, defs, camera, false);

        MovementSession ms = new MovementSession();
        ms.setExercise(p.getExercise());
        ms.setUserId(userId);
        ms.setAiProfileId(p.getId());
        ms.setProfileVersion(p.getVersion());
        ms.setAnalysisContext(context);
        ms.setCameraView(camera);
        ms.setAssessmentSessionId(req.assessmentSessionId());
        ms.setTestItemId(req.testItemId());
        if (req.workoutSessionId() != null) {   // đo trong buổi tập: gắn vào buổi tập của chính học viên để điểm form được tính vào tiến độ
            ms.setWorkoutSession(workoutSessions.findByIdAndUserId(req.workoutSessionId(), userId)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy buổi tập để gắn phiên đo.")));
        }
        ms.setStartedAt(Instant.now());
        ms.setModelName(p.getPoseModel());
        ms.setModelVersion("motion-rule-engine");
        ms.setProcessingStatus(MovementProcessingStatus.PROCESSING);
        movementSessions.save(ms);

        sessions.put(ms.getId(), new Runtime(ms.getId(), userId, p, def, engine, context, req.assessmentSessionId(), req.testItemId()));

        List<String> warnings = new ArrayList<>();
        if (engine.activeRules().isEmpty()) warnings.add("Bài tập chưa có rule PUBLISHED — chỉ đếm rep, không chấm form.");
        if (def.repMetric() == null) warnings.add("Profile chưa cấu hình chỉ số đếm rep.");
        long skipped = engine.activeRules().stream().filter(r -> r.cameraView() != null && camera != null && !"ANY".equals(r.cameraView())
                && !"ANY".equals(camera) && !r.cameraView().equals(camera)).count();
        if (skipped > 0) warnings.add(skipped + " rule cần góc camera khác sẽ không được xét ở góc " + camera + ".");
        Set<String> hint = new TreeSet<>();
        engine.activeRules().forEach(r -> r.measurement().requiredLandmarks().forEach(i -> hint.add(String.valueOf(i))));
        if (def.repMetric() != null) def.repMetric().points().forEach(i -> hint.add(String.valueOf(i)));
        return new StartMotionSessionResponse(String.valueOf(ms.getId()), p.getId(), p.getVersion(), camera, def.movementType(),
                engine.activeRules().size(), List.copyOf(hint), RECOMMENDED_BATCH_MS, warnings);
    }

    private ExerciseAiProfile resolveProfile(StartMotionSessionRequest req) {
        if (req.profileId() != null) {
            return profiles.findById(req.profileId()).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy motion profile."));
        }
        if (req.exerciseId() == null) throw new IllegalArgumentException("Cần exerciseId hoặc profileId.");
        exercises.findById(req.exerciseId()).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài tập."));
        return profiles.findByExerciseIdAndStatus(req.exerciseId(), "ACTIVE")
                .or(() -> profiles.findFirstByExerciseIdOrderByCreatedAtDesc(req.exerciseId()))
                .orElseThrow(() -> new IllegalArgumentException("Bài tập chưa có motion profile."));
    }

    List<RuleDef> publishedRules(Long profileId) {
        List<AiMotionRule> list = rules.findByAiProfileIdAndStatus(profileId, MotionConfigService.PUBLISHED);
        if (list.isEmpty()) return List.of();
        Map<Long, List<MotionRuleThreshold>> byRule = new HashMap<>();
        thresholds.findByRuleIdIn(list.stream().map(r -> r.getId()).toList())
                .forEach(t -> byRule.computeIfAbsent(t.getRuleId(), k -> new ArrayList<>()).add(t));
        return list.stream().map(r -> mapper.toDef(r, byRule.getOrDefault(r.getId(), List.of())))
                .filter(d -> d.measurement() != null && d.operator() != null)
                .toList();
    }

    // ============================== Lô khung ==============================

    @Transactional
    public FrameBatchResponse frames(Long userId, Long sessionId, FrameBatchRequest req) {
        Runtime rt = runtime(userId, sessionId);
        if (req == null || req.frames() == null || req.frames().isEmpty()) throw new IllegalArgumentException("Lô khung rỗng.");
        if (req.frames().size() > MAX_FRAMES_PER_BATCH) throw new IllegalArgumentException("Tối đa " + MAX_FRAMES_PER_BATCH + " khung mỗi lô.");
        double aspect = req.aspectRatio() == null || req.aspectRatio() <= 0 ? 1.0 : req.aspectRatio();

        List<FeedbackOutDto> out = new ArrayList<>();
        List<RepOutDto> reps = new ArrayList<>();
        List<MotionViolationEvent> events = new ArrayList<>();
        List<MotionRepResult> repRows = new ArrayList<>();
        List<FeedbackDecision> decisions = new ArrayList<>();
        FrameEvaluation last = null;
        String stopReason = null;
        synchronized (rt) {
            rt.lastSeen = Instant.now();
            for (FrameDto f : req.frames()) {
                FrameEvaluation ev = rt.engine.process(new PoseFrame(f.t(), landmarks(f.l()), aspect));
                last = ev;
                if (ev.feedback().mode() != FeedbackMode.NONE) decisions.add(ev.feedback());
                Set<String> delivered = deliveredCodes(ev.feedback());
                for (Violation v : ev.newViolations()) events.add(event(rt, v, delivered.contains(v.feedbackCode())));
                if (ev.completedRep() != null) {
                    RepResult r = ev.completedRep();
                    rt.repCount++;
                    if (r.valid()) rt.validReps++;
                    reps.add(new RepOutDto(r.repNumber(), r.complete(), r.valid(), r.qualityScore(), r.violationCodes()));
                    repRows.add(repRow(rt, r));
                }
                if (ev.stopRequested() && stopReason == null) {
                    Violation p = ev.feedback().primary();
                    stopReason = p != null ? p.ruleName() : "Phát hiện lỗi nguy hiểm — dừng bài tập.";
                }
            }
        }
        // Feedback text/audio: tra theo mã, không gọi TTS
        Set<String> codes = new HashSet<>();
        decisions.forEach(d -> { if (d.primary() != null && d.primary().feedbackCode() != null) codes.add(d.primary().feedbackCode()); });
        Map<String, MotionFeedbackService.Resolved> resolved = feedback.resolve(codes);
        for (FeedbackDecision d : decisions) out.add(feedbackOut(rt, d, resolved));
        for (MotionViolationEvent e : events) {
            MotionFeedbackService.Resolved r = e.isFeedbackDelivered() ? resolved.get(e.getFeedbackCode()) : null;
            if (r != null && rt.profile.isVoiceWarningEnabled()) e.setAudioUrl(r.audioUrl());
        }
        violationEvents.saveAll(events);
        repResults.saveAll(repRows);
        FrameEvaluation end = Objects.requireNonNull(last);   // lô không rỗng
        return new FrameBatchResponse(end.phase(), rt.repCount, rt.validReps, end.measurementStatus(), out, reps,
                stopReason != null, stopReason);
    }

    private static List<Landmark> landmarks(List<double[]> raw) {
        if (raw == null || raw.isEmpty()) return List.of();   // không phát hiện người -> engine coi là không tin cậy
        if (raw.size() < 33) throw new IllegalArgumentException("Mỗi khung cần đủ 33 landmark của MediaPipe Pose.");
        List<Landmark> out = new ArrayList<>(raw.size());
        for (double[] a : raw) {
            if (a == null || a.length < 4) throw new IllegalArgumentException("Landmark phải có dạng [x, y, z, visibility].");
            out.add(new Landmark(a[0], a[1], a[2], a[3]));
        }
        return out;
    }

    private static Set<String> deliveredCodes(FeedbackDecision d) {
        Set<String> s = new HashSet<>();
        if (d.mode() == FeedbackMode.NONE) return s;
        if (d.primary() != null && d.primary().feedbackCode() != null) s.add(d.primary().feedbackCode());
        d.related().forEach(v -> { if (v.feedbackCode() != null) s.add(v.feedbackCode()); });
        return s;
    }

    private FeedbackOutDto feedbackOut(Runtime rt, FeedbackDecision d, Map<String, MotionFeedbackService.Resolved> resolved) {
        Violation p = d.primary();
        MotionFeedbackService.Resolved r = p.feedbackCode() == null ? null : resolved.get(p.feedbackCode());
        boolean voiceOn = rt.profile.isVoiceWarningEnabled();
        boolean textOn = rt.profile.isTextWarningEnabled();
        String ui = r == null ? p.ruleName() : r.uiText();
        return new FeedbackOutDto(d.mode().name(), p.feedbackCode(), p.severity().name(), textOn ? ui : null,
                voiceOn && r != null ? r.voiceText() : null, voiceOn && r != null ? r.audioUrl() : null,
                voiceOn && r != null && r.needsTts(),
                d.related().stream().map(v -> v.feedbackCode() != null ? v.feedbackCode() : v.ruleCode()).toList(),
                p.ruleCode(), p.ruleVersion(), round(p.observedValue()), p.expected());
    }

    private static MotionViolationEvent event(Runtime rt, Violation v, boolean delivered) {
        MotionViolationEvent e = new MotionViolationEvent();
        e.setMovementSessionId(rt.movementSessionId);
        e.setRepNumber(v.repNumber());
        e.setPhaseCode(v.phase());
        e.setRuleId(v.ruleId());
        e.setRuleCode(v.ruleCode());
        e.setRuleVersion(v.ruleVersion());
        e.setSeverity(v.severity().name());
        e.setMetricType(v.metricType() == null ? null : v.metricType().name());
        e.setObservedValue(round(v.observedValue()));
        e.setUnit(v.unit());
        e.setTargetValue(v.targetValue());
        e.setNormalMin(v.normalMin());
        e.setNormalMax(v.normalMax());
        e.setExpectedText(v.expected());
        e.setFeedbackCode(v.feedbackCode());
        e.setFeedbackDelivered(delivered);
        e.setInvalidRep(v.invalidRep());
        e.setStopExercise(v.stopExercise() && v.severity() == Severity.CRITICAL);
        e.setTimestampMs(v.timestampMs());
        return e;
    }

    private MotionRepResult repRow(Runtime rt, RepResult r) {
        MotionRepResult row = new MotionRepResult();
        row.setMovementSessionId(rt.movementSessionId);
        row.setRepNumber(r.repNumber());
        row.setComplete(r.complete());
        row.setValid(r.valid());
        row.setQualityScore(r.qualityScore());
        row.setViolationCodes(String.join(",", r.violationCodes()));
        row.setMetricsJson(json.writeValueAsString(r.metrics()));
        row.setStartMs(r.startMs());
        row.setEndMs(r.endMs());
        return row;
    }

    // ============================== Kết thúc ==============================

    @Transactional
    public FinishMotionSessionResponse finish(Long userId, Long sessionId) {
        Runtime rt = runtime(userId, sessionId);
        SessionSummary s;
        synchronized (rt) {
            s = rt.engine.summary();
            sessions.remove(sessionId);
        }
        boolean reliable = s.frames() > 0 && s.trackedRatio() >= 0.8 && s.poseConfidenceAvg() >= rt.profileDef.minPoseConfidence();
        MovementSession ms = movementSessions.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phiên phân tích."));
        ms.setEndedAt(Instant.now());
        ms.setProcessingStatus(MovementProcessingStatus.COMPLETED);
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalReps", s.totalReps());
        summary.put("validReps", s.validReps());
        summary.put("invalidReps", s.invalidReps());
        summary.put("qualityScore", s.qualityScore());
        summary.put("holdSec", round(s.holdSec()));
        summary.put("romAvg", round(s.romAvg()));
        summary.put("criticalCount", s.criticalCount());
        summary.put("poseConfidenceAvg", round(s.poseConfidenceAvg()));
        summary.put("visibilityAvg", round(s.visibilityAvg()));
        summary.put("trackedRatio", round(s.trackedRatio()));
        summary.put("frames", s.frames());
        summary.put("violationCounts", s.violationCounts());
        summary.put("reliability", reliable ? "RELIABLE" : "LOW");
        ms.setSummaryJson(json.writeValueAsString(summary));
        movementSessions.save(ms);

        FormAnalysis fa = new FormAnalysis();
        fa.setMovementSession(ms);
        fa.setOverallScore(dec(s.qualityScore()));
        fa.setRangeOfMotion(dec(s.romAvg()));
        fa.setAnalysisVersion("motion-rule-engine/profile-" + rt.profile.getId() + "-v" + rt.profile.getVersion());
        fa.setFeedback(s.violationCounts().isEmpty() ? "Không phát hiện vi phạm form." : "Vi phạm: " + s.violationCounts());
        if (reliable) formAnalyses.save(fa);   // lần đo thiếu dữ liệu không để lại điểm form (không coi thiếu dữ liệu là form tốt hay xấu)

        Object assessment = null;
        if ("ASSESSMENT".equals(rt.context)) {
            Double romScore = null;
            ProfileDef d = rt.profileDef;
            if (s.romAvg() > 0 && d.repTop() != null && d.repBottom() != null && d.repTop() > d.repBottom()) {
                romScore = Math.min(100.0, s.romAvg() / (d.repTop() - d.repBottom()) * 100.0);
            }
            boolean hold = "HOLD".equals(d.movementType());
            assessment = periodic.submitResult(userId, rt.assessmentSessionId, rt.testItemId, new SubmitTestResultRequest(
                    hold ? null : s.totalReps(), hold ? null : s.validReps(), hold ? round(s.holdSec()) : null, null,
                    (double) s.qualityScore(), romScore, s.criticalCount(), s.poseConfidenceAvg(), s.visibilityAvg(),
                    s.trackedRatio(), ms.getId(), "AI_MEASURED"));
        }
        List<RepOutDto> reps = s.reps().stream()
                .map(r -> new RepOutDto(r.repNumber(), r.complete(), r.valid(), r.qualityScore(), r.violationCodes())).toList();
        return new FinishMotionSessionResponse(String.valueOf(sessionId), s.totalReps(), s.validReps(), s.invalidReps(),
                s.qualityScore(), round(s.holdSec()), round(s.romAvg()), s.criticalCount(), round(s.poseConfidenceAvg()),
                round(s.visibilityAvg()), round(s.trackedRatio()), s.violationCounts(), reps, reliable ? "RELIABLE" : "LOW", assessment);
    }

    // ============================== Hỗ trợ ==============================

    private Runtime runtime(Long userId, Long sessionId) {
        Runtime rt = sessions.get(sessionId);
        if (rt == null || rt.userId != userId) {
            throw new IllegalArgumentException("Phiên phân tích không tồn tại hoặc đã kết thúc (hết hạn sau "
                    + IDLE_TIMEOUT.toMinutes() + " phút không hoạt động).");
        }
        return rt;
    }

    private void purgeIdle() {
        Instant cutoff = Instant.now().minus(IDLE_TIMEOUT);
        sessions.values().removeIf(rt -> {
            boolean idle = rt.lastSeen.isBefore(cutoff);
            if (idle) log.info("Đóng phiên phân tích chuyển động {} do không hoạt động", rt.movementSessionId);
            return idle;
        });
    }

    int openSessions() {
        return sessions.size();
    }

    private static double round(double v) {
        return Math.round(v * 1000.0) / 1000.0;
    }

    private static BigDecimal dec(double v) {
        return BigDecimal.valueOf(v).setScale(2, RoundingMode.HALF_UP);
    }
}
