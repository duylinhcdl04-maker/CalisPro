package com.calishealth.api.engine.motion;

import com.calishealth.api.engine.motion.MotionTypes.*;

import java.util.*;

/**
 * Bộ điều phối một phiên phân tích chuyển động (1 instance / phiên, có trạng thái).
 *
 *   PoseFrame -> FeatureEngine -> (mỗi rule PUBLISHED, đúng pha, đúng góc camera)
 *     -> kiểm tra tin cậy -> MetricEvaluator.value -> ThresholdClassifier -> RulePersistenceTracker -> Violation
 *     -> ViolationAggregator (phản hồi) + Rep validation + Movement quality
 *
 * Tất định: cùng chuỗi khung + cùng cấu hình -> cùng kết quả. Không gọi Gemini/TTS.
 */
public final class MotionRuleEngine {
    public static final String RELIABLE = "RELIABLE", UNRELIABLE = "UNRELIABLE";

    private final ProfileDef profile;
    private final List<RuleDef> rules;
    private final String sessionCameraView;
    private final FeatureEngine features;
    private final RulePersistenceTracker tracker = new RulePersistenceTracker();
    private final ViolationAggregator aggregator = new ViolationAggregator();
    private final Map<String, Long> cooldownByCode = new HashMap<>();
    private final Map<Long, Long> lastEvaluated = new HashMap<>();
    private final Map<Long, Severity> activeSeverity = new HashMap<>();

    // ---- rep đang diễn ra & thống kê phiên ----
    private final Map<String, Severity> repViolations = new LinkedHashMap<>();
    private boolean repInvalid = false;
    private final Map<String, Severity> sessionViolations = new LinkedHashMap<>();
    private final List<RepResult> reps = new ArrayList<>();
    private final Map<String, Integer> violationCounts = new LinkedHashMap<>();
    private int frames = 0, trackedFrames = 0, criticalCount = 0;
    private double poseSum = 0, visSum = 0;
    private int visCount = 0;
    private double holdSec = 0, holdStartMs = -1;

    /**
     * @param includeUnpublished true chỉ dùng cho Rule Tester (replay bản nháp); runtime thật luôn false
     *                           -> chỉ rule PUBLISHED được chạy (ruleEniges §37).
     */
    public MotionRuleEngine(ProfileDef profile, List<RuleDef> allRules, String sessionCameraView, boolean includeUnpublished) {
        this.profile = profile;
        this.rules = allRules.stream().filter(r -> includeUnpublished || "PUBLISHED".equals(r.status())).toList();
        this.sessionCameraView = sessionCameraView;
        List<Measurement> ms = new ArrayList<>(this.rules.stream().map(r -> r.measurement()).toList());
        this.features = new FeatureEngine(profile, ms);
        for (RuleDef r : this.rules) {
            if (r.feedbackCode() != null) cooldownByCode.merge(r.feedbackCode(), r.cooldownMs(), (left, right) -> Math.max(left, right));
        }
    }

    public List<RuleDef> activeRules() { return rules; }

    private RuleDef ruleById(long id) {
        for (RuleDef r : rules) if (r.id() == id) return r;
        throw new IllegalStateException("Rule " + id + " không thuộc phiên");
    }

    // ============================== Một khung ==============================

    public FrameEvaluation process(PoseFrame frame) {
        MotionFeatures f = features.process(frame);
        frames++;
        long t = f.timestampMs();
        boolean reliableFrame = f.poseDetected() && f.poseConfidence() >= profile.minPoseConfidence();
        if (f.poseDetected()) poseSum += f.poseConfidence();
        if (reliableFrame) trackedFrames++;
        trackHold(f);
        // Độ thấy khớp tính cả landmark của chính chỉ số đếm rep/giữ: phiên chưa có rule PUBLISHED nào vẫn có độ thấy thật,
        // thay vì 0 (0 làm mọi lần đo bị loại LANDMARKS_NOT_VISIBLE ở Baseline/Periodic).
        if (f.poseDetected() && profile.repMetric() != null) {
            for (int p : profile.repMetric().requiredLandmarks()) { visSum += f.visibility().getOrDefault(p, 0.0); visCount++; }
        }

        List<RuleResult> results = new ArrayList<>();
        List<Violation> violations = new ArrayList<>();
        for (RuleDef r : rules) {
            MetricEvaluator ev = MetricEvaluatorFactory.get(r.measurement().type());
            if (!cameraMatches(r)) { results.add(new RuleResult(r, Status.SKIPPED, null, null, "Góc camera của phiên khác góc camera của rule.")); continue; }
            boolean repLevel = ev.timing() == Timing.REP;
            if (repLevel ? f.completedRep() == null : !r.appliesToPhase(f.phase())) continue;
            if (!repLevel && r.evaluationIntervalMs() > 0) {
                Long last = lastEvaluated.get(r.id());
                if (last != null && t - last < r.evaluationIntervalMs()) continue;
            }
            lastEvaluated.put(r.id(), t);

            String unreliable = reliabilityProblem(r, ev, f);
            if (unreliable != null) {
                tracker.update(r, Status.UNRELIABLE, t);
                results.add(new RuleResult(r, Status.UNRELIABLE, null, null, unreliable));
                continue;
            }
            Double value = ev.value(r.measurement(), r.unit(), f);
            if (value == null) {
                tracker.update(r, Status.UNRELIABLE, t);
                results.add(new RuleResult(r, Status.UNRELIABLE, null, null, "Không có giá trị đo cho " + r.measurement().type() + "."));
                continue;
            }
            Classification c = ThresholdClassifier.classify(r, value);
            results.add(new RuleResult(r, c.status(), value, c.evaluatedValue(), null));
            if (!ev.measuresReliability()) visit(r, f);

            Severity triggered = repLevel ? c.status().severity() : tracker.update(r, c.status(), t);
            if (triggered != null) violations.add(violation(r, triggered, c, f));
        }

        // Vi phạm mới (vừa vượt persistence hoặc tăng mức) -> ghi sự kiện; vi phạm kéo dài không ghi lặp
        List<Violation> newViolations = new ArrayList<>();
        Set<Long> nowActive = new HashSet<>();
        for (Violation v : violations) {
            nowActive.add(v.ruleId());
            Severity prev = activeSeverity.get(v.ruleId());
            if (prev == null || v.severity().ordinal() > prev.ordinal()) {
                newViolations.add(v);
                violationCounts.merge(v.ruleCode(), 1, (left, right) -> left + right);
                if (v.severity() == Severity.CRITICAL) criticalCount++;
            }
            activeSeverity.put(v.ruleId(), v.severity());
            boolean inRep = f.completedRep() != null || FeatureEngine.REP_PHASES.subList(1, 4).contains(f.phase());
            if (inRep) {
                repViolations.merge(v.ruleCode(), v.severity(), (left, right) -> left.ordinal() >= right.ordinal() ? left : right);
                if (ruleById(v.ruleId()).invalidatesRep(v.severity())) repInvalid = true;
            }
            sessionViolations.merge(v.ruleCode(), v.severity(), (left, right) -> left.ordinal() >= right.ordinal() ? left : right);
        }
        activeSeverity.keySet().retainAll(nowActive);

        RepResult completed = f.completedRep() == null ? null : closeRep(f.completedRep());
        FeedbackDecision decision = aggregator.decide(violations, cooldownByCode, t);
        boolean stop = violations.stream().anyMatch(v -> v.severity() == Severity.CRITICAL && v.stopExercise());
        return new FrameEvaluation(t, f.phase(), f.repNumber(), reliableFrame ? RELIABLE : UNRELIABLE, results, violations,
                newViolations, decision, completed, stop);
    }

    // ============================== Rep & chất lượng ==============================

    private RepResult closeRep(RepSummary s) {
        boolean valid = s.complete() && !repInvalid;
        List<String> codes = new ArrayList<>(repViolations.keySet());
        if (!s.complete()) codes.add("INCOMPLETE_REP");
        RepResult r = new RepResult(s.repNumber(), s.startMs(), s.endMs(), s.complete(), valid,
                MotionScoring.quality(repViolations.values(), s.complete()), codes, s.values());
        reps.add(r);
        repViolations.clear();
        repInvalid = false;
        return r;
    }

    private void trackHold(MotionFeatures f) {
        if ("HOLD".equals(f.phase())) {
            if (holdStartMs < 0) holdStartMs = f.timestampMs();
            holdSec = Math.max(holdSec, (f.timestampMs() - holdStartMs) / 1000.0);
        } else {
            holdStartMs = -1;
        }
    }

    public SessionSummary summary() {
        int valid = (int) reps.stream().filter(r -> r.valid()).count();
        int quality = reps.isEmpty()
                ? MotionScoring.quality(sessionViolations.values(), true)
                : (int) Math.round(reps.stream().mapToInt(r -> r.qualityScore()).average().orElse(0));
        Double rom = null;
        Optional<RuleDef> romRule = rules.stream().filter(r -> r.measurement().type() == MetricType.ROM).findFirst();
        if (romRule.isPresent()) {
            String key = romRule.get().measurement().featureKey();
            rom = reps.stream().map(r -> r.metrics().get(key)).filter(Objects::nonNull).mapToDouble(d -> d).average().orElse(Double.NaN);
        }
        return new SessionSummary(reps.size(), valid, reps.size() - valid, quality,
                frames == 0 ? 0 : poseSum / frames, visCount == 0 ? 0 : visSum / visCount,
                frames == 0 ? 0 : trackedFrames / (double) frames, holdSec, rom == null || rom.isNaN() ? 0 : rom,
                criticalCount, Map.copyOf(violationCounts), List.copyOf(reps), frames);
    }

    // ============================== Helpers ==============================

    private boolean cameraMatches(RuleDef r) {
        return r.cameraView() == null || "ANY".equals(r.cameraView()) || sessionCameraView == null
                || "ANY".equals(sessionCameraView) || r.cameraView().equals(sessionCameraView);
    }

    /** Dữ liệu không đủ tin cậy -> không được kết luận form sai (ruleEniges §28). */
    private String reliabilityProblem(RuleDef r, MetricEvaluator ev, MotionFeatures f) {
        if (ev.measuresReliability()) return f.poseDetected() ? null : "Không phát hiện tư thế.";
        if (!f.poseDetected()) return "Không phát hiện tư thế.";
        if (f.poseConfidence() < profile.minPoseConfidence()) return "Độ tin cậy tư thế thấp.";
        if (ev.timing() == Timing.REP) return null;   // đã kiểm tra trong suốt rep
        for (int p : r.measurement().requiredLandmarks()) {
            if (f.visibility().getOrDefault(p, 0.0) < profile.minVisibility(p)) return "Landmark #" + p + " không đủ rõ.";
        }
        return null;
    }

    private void visit(RuleDef r, MotionFeatures f) {
        for (int p : r.measurement().requiredLandmarks()) { visSum += f.visibility().getOrDefault(p, 0.0); visCount++; }
    }

    private static Violation violation(RuleDef r, Severity s, Classification c, MotionFeatures f) {
        return new Violation(r.id(), r.code(), r.version(), r.name(), s, r.priority(), r.measurement().type(),
                c.observedValue(), c.evaluatedValue(), r.unit(), r.target(), r.normalMin(), r.normalMax(),
                ThresholdClassifier.expected(r), r.feedbackCode(), r.invalidatesRep(s), r.stopExercise(), f.phase(),
                f.timestampMs(), f.repNumber());
    }

    /** Rule Tester: phân loại một giá trị đo theo cấu hình hiện tại (không persistence). */
    public static Classification testValue(RuleDef r, double observed) {
        return ThresholdClassifier.classify(r, observed);
    }
}
