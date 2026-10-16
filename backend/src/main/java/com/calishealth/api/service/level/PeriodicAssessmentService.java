package com.calishealth.api.service.level;

import com.calishealth.api.dto.LevelEngineDtos.*;
import com.calishealth.api.engine.config.DefaultLevelEngineConfig;
import com.calishealth.api.engine.config.RuleSetConfig;
import com.calishealth.api.engine.level.*;
import com.calishealth.api.engine.level.CompetencyScoringEngine.*;
import com.calishealth.api.engine.level.LevelModels.*;
import com.calishealth.api.engine.skill.SkillEngine;
import com.calishealth.api.engine.skill.SkillGraph;
import com.calishealth.api.entity.*;
import com.calishealth.api.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Bài đánh giá định kỳ thực hành (MediaPipe -> Rule Engine -> kết quả từng bài).
 * complete(): Reliability Gate -> năng lực (AI_MEASURED) -> Skill Tree -> Level Evaluation (6 cổng) -> chu kỳ tập MỚI.
 * Level tạm thời (PROVISIONAL) được hiệu chỉnh bằng lần đo đầu tiên (Baseline Test).
 */
@Service
public class PeriodicAssessmentService {
    public static final String PERIODIC = "PERIODIC", BASELINE = "BASELINE";

    private final RuleSetProvider ruleSets;
    private final LevelDataService levelData;
    private final SkillProgressService skills;
    private final TrainingCycleService cycles;
    private final TrainingLogService logs;
    private final FitnessStateService fitnessState;
    private final AssessmentSessionRepository sessionRepo;
    private final AssessmentTemplateRepository templateRepo;
    private final AssessmentTestItemRepository itemRepo;
    private final AssessmentTestResultRepository resultRepo;
    private final AssessmentTypeRepository typeRepo;
    private final LevelEvaluationRepository evaluationRepo;
    private final ExerciseAiProfileRepository aiProfileRepo;
    private final AiLandmarkRequirementRepository landmarkRepo;
    private final WorkoutPlanRepository planRepo;
    private final UserRepository userRepo;
    private final ObjectMapper json = new ObjectMapper();

    public PeriodicAssessmentService(RuleSetProvider ruleSets, LevelDataService levelData, SkillProgressService skills,
                                     TrainingCycleService cycles, TrainingLogService logs, FitnessStateService fitnessState,
                                     AssessmentSessionRepository sessionRepo, AssessmentTemplateRepository templateRepo,
                                     AssessmentTestItemRepository itemRepo, AssessmentTestResultRepository resultRepo,
                                     AssessmentTypeRepository typeRepo, LevelEvaluationRepository evaluationRepo,
                                     ExerciseAiProfileRepository aiProfileRepo, AiLandmarkRequirementRepository landmarkRepo,
                                     WorkoutPlanRepository planRepo, UserRepository userRepo) {
        this.ruleSets = ruleSets;
        this.levelData = levelData;
        this.skills = skills;
        this.cycles = cycles;
        this.logs = logs;
        this.fitnessState = fitnessState;
        this.sessionRepo = sessionRepo;
        this.templateRepo = templateRepo;
        this.itemRepo = itemRepo;
        this.resultRepo = resultRepo;
        this.typeRepo = typeRepo;
        this.evaluationRepo = evaluationRepo;
        this.aiProfileRepo = aiProfileRepo;
        this.landmarkRepo = landmarkRepo;
        this.planRepo = planRepo;
        this.userRepo = userRepo;
    }

    // ============================== Bắt đầu ==============================

    @Transactional
    public StartPeriodicResponse start(Long userId) {
        RuleSetConfig rs = ruleSets.active();
        Optional<UserLevelState> state = levelData.state(userId);
        String level = state.map(userLevelState -> userLevelState.getLevelCode()).orElse(rs.levelByRank(0).code());
        boolean returning = cycles.inactive(userId, rs);
        boolean baseline = state.isEmpty() || UserLevelState.PROVISIONAL.equals(state.get().getStatus()) || returning
                || UserLevelState.RETURNING.equals(state.get().getStatus());

        Optional<AssessmentSession> open = sessionRepo.findByUserIdOrderByStartedAtDesc(userId).stream()
                .filter(s -> s.getStatus() == AssessmentSessionStatus.IN_PROGRESS
                        && (PERIODIC.equals(s.getPurpose()) || BASELINE.equals(s.getPurpose()))).findFirst();
        AssessmentSession session;
        if (open.isPresent()) {
            session = open.get();
        } else {
            if (!baseline) {
                Optional<AssessmentSession> last = sessionRepo.findByUserIdOrderByStartedAtDesc(userId).stream()
                        .filter(s -> s.getStatus() == AssessmentSessionStatus.COMPLETED
                                && (PERIODIC.equals(s.getPurpose()) || BASELINE.equals(s.getPurpose()))).findFirst();
                long minDays = (long) rs.param("assessment.minIntervalDays", 14);
                if (last.isPresent() && last.get().getCompletedAt() != null
                        && ChronoUnit.DAYS.between(last.get().getCompletedAt(), Instant.now()) < minDays) {
                    throw new IllegalStateException("Bài đánh giá định kỳ cần cách lần trước tối thiểu " + minDays
                            + " ngày để kết quả phản ánh tiến bộ thật (tránh test lặp lại tới khi may mắn).");
                }
            }
            AssessmentTemplate template = periodicTemplate();
            session = new AssessmentSession();
            session.setUser(userRepo.findById(userId).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng")));
            session.setAssessmentType(ensureType());
            session.setTemplate(template);
            session.setTemplateVersion(template.getVersion());
            session.setVersion(String.valueOf(template.getVersion()));
            session.setPurpose(baseline ? BASELINE : PERIODIC);
            session.setSource("AI_MEASURED");
            session.setRuleSetId(rs.id());
            session.setStatus(AssessmentSessionStatus.IN_PROGRESS);
            session = sessionRepo.save(session);
        }
        List<AssessmentTestItem> items = itemsFor(session, rs, level);
        Set<Long> mandatory = mandatoryFor(userId, rs, items);
        Map<Long, AssessmentTestResult> results = new HashMap<>();
        resultRepo.findWithItemBySessionId(session.getId()).forEach(r -> results.put(r.getTestItem().getId(), r));
        List<TestItemDto> dtos = items.stream().map(i -> itemDto(i, results.get(i.getId()), mandatory.contains(i.getId()))).toList();
        int minutes = Math.max(10, items.size() * 3);
        return new StartPeriodicResponse(String.valueOf(session.getId()), session.getPurpose(),
                fitnessState.levelDto(rs, level, state.map(userLevelState -> userLevelState.getStatus()).orElse(UserLevelState.PROVISIONAL), null),
                minutes, dtos, List.of(
                        "Khởi động chuẩn 5 phút trước khi test.",
                        "Đặt camera ngang hông, cách 2.5–3 m, đủ sáng, thấy toàn thân.",
                        "Làm theo thứ tự: kỹ năng → sức mạnh → sức bền → linh hoạt; nghỉ 2–3 phút giữa các bài.",
                        "Mỗi bài làm tới khi không còn rep đúng kỹ thuật - chỉ rep hợp lệ được tính."));
    }

    // ============================== Nộp kết quả từng bài ==============================

    @Transactional
    public TestResultDto submitResult(Long userId, Long sessionId, Long itemId, SubmitTestResultRequest req) {
        RuleSetConfig rs = ruleSets.active();
        AssessmentSession session = openSession(userId, sessionId);
        AssessmentTestItem item = itemRepo.findById(itemId)
                .filter(i -> i.getTemplate().getId().equals(session.getTemplate().getId()))
                .orElseThrow(() -> new IllegalArgumentException("Bài test không thuộc bài đánh giá này."));
        AssessmentTestResult r = resultRepo.findWithItemBySessionId(sessionId).stream()
                .filter(x -> x.getTestItem().getId().equals(itemId)).findFirst().orElseGet(AssessmentTestResult::new);
        r.setAssessmentSessionId(sessionId);
        r.setTestItem(item);
        r.setMovementSessionId(req.movementSessionId());
        r.setTotalReps(nonNegative(req.totalReps()));
        r.setValidReps(nonNegative(req.validReps()));
        if (r.getValidReps() != null && r.getTotalReps() != null && r.getValidReps() > r.getTotalReps()) r.setTotalReps(r.getValidReps());
        r.setHoldSec(dec(req.holdSec(), 2));
        r.setAngleDeg(dec(req.angleDeg(), 2));
        r.setFormScore(dec(clamp(req.formScore(), 0, 100), 2));
        r.setRomScore(dec(clamp(req.romScore(), 0, 100), 2));
        r.setMajorViolations(nonNegative(req.majorViolations()));
        r.setPoseConfidenceAvg(dec(clamp(req.poseConfidenceAvg(), 0, 1), 3));
        r.setVisibilityAvg(dec(clamp(req.visibilityAvg(), 0, 1), 3));
        r.setTrackedRatio(dec(clamp(req.trackedRatio(), 0, 1), 3));
        // Học viên chỉ được nộp AI_MEASURED (camera) hoặc SELF_REPORTED (bài chưa có AI); COACH_VERIFIED do coach xác minh
        String source = "SELF_REPORTED".equals(req.source()) ? "SELF_REPORTED" : "AI_MEASURED";
        r.setSource(source);

        Double value = switch (item.getMetric()) {
            case "HOLD_SEC" -> req.holdSec();
            case "ANGLE_DEG" -> req.angleDeg();
            default -> req.validReps() == null ? null : req.validReps().doubleValue();
        };
        String status = AssessmentTestResult.VALID, reason = null;
        double reliability;
        if ("SELF_REPORTED".equals(source)) {
            reliability = rs.sourceReliability("SELF_REPORTED");
        } else {
            double pose = req.poseConfidenceAvg() == null ? 0 : req.poseConfidenceAvg();
            double vis = req.visibilityAvg() == null ? 0 : req.visibilityAvg();
            double tracked = req.trackedRatio() == null ? 0 : req.trackedRatio();
            reliability = rs.param("reliability.AI_BASE", 0.9)
                    * Math.min(1, pose / rs.param("reliability.ai.poseRef", 0.8))
                    * Math.min(1, vis / rs.param("reliability.ai.visibilityRef", 0.8)) * tracked;
            double visReq = requiredVisibility(item.getExercise().getId(), rs);
            if (pose < rs.param("gate.reliability.minPose", 0.6)) reason = "Độ tin cậy tư thế thấp (" + fmt(pose) + ")";
            else if (vis < visReq) reason = "Không thấy rõ các điểm mốc cơ thể cần thiết (" + fmt(vis) + " < " + fmt(visReq) + ")";
            else if (tracked < rs.param("gate.reliability.minTracked", 0.8)) reason = "Mất dấu cơ thể ở nhiều khung hình (" + fmt(tracked) + ")";
        }
        if (value == null) reason = "Thiếu kết quả " + LevelGatesLabel.metric(item.getMetric());
        if (reason != null) status = AssessmentTestResult.RETEST;
        r.setReliability(dec(reliability, 3));
        r.setStatus(status);
        r.setStatusReason(reason);
        return resultDto(resultRepo.save(r));
    }

    // ============================== Hoàn tất ==============================

    @Transactional
    public CompletePeriodicResponse complete(Long userId, Long sessionId) {
        RuleSetConfig rs = ruleSets.active();
        AssessmentSession session = openSession(userId, sessionId);
        Optional<UserLevelState> state = levelData.state(userId);
        String level = state.map(userLevelState -> userLevelState.getLevelCode()).orElse(rs.levelByRank(0).code());
        boolean returning = cycles.inactive(userId, rs) || state.map(s -> UserLevelState.RETURNING.equals(s.getStatus())).orElse(false);
        String status = state.isEmpty() ? UserLevelState.PROVISIONAL : returning ? UserLevelState.RETURNING : state.get().getStatus();

        List<AssessmentTestItem> items = itemsFor(session, rs, level);
        List<AssessmentTestResult> results = resultRepo.findWithItemBySessionId(sessionId);
        Set<Long> done = new HashSet<>();
        results.forEach(r -> done.add(r.getTestItem().getId()));
        Set<Long> mandatoryIds = mandatoryFor(userId, rs, items);
        List<String> missing = items.stream().filter(i -> mandatoryIds.contains(i.getId()) && !done.contains(i.getId()))
                .map(i -> name(i.getExercise())).toList();
        if (!missing.isEmpty()) throw new IllegalArgumentException("Chưa hoàn thành bài test bắt buộc: " + String.join(", ", missing) + ".");

        Map<Long, Double> visReq = new HashMap<>();
        List<TestOutcome> tests = new ArrayList<>();
        for (AssessmentTestResult r : results) {
            Long exId = r.getTestItem().getExercise().getId();
            visReq.computeIfAbsent(exId, id -> requiredVisibility(id, rs));
            tests.add(new TestOutcome(exId, r.getTestItem().getExercise().getCode(), r.getTestItem().getCompetencyCode(),
                    r.getTestItem().getMetric(), r.getTotalReps(), r.getValidReps(), d(r.getHoldSec()), d(r.getAngleDeg()),
                    d(r.getFormScore()), d(r.getRomScore()), r.getMajorViolations(), d(r.getPoseConfidenceAvg()), d(r.getVisibilityAvg()),
                    visReq.get(exId), d(r.getTrackedRatio()), r.getReliability() == null ? 0 : r.getReliability().doubleValue(),
                    r.getSource(), r.getStatus(), mandatoryIds.contains(r.getTestItem().getId())));
        }
        boolean coachVerified = results.stream().anyMatch(r -> "COACH_VERIFIED".equals(r.getSource()));

        // ---------- Reliability Gate trước: dữ liệu kém tin cậy không được cập nhật năng lực / level ----------
        LevelContext pre = new LevelContext(level, status, null, 0, Map.of(), null, tests, Map.of(), Map.of(), null, List.of(),
                false, coachVerified, false, Instant.now());
        GateResult rel = LevelGates.reliability(pre, rs);
        if (!rel.pass()) {
            List<Reason> reasons = new ArrayList<>(rel.reasons().stream().filter(x -> !x.passed()).toList());
            String explanation = ExplanationBuilder.level(rs, level, level, LevelModels.RETEST_REQUIRED, null, reasons);
            LevelEvaluation ev = levelData.saveEvaluation(userId, sessionId, rs, level, null, level, null, null,
                    Map.of("RELIABILITY", LevelModels.FAIL), LevelModels.RETEST_REQUIRED, reasons, Map.of("tests", tests), explanation);
            session.setDataQualityStatus("RETEST_REQUIRED");
            sessionRepo.save(session);
            planRepo.findTopByUserIdAndStatusOrderByStartDateDescIdDesc(userId, WorkoutPlanStatus.ACTIVE).ifPresent(p -> {
                if (p.getEndDate() != null && !p.getEndDate().isAfter(LocalDate.now().plusDays(7))) {
                    p.setEndDate(LocalDate.now().plusDays(7));
                    planRepo.save(p);
                }
            });
            List<String> retest = results.stream().filter(r -> !AssessmentTestResult.VALID.equals(r.getStatus()) || reasons.stream()
                    .anyMatch(x -> r.getTestItem().getExercise().getCode().equals(x.exerciseCode())))
                    .map(r -> String.valueOf(r.getTestItem().getId())).distinct().toList();
            return new CompletePeriodicResponse(FitnessStateMapper.evaluation(ev, rs.code() + " v" + rs.version()),
                    FitnessStateMapper.competencies(rs, levelData.currentCompetencies(userId)), null, List.of(), null, null, retest);
        }

        // ---------- Năng lực từ dữ liệu đo ----------
        Instant now = Instant.now();
        List<NodeObservation> nodes = new ArrayList<>();
        Map<String, List<Double>> relByComp = new HashMap<>();
        Map<String, String> sourceByComp = new HashMap<>();
        for (TestOutcome t : tests) {
            if (!t.valid() || t.value() == null) continue;
            nodes.add(new NodeObservation(t.exerciseId(), t.value()));
            String comp = rs.ladderNode(t.exerciseId()).map(ladderNode -> ladderNode.competency()).orElse(t.competency());
            relByComp.computeIfAbsent(comp, k -> new ArrayList<>()).add(t.reliability());
            sourceByComp.merge(comp, t.source(), (a, b) -> "AI_MEASURED".equals(a) || "AI_MEASURED".equals(b) ? "AI_MEASURED" : a);
        }
        Map<String, Double> obs = CompetencyScoringEngine.combine(rs, CompetencyScoringEngine.ladderScores(rs, nodes), List.of());
        Map<String, Observation> current = new LinkedHashMap<>();
        obs.forEach((c, v) -> {
            double r = relByComp.getOrDefault(c, List.of(0.5)).stream().mapToDouble(value -> value.doubleValue()).average().orElse(0.5);
            current.put(c, new Observation(c, v, sourceByComp.getOrDefault(c, "AI_MEASURED"), r, 1.0, now));
        });
        Map<String, CompetencyResult> comps = levelData.record(userId, sessionId, rs, current, Map.of(), now);
        Double overall = CompetencyScoringEngine.overall(rs, comps);

        // ---------- Skill Tree ----------
        SkillGraph graph = skills.graph(rs);
        for (TestOutcome t : tests) {
            if (t.valid() && t.value() != null && t.value() > 0) {
                skills.record(userId, rs, graph, t.exerciseId(), t.value(), t.formScore(), t.source());
            }
        }
        Map<Long, String> nodeStatus = new HashMap<>();
        skills.progress(userId).forEach((id, p) -> nodeStatus.put(id, p.status()));

        // ---------- Level Evaluation ----------
        PreviousEvaluation previous = evaluationRepo.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(e -> !LevelModels.RETEST_REQUIRED.equals(e.getDecision()) && !LevelModels.PROVISIONAL_ASSIGNED.equals(e.getDecision()))
                .findFirst().map(e -> new PreviousEvaluation(e.getCandidateLevel(), e.getCompetencyGate(), e.getDecision(), e.getCreatedAt()))
                .orElse(null);
        LevelContext ctx = new LevelContext(level, status,
                state.map(s -> s.getEwmaOverall() == null ? null : s.getEwmaOverall().doubleValue()).orElse(null),
                state.map(userLevelState -> userLevelState.getConsecutiveBelow()).orElse(0), comps, overall, tests, nodeStatus,
                graph.harderEquivalents(), previous,
                logs.observations(userId, (int) rs.param("stability.logWindowDays", 21)),
                BASELINE.equals(session.getPurpose()), coachVerified, logs.recentIllness(userId), now);
        Outcome o = LevelEvaluationEngine.evaluate(ctx, rs);

        Map<String, String> gates = new LinkedHashMap<>();
        o.gates().forEach((k, v) -> gates.put(k, v.status()));
        String explanation = ExplanationBuilder.level(rs, o.previousLevel(), o.finalLevel(), o.decision(), o.overall(), o.reasons());
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("tests", tests);
        snapshot.put("competencies", comps);
        snapshot.put("previousEvaluation", previous);
        snapshot.put("trainingObservations", ctx.training());
        snapshot.put("baseline", ctx.baseline());
        snapshot.put("calibration", o.calibration());
        snapshot.put("fastTrack", o.fastTrack());
        LevelEvaluation ev = levelData.saveEvaluation(userId, sessionId, rs, o.previousLevel(), o.candidateLevel(), o.finalLevel(),
                o.overall(), o.ewma(), gates, o.decision(), o.reasons(), snapshot, explanation);
        int weeks = (int) rs.param("cycle.weeks." + o.finalLevel(), 4);
        levelData.updateState(userId, o.finalLevel(), o.newStatus(), o.overall(), o.ewma(), o.consecutiveBelow(), ev.getId(),
                LocalDate.now().plusWeeks(weeks));

        session.setStatus(AssessmentSessionStatus.COMPLETED);
        session.setCompletedAt(now);
        session.setOverallScore(overall == null ? null : BigDecimal.valueOf(overall).setScale(2, RoundingMode.HALF_UP));
        session.setLevelCode(o.finalLevel());
        session.setDataQualityStatus("MEASURED");
        session.setConfidence(BigDecimal.valueOf(comps.values().stream().mapToDouble(competencyResult -> competencyResult.confidence()).average().orElse(0))
                .setScale(3, RoundingMode.HALF_UP));
        sessionRepo.save(session);

        // ---------- Chu kỳ tập MỚI (kể cả khi level giữ nguyên) ----------
        String reason = o.calibration() ? "BASELINE_RECALIBRATION" : "PERIODIC_" + o.decision();
        TrainingCycleService.CycleResult cycle = cycles.generate(userId, reason, ev, sessionId);

        Map<String, Double> scores = new LinkedHashMap<>();
        comps.forEach((k, v) -> scores.put(k, v.score()));
        @SuppressWarnings("unchecked")
        List<SkillEngine.Gap> gaps = (List<SkillEngine.Gap>) cycle.snapshot().getOrDefault("gaps", List.of());
        return new CompletePeriodicResponse(FitnessStateMapper.evaluation(ev, rs.code() + " v" + rs.version()),
                FitnessStateMapper.competencies(rs, comps), overall, gaps.stream().map(FitnessStateMapper::gap).toList(),
                String.valueOf(cycle.plan().getId()), cycle.plan().getName(), List.of());
    }

    // ============================== Coach xác minh ==============================

    /** Coach xem video/kết quả và xác minh -> nguồn COACH_VERIFIED (độ tin cậy cao, cho phép fast-track / L4). */
    @Transactional
    public List<TestResultDto> verify(Long sessionId, RuleSetConfig rs) {
        AssessmentSession session = sessionRepo.findById(sessionId).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài đánh giá"));
        if (session.getStatus() != AssessmentSessionStatus.IN_PROGRESS) throw new IllegalStateException("Chỉ xác minh được bài đánh giá chưa hoàn tất.");
        List<TestResultDto> out = new ArrayList<>();
        for (AssessmentTestResult r : resultRepo.findWithItemBySessionId(sessionId)) {
            r.setSource("COACH_VERIFIED");
            r.setStatus(AssessmentTestResult.VALID);
            r.setStatusReason(null);
            r.setReliability(dec(rs.sourceReliability("COACH_VERIFIED"), 3));
            out.add(resultDto(resultRepo.save(r)));
        }
        return out;
    }

    // ============================== Helpers ==============================

    private AssessmentTemplate periodicTemplate() {
        return templateRepo.findByCode(DefaultLevelEngineConfig.PERIODIC_TEMPLATE_CODE)
                .filter(t -> AssessmentTemplate.PUBLISHED.equals(t.getStatus()))
                .or(() -> templateRepo.findTopByTypeAndStatusOrderByVersionDescIdDesc("PERIODIC", AssessmentTemplate.PUBLISHED))
                .orElseThrow(() -> new IllegalStateException("Chưa cấu hình bài đánh giá định kỳ."));
    }

    /** Bộ test thích ứng: các bài có level_min ≤ level hiện tại ≤ level_max; Baseline chỉ gồm bài bắt buộc. */
    private List<AssessmentTestItem> itemsFor(AssessmentSession session, RuleSetConfig rs, String level) {
        int rank = rs.level(level).rank();
        boolean baseline = BASELINE.equals(session.getPurpose());
        return itemRepo.findWithExerciseByTemplateId(session.getTemplate().getId()).stream()
                .filter(i -> rs.level(i.getLevelMin()).rank() <= rank && rank <= rs.level(i.getLevelMax()).rank())
                .filter(i -> !baseline || i.isInBaseline())
                .toList();
    }

    /** Bài bắt buộc nhưng cần dụng cụ học viên không có -> chuyển thành tuỳ chọn (không thể bắt test bài không làm được). */
    private Set<Long> mandatoryFor(Long userId, RuleSetConfig rs, List<AssessmentTestItem> items) {
        Set<String> equipment = cycles.context(userId, rs).equipment();
        Map<Long, Set<String>> req = skills.equipmentRequirements(items.stream().map(i -> i.getExercise().getId()).distinct().toList());
        Set<Long> out = new HashSet<>();
        for (AssessmentTestItem i : items) {
            if (i.isMandatory() && SkillProgressService.equipmentOk(req.get(i.getExercise().getId()), equipment)) out.add(i.getId());
        }
        return out;
    }

    private AssessmentSession openSession(Long userId, Long sessionId) {
        AssessmentSession s = sessionRepo.findById(sessionId)
                .filter(x -> x.getUser().getId().equals(userId))
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài đánh giá."));
        if (s.getStatus() != AssessmentSessionStatus.IN_PROGRESS) throw new IllegalStateException("Bài đánh giá này đã hoàn tất.");
        if (!PERIODIC.equals(s.getPurpose()) && !BASELINE.equals(s.getPurpose())) throw new IllegalArgumentException("Không phải bài đánh giá định kỳ.");
        return s;
    }

    private double requiredVisibility(Long exerciseId, RuleSetConfig rs) {
        double def = rs.param("gate.reliability.minVisibility", 0.5);
        return aiProfileRepo.findFirstByExerciseIdOrderByCreatedAtDesc(exerciseId)
                .map(p -> landmarkRepo.findByAiProfileId(p.getId()).stream().map(aiLandmarkRequirement -> aiLandmarkRequirement.getMinVisibility())
                        .filter(Objects::nonNull).mapToDouble(value -> value.doubleValue()).max().orElse(def))
                .orElse(def);
    }

    private TestItemDto itemDto(AssessmentTestItem i, AssessmentTestResult r, boolean mandatory) {
        Exercise e = i.getExercise();
        boolean ai = aiProfileRepo.findFirstByExerciseIdOrderByCreatedAtDesc(e.getId())
                .map(p -> p.isAnalysisEnabled() && !"ARCHIVED".equals(p.getStatus())).orElse(false);
        Map<String, Object> protocol;
        try {
            protocol = i.getProtocolJson() == null ? Map.of() : json.readValue(i.getProtocolJson(), new TypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            protocol = Map.of();
        }
        return new TestItemDto(String.valueOf(i.getId()), String.valueOf(e.getId()), e.getCode(), name(e), e.getThumbnailUrl(),
                e.getVideoUrl(), i.getCompetencyCode(), i.getMetric(), mandatory, i.getSortOrder(), protocol, ai,
                r == null ? null : resultDto(r));
    }

    private TestResultDto resultDto(AssessmentTestResult r) {
        return new TestResultDto(String.valueOf(r.getId()), String.valueOf(r.getTestItem().getId()), r.getTotalReps(), r.getValidReps(),
                d(r.getHoldSec()), d(r.getAngleDeg()), d(r.getFormScore()), d(r.getRomScore()), r.getMajorViolations(),
                d(r.getReliability()), r.getSource(), r.getStatus(), r.getStatusReason());
    }

    private AssessmentType ensureType() {
        return typeRepo.findByCode("PERIODIC").orElseGet(() -> {
            AssessmentType t = new AssessmentType();
            t.setCode("PERIODIC");
            t.setName("Đánh giá định kỳ thực hành");
            t.setDescription("Bài test thực hành đo bằng MediaPipe để xác nhận và cập nhật level.");
            return typeRepo.save(t);
        });
    }

    private static String name(Exercise e) { return e.getDisplayName() != null ? e.getDisplayName() : e.getName(); }

    private static Integer nonNegative(Integer v) { return v == null ? null : Math.max(0, v); }

    private static Double clamp(Double v, double min, double max) { return v == null ? null : Math.max(min, Math.min(max, v)); }

    private static BigDecimal dec(Double v, int scale) { return v == null ? null : BigDecimal.valueOf(v).setScale(scale, RoundingMode.HALF_UP); }

    private static Double d(BigDecimal v) { return v == null ? null : v.doubleValue(); }

    private static String fmt(double v) { return String.format(Locale.ROOT, "%.2f", v); }

    /** Nhãn hiển thị chỉ số. */
    static final class LevelGatesLabel {
        static String metric(String m) {
            return switch (m) { case "HOLD_SEC" -> "thời gian giữ"; case "ANGLE_DEG" -> "góc khớp"; default -> "số rep hợp lệ"; };
        }
    }
}
