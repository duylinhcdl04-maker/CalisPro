package com.calishealth.api.service.assessmentv2;

import com.calishealth.api.engine.v2.EvidenceRole;
import com.calishealth.api.engine.v2.RuleParams;
import com.calishealth.api.engine.v2.competency.CompetencyScoringEngine;
import com.calishealth.api.engine.v2.competency.CompetencyScoringEngine.*;
import com.calishealth.api.engine.v2.level.BaselineDecisionEngine;
import com.calishealth.api.engine.v2.level.LevelModelsV2.*;
import com.calishealth.api.engine.v2.progression.ProgressionLadderEngine;
import com.calishealth.api.engine.v2.progression.ProgressionModels.*;
import com.calishealth.api.service.assessmentv2.RuleSetV2.PerformanceReq;
import com.calishealth.api.service.assessmentv2.RuleSetV2.QualityReq;

import java.util.*;

/**
 * Dựng bằng chứng theo level cho BaselineDecisionEngine từ các attempt đã nộp (hàm thuần, ASSESSMENT_FRAMEWORK_V2 §8.1).
 *  - Bài mang yêu cầu của level L (Performance/Skill) cần đúng số attempt độc lập của level đó; mỗi vòng (attempt thứ i của mọi bài) là một "attempt" cho engine.
 *  - Competency/Overall/Skill dùng dữ liệu tổng hợp BẢO THỦ (MIN|MEAN theo rule set) của các attempt hợp lệ.
 *  - I19: dữ liệu thiếu ⇒ INSUFFICIENT_EVIDENCE, đo không tin cậy ⇒ UNRELIABLE; chỉ dữ liệu đủ + tin cậy chưa đạt mới là FAIL.
 */
public final class BaselineEvidenceBuilder {
    private static final String TYPE = "PERIODIC";

    public record TestItem(String questionCode, String exercise, String competency, String metric, int levelMin, int levelMax, boolean mandatory, int sortOrder) {}

    /** value theo metric của bài (rep hợp lệ | giây giữ | góc). Các metric chất lượng có thể null (không đo được ≠ không đạt). */
    public record AttemptData(AttemptStatus status, Double value, Double formScore, Double validRatio, Integer majorViolations, double reliability) {}

    public record Built(List<LevelEvidence> levels, Map<String, CompetencyScore> competencies, Double overall, List<LadderResult> ladders) {}

    public record Next(int level, String exercise, int attemptNo, String reason) {}

    private final ProgressionLadderEngine ladderEngine = new ProgressionLadderEngine();
    private final CompetencyScoringEngine scoring = new CompetencyScoringEngine();
    private final BaselineDecisionEngine decision = new BaselineDecisionEngine();

    /** Baseline: mỗi level đòi số attempt độc lập theo staircase (sàn bất biến L0-L1: 1, L2-L4: 2). */
    public Built build(RuleSetV2 rs, List<TestItem> items, Map<String, List<AttemptData>> attempts) {
        return build(rs, items, attempts, rank -> decision.attemptsRequired(rank, rs.params()));
    }

    /** attemptsFor: số attempt hợp lệ mỗi bài cần có ở một level (Periodic thường kỳ: 1, vì Stability lấy từ lịch sử thay cho attempt lặp). */
    public Built build(RuleSetV2 rs, List<TestItem> items, Map<String, List<AttemptData>> attempts, java.util.function.IntUnaryOperator attemptsFor) {
        RuleParams p = rs.params();
        String agg = aggregation(rs);

        // ---- năng lực đo được (LADDER + QUALITY) ----
        List<LadderResult> ladders = new ArrayList<>();
        Map<String, CompetencyScore> comps = new LinkedHashMap<>();
        Map<String, Double> scores = new HashMap<>();
        for (Ladder ladder : rs.ladders()) {
            Map<String, Observation> obs = new HashMap<>();
            List<Double> forms = new ArrayList<>(), rels = new ArrayList<>();
            for (Stage s : ladder.stages()) {
                List<AttemptData> all = attempts.getOrDefault(s.code(), List.of());
                List<AttemptData> valid = valid(all);
                if (!valid.isEmpty()) {
                    obs.put(s.code(), Observation.measured(aggregate(valid.stream().map(AttemptData::value).toList(), agg)));
                    valid.forEach(a -> { if (a.formScore() != null) forms.add(a.formScore()); rels.add(a.reliability()); });
                } else if (all.stream().anyMatch(a -> a.status() == AttemptStatus.INVALID_MEASUREMENT)) obs.put(s.code(), Observation.unreliable());
            }
            LadderResult lr = ladderEngine.evaluate(ladder, new LadderInput(obs, false));
            ladders.add(lr);

            List<GroupEvidence> ev = new ArrayList<>();
            double r = rels.isEmpty() ? 0 : rels.stream().mapToDouble(Double::doubleValue).average().orElse(0);
            if (lr.score() != null && r > 0) ev.add(GroupEvidence.of(EvidenceRole.PERFORMANCE_LADDER, Group.LADDER, lr.score(), Math.min(1, r)));
            if (lr.score() != null && !forms.isEmpty() && r > 0) ev.add(GroupEvidence.of(EvidenceRole.QUALITY_MEASURED, Group.QUALITY,   // chất lượng chỉ điều chỉnh điểm ladder, không tự tạo ra điểm năng lực
                    Math.max(0, Math.min(100, forms.stream().mapToDouble(Double::doubleValue).average().orElse(0))), Math.min(1, r)));
            CompetencyScore cs = scoring.score(TYPE, ladder.competency(), ev, EnumSet.of(Group.LADDER, Group.QUALITY), 1.0, p);
            comps.put(ladder.competency(), cs);
            if (cs.score() != null) scores.put(ladder.competency(), cs.score());
        }
        // ---- năng lực đo bằng góc, không có ladder (MOBILITY): trung bình điểm các bài; điểm bài = min(100, góc / góc mục tiêu * 100) ----
        Map<String, List<TestItem>> angleItems = new LinkedHashMap<>();
        for (TestItem it : items) if (isAngleCompetency(rs, it)) angleItems.computeIfAbsent(it.competency(), k -> new ArrayList<>()).add(it);
        for (var e : angleItems.entrySet()) {
            List<Double> itemScores = new ArrayList<>(), rels = new ArrayList<>();
            for (TestItem it : e.getValue()) {
                List<AttemptData> valid = valid(attempts.getOrDefault(it.exercise(), List.of()));
                if (valid.isEmpty()) continue;
                double angle = aggregate(valid.stream().map(AttemptData::value).toList(), agg);
                itemScores.add(Math.max(0, Math.min(100, angle / p.require("mobility.target." + it.exercise()) * 100)));
                valid.forEach(a -> rels.add(a.reliability()));
            }
            if (itemScores.isEmpty()) continue;
            double r = rels.stream().mapToDouble(Double::doubleValue).average().orElse(0);
            List<GroupEvidence> ev = r > 0 ? List.of(GroupEvidence.of(EvidenceRole.PERFORMANCE_LADDER, Group.LADDER,
                    itemScores.stream().mapToDouble(Double::doubleValue).average().orElse(0), Math.min(1, r))) : List.of();
            CompetencyScore cs = scoring.score(TYPE, e.getKey(), ev, EnumSet.of(Group.LADDER, Group.QUALITY), 1.0, p);
            comps.put(e.getKey(), cs);
            if (cs.score() != null) scores.put(e.getKey(), cs.score());
        }
        Double overall = scoring.overall(scores, rs.primaryCompetencies(), p);
        Map<String, LadderResult> byComp = new HashMap<>();
        for (LadderResult lr : ladders) byComp.put(rs.ladderByCode(lr.ladder()).orElseThrow().competency(), lr);

        // ---- bằng chứng theo level ----
        List<LevelEvidence> levels = new ArrayList<>();
        for (int rank = 1; rank <= 4; rank++) {
            LevelDef def = rs.level(rank);
            int required = attemptsFor.applyAsInt(rank);
            List<String> reqTests = requirementTests(rs, rank);

            List<Attempt> rounds = new ArrayList<>();
            for (int i = 0; i < required; i++) {
                AttemptStatus worst = AttemptStatus.VALID;
                boolean meets = true;
                boolean anyFail = false;
                for (String t : reqTests) {
                    List<AttemptData> list = attempts.getOrDefault(t, List.of());
                    AttemptData a = i < list.size() ? list.get(i) : null;
                    AttemptStatus st = a == null ? AttemptStatus.NOT_DONE : a.status();
                    worst = worse(worst, st);
                    if (st == AttemptStatus.VALID && !meets(rs, rank, t, a)) { meets = false; anyFail = true; }
                }
                // một bài đã đo tin cậy mà không đạt ⇒ vòng này đã đủ kết luận, dù bài khác chưa làm (trừ khi có bài đo không tin cậy/dừng)
                if (anyFail && worst == AttemptStatus.NOT_DONE) worst = AttemptStatus.VALID;
                rounds.add(new Attempt(reqTests.isEmpty() ? AttemptStatus.VALID : worst, meets));
            }

            // FAIL chỉ khi đã đo ĐỦ các bài của năng lực đó: điểm thấp trên dữ liệu chưa đủ là INSUFFICIENT_EVIDENCE, không phải bằng chứng tiêu cực (I19)
            GateStatus competencyGate = GateStatus.PASS;
            boolean allComplete = true;
            for (CompetencyReq req : def.competencyReqs()) {
                Double s = scores.get(req.competency());
                LadderResult lr = byComp.get(req.competency());
                boolean complete = coverageComplete(rs, items, attempts, rank, req.competency());
                allComplete &= complete;
                boolean angleBased = angleItems.containsKey(req.competency());
                boolean unreliable = lr != null && lr.state() == EvidenceState.UNRELIABLE;
                // Một bài góc chỉ có số đo hỏng thì không chấm được: không được bỏ bài đó rồi lấy trung bình hai bài còn lại (I19)
                boolean angleUnreliable = angleBased && angleItems.get(req.competency()).stream().anyMatch(it -> {
                    List<AttemptData> all = attempts.getOrDefault(it.exercise(), List.of());
                    return !all.isEmpty() && valid(all).isEmpty() && all.stream().anyMatch(a -> a.status() == AttemptStatus.INVALID_MEASUREMENT);
                });
                GateStatus g = angleUnreliable ? GateStatus.UNRELIABLE
                        : s == null ? (unreliable ? GateStatus.UNRELIABLE : GateStatus.INSUFFICIENT_EVIDENCE)
                        : s >= req.min() ? GateStatus.PASS : complete ? GateStatus.FAIL : GateStatus.INSUFFICIENT_EVIDENCE;
                // năng lực đo bằng góc là trung bình CẢ BA bài: thiếu bài thì chưa kết luận được (không để bỏ bài yếu rồi vẫn qua cổng)
                if (angleBased && !complete && g == GateStatus.PASS) g = GateStatus.INSUFFICIENT_EVIDENCE;
                competencyGate = combine(competencyGate, g);
            }

            GateStatus skillGate = GateStatus.PASS;
            for (SkillReq req : def.skillReqs()) {
                List<AttemptData> all = attempts.getOrDefault(req.stage(), List.of()), valid = valid(all);
                Stage stage = rs.ladderOfStage(req.stage()).flatMap(l -> l.stages().stream().filter(s -> s.code().equals(req.stage())).findFirst()).orElse(null);
                GateStatus g;
                if (stage == null) g = GateStatus.INSUFFICIENT_EVIDENCE;
                else if (valid.stream().anyMatch(a -> a.value() < stage.passValue())) g = GateStatus.FAIL;      // F2: hai attempt độc lập cùng đạt = đủ
                else if (valid.size() < required) g = all.stream().anyMatch(a -> a.status() == AttemptStatus.INVALID_MEASUREMENT) ? GateStatus.UNRELIABLE : GateStatus.INSUFFICIENT_EVIDENCE;
                else g = GateStatus.PASS;
                skillGate = combine(skillGate, g);
            }

            GateStatus overallGate = overall == null ? GateStatus.INSUFFICIENT_EVIDENCE
                    : overall >= def.promoteMin() ? GateStatus.PASS : allComplete ? GateStatus.FAIL : GateStatus.INSUFFICIENT_EVIDENCE;
            levels.add(new LevelEvidence(rank, rounds, overallGate, competencyGate, skillGate, GateStatus.PASS));
        }
        return new Built(levels, comps, overall, ladders);
    }

    /** Bước tiếp theo của staircase: bài/attempt còn thiếu ở level thấp nhất chưa đủ bằng chứng. */
    public Optional<Next> next(RuleSetV2 rs, List<TestItem> items, Map<String, List<AttemptData>> attempts) {
        for (int rank = 1; rank <= 4; rank++) {
            int required = decision.attemptsRequired(rank, rs.params());
            List<String> reqTests = requirementTests(rs, rank);
            for (int i = 0; i < required; i++) {
                for (String t : reqTests) {
                    if (attempts.getOrDefault(t, List.of()).size() <= i)
                        return Optional.of(new Next(rank, t, i + 1, "REQUIREMENT_TEST_L" + rank));
                }
            }
            final int lvl = rank;
            List<TestItem> coverage = items.stream().filter(it -> it.levelMin() <= lvl && lvl <= it.levelMax() && !reqTests.contains(it.exercise()))
                    .sorted(Comparator.comparingInt(TestItem::sortOrder)).toList();
            for (TestItem it : coverage) {
                if (attempts.getOrDefault(it.exercise(), List.of()).isEmpty() && it.mandatory())
                    return Optional.of(new Next(rank, it.exercise(), 1, "COVERAGE_TEST_L" + rank));
            }
            // năng lực mà level yêu cầu nhưng chỉ đo được bằng các bài góc (tuỳ chọn): đề xuất bài chưa đo, nếu không user sẽ kẹt không biết làm gì
            Set<String> requiredComps = new HashSet<>();
            rs.level(rank).competencyReqs().forEach(c -> requiredComps.add(c.competency()));
            for (TestItem it : coverage) {
                if (requiredComps.contains(it.competency()) && isAngleCompetency(rs, it) && attempts.getOrDefault(it.exercise(), List.of()).isEmpty())
                    return Optional.of(new Next(rank, it.exercise(), 1, "COVERAGE_TEST_L" + rank));
            }
        }
        return Optional.empty();
    }

    /** Bài đo góc thuộc năng lực không có ladder (MOBILITY): điểm lấy từ góc đo, không từ nấc tiến triển. */
    static boolean isAngleCompetency(RuleSetV2 rs, TestItem it) {
        return "ANGLE_DEG".equals(it.metric()) && rs.ladders().stream().noneMatch(l -> l.competency().equals(it.competency()));
    }

    // ---------------------------------------------------------------- helpers

    /** Đã đo đủ mọi bài bắt buộc (hoặc bài mang yêu cầu) của năng lực ở level này: mỗi bài có ít nhất một attempt. */
    boolean coverageComplete(RuleSetV2 rs, List<TestItem> items, Map<String, List<AttemptData>> attempts, int rank, String competency) {
        List<String> req = requirementTests(rs, rank);
        for (TestItem it : items) {
            if (!it.competency().equals(competency)) continue;
            boolean needed = (it.mandatory() && it.levelMin() <= rank && rank <= it.levelMax()) || req.contains(it.exercise())
                    || (isAngleCompetency(rs, it) && it.levelMin() <= rank && rank <= it.levelMax());
            if (needed && attempts.getOrDefault(it.exercise(), List.of()).isEmpty()) return false;
        }
        return true;
    }

    /** Bài mang yêu cầu Performance hoặc Skill của level (theo thứ tự xuất hiện, không trùng). */
    static List<String> requirementTests(RuleSetV2 rs, int rank) {
        LinkedHashSet<String> out = new LinkedHashSet<>();
        rs.performance(rank).forEach(r -> { if (r.exercise() != null) out.add(r.exercise()); });
        rs.level(rank).skillReqs().forEach(r -> out.add(r.stage()));
        return List.copyOf(out);
    }

    private boolean meets(RuleSetV2 rs, int rank, String exercise, AttemptData a) {
        for (PerformanceReq r : rs.performance(rank)) {
            if (!exercise.equals(r.exercise())) continue;
            if (a.value() == null || !compare(a.value(), r.op(), r.value())) return false;
        }
        Stage stage = rs.ladderOfStage(exercise).flatMap(l -> l.stages().stream().filter(s -> s.code().equals(exercise)).findFirst()).orElse(null);
        boolean isSkillTest = rs.level(rank).skillReqs().stream().anyMatch(s -> s.stage().equals(exercise));
        if (isSkillTest && stage != null && (a.value() == null || a.value() < stage.passValue())) return false;
        for (QualityReq q : rs.quality(rank)) {
            Double actual = switch (q.metric()) {
                case "FORM_SCORE" -> a.formScore();
                case "VALID_RATIO" -> a.validRatio();
                case "MAJOR_VIOLATIONS" -> a.majorViolations() == null ? null : a.majorViolations().doubleValue();
                default -> null;
            };
            if (actual != null && !compare(actual, q.op(), q.value())) return false;     // metric không đo được ≠ không đạt (I19)
        }
        return true;
    }

    private static boolean compare(double actual, String op, double required) {
        return "LTE".equals(op) ? actual <= required : actual >= required;
    }

    private static List<AttemptData> valid(List<AttemptData> all) {
        return all.stream().filter(a -> a.status() == AttemptStatus.VALID && a.value() != null).toList();
    }

    private static double aggregate(List<Double> values, String agg) {
        return switch (agg) {
            case "MIN" -> values.stream().mapToDouble(Double::doubleValue).min().orElse(0);
            case "MEAN" -> values.stream().mapToDouble(Double::doubleValue).average().orElse(0);
            default -> throw new IllegalStateException("baseline.attempt_aggregation không hợp lệ: " + agg);
        };
    }

    private static String aggregation(RuleSetV2 rs) {
        String a = rs.textParams().get("baseline.attempt_aggregation");
        if (a == null) throw new IllegalStateException("Rule set thiếu tham số baseline.attempt_aggregation");
        return a;
    }

    /** Thứ tự nghiêm trọng của trạng thái attempt trong một vòng: đo không tin cậy > dừng > chưa làm > hợp lệ. */
    private static AttemptStatus worse(AttemptStatus a, AttemptStatus b) {
        List<AttemptStatus> order = List.of(AttemptStatus.VALID, AttemptStatus.NOT_DONE, AttemptStatus.USER_ABORTED, AttemptStatus.INVALID_MEASUREMENT);
        return order.indexOf(a) >= order.indexOf(b) ? a : b;
    }

    /** Gộp cổng: UNRELIABLE > FAIL > INSUFFICIENT_EVIDENCE > PASS (đo không tin cậy chặn mọi kết luận). */
    private static GateStatus combine(GateStatus a, GateStatus b) {
        List<GateStatus> order = List.of(GateStatus.PASS, GateStatus.INSUFFICIENT_EVIDENCE, GateStatus.FAIL, GateStatus.UNRELIABLE);
        return order.indexOf(a) >= order.indexOf(b) ? a : b;
    }
}
