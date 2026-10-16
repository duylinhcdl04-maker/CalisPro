package com.calishealth.api.service.assessmentv2;

import com.calishealth.api.engine.v2.EvidenceRole;
import com.calishealth.api.engine.v2.RuleParams;
import com.calishealth.api.engine.v2.competency.CompetencyScoringEngine;
import com.calishealth.api.engine.v2.competency.CompetencyScoringEngine.*;
import com.calishealth.api.engine.v2.consistency.ConsistencyChecker;
import com.calishealth.api.engine.v2.level.FitnessLevelEngine;
import com.calishealth.api.engine.v2.level.LevelModelsV2.*;
import com.calishealth.api.engine.v2.progression.ProgressionLadderEngine;
import com.calishealth.api.engine.v2.progression.ProgressionModels.*;
import com.calishealth.api.service.assessmentv2.TemplateMeta.QuestionMeta;

import java.util.*;

/**
 * Luồng chấm điểm Initial (ASSESSMENT_FRAMEWORK_V2 §7.2) - thuần, không đọc/ghi DB:
 * chuẩn hoá đáp án → ladder (stage cao nhất) → điểm năng lực → mâu thuẫn → độ chắc chắn → level tạm thời (≤ L2).
 * Kinh nghiệm/hồ sơ/mục tiêu/ràng buộc/an toàn KHÔNG tham gia điểm; chỉ dữ liệu role chấm điểm được dùng.
 */
public final class InitialPipeline {
    private static final String TYPE = "INITIAL";

    private final ProgressionLadderEngine ladderEngine = new ProgressionLadderEngine();
    private final CompetencyScoringEngine scoring = new CompetencyScoringEngine();
    private final ConsistencyChecker consistency = new ConsistencyChecker();
    private final FitnessLevelEngine levelEngine = new FitnessLevelEngine();
    private final VisibilityEvaluator visibility = new VisibilityEvaluator();

    public record InitialComputation(
            List<LadderResult> ladders, Map<String, CompetencyScore> competencies, Double overall, double answerConfidence,
            List<ConsistencyChecker.Flag> flags, Map<String, String> dataQualityByCompetency, String dataQuality,
            Map<String, SkillState> skills, InitialResult level, Map<String, Double> effectiveGroupWeights,
            Map<String, Double> ladderReliability, Set<String> visibleQuestions) {}

    public InitialComputation compute(RuleSetV2 rs, TemplateMeta t, Map<String, Object> answers) {
        RuleParams p = rs.params();
        Set<String> visible = new LinkedHashSet<>();
        visibility.visibleQuestions(t, answers, rs).forEach(q -> visible.add(q.code()));

        // ---- 1. Ladder theo từng năng lực ----
        List<LadderResult> ladderResults = new ArrayList<>();
        Map<String, LadderResult> byCompetency = new HashMap<>();
        Map<String, Double> nodeValues = new HashMap<>();
        Set<String> failedVerification = new TreeSet<>();
        Map<String, Double> ladderReliability = new HashMap<>();

        for (Ladder ladder : rs.ladders()) {
            QuestionMeta nodeQ = find(t, "LADDER_NODE", ladder.code());
            if (nodeQ == null || !visible.contains(nodeQ.code())) continue;
            QuestionMeta valueQ = findValue(t, ladder.code(), false), verifyQ = findValue(t, ladder.code(), true);

            Map<String, Observation> obs = new HashMap<>();
            boolean explicitNone = false;
            Object node = answers.get(nodeQ.code());
            if ("NONE".equals(node)) explicitNone = true;
            else if (node instanceof String claimed && !claimed.equals("NOT_TRIED")) {
                List<Stage> sorted = ladder.stages().stream().sorted(Comparator.comparingInt(Stage::rank)).toList();
                Stage stage = sorted.stream().filter(s -> s.code().equals(claimed)).findFirst()
                        .orElseThrow(() -> new IllegalArgumentException("Stage không thuộc ladder " + ladder.code() + ": " + claimed));
                Double value = number(answers, valueQ);
                // chọn stage = khai đã làm được ít nhất một lần; thiếu số ⇒ lấy đúng ngưỡng đạt (không suy ra hiệu năng cao hơn)
                obs.put(stage.code(), Observation.measured(value != null ? value : stage.passValue()));
                Double verify = number(answers, verifyQ);
                if (verify != null && visible.contains(verifyQ.code())) {
                    Stage below = sorted.stream().filter(s -> s.rank() < stage.rank()).reduce((a, b) -> b).orElse(null);
                    if (below != null) {
                        obs.put(below.code(), Observation.measured(verify));
                        if (verify < below.passValue()) failedVerification.add(ladder.competency());
                    }
                }
            }
            LadderResult res = ladderEngine.evaluate(ladder, new LadderInput(obs, explicitNone));
            ladderResults.add(res);
            byCompetency.put(ladder.competency(), res);
            if (explicitNone) ladder.stages().forEach(s -> nodeValues.put(s.code(), 0.0));
            res.stages().forEach(s -> { if ((s.status() == StageStatus.PASS || s.status() == StageStatus.FAIL) && s.value() != null) nodeValues.put(s.stage(), s.value()); });

            ladderReliability.put(ladder.competency(), reliability(p, t, answers, visible, ladder.competency(), nodeQ.reliabilityClass()));
        }

        // ---- 2. Bằng chứng theo nhóm cho từng năng lực (chỉ role chấm điểm) ----
        Map<String, List<GroupEvidence>> evidence = new HashMap<>();
        Map<String, Set<Group>> displayed = new HashMap<>();
        for (String c : rs.primaryCompetencies()) { evidence.put(c, new ArrayList<>()); displayed.put(c, EnumSet.noneOf(Group.class)); }

        for (Map.Entry<String, LadderResult> e : byCompetency.entrySet()) {
            LadderResult r = e.getValue();
            displayed.computeIfAbsent(e.getKey(), k -> EnumSet.noneOf(Group.class)).add(Group.LADDER);
            if (r.score() != null)
                evidence.computeIfAbsent(e.getKey(), k -> new ArrayList<>())
                        .add(GroupEvidence.of(EvidenceRole.PERFORMANCE_LADDER, Group.LADDER, r.score(), ladderReliability.get(e.getKey())));
        }
        Map<String, List<Double>> choiceScores = new HashMap<>();
        Map<String, String> choiceClass = new HashMap<>();
        for (QuestionMeta q : t.questions()) {
            if (!"SELF_RATING_CHOICE".equals(q.evidenceRole()) || !visible.contains(q.code())) continue;
            displayed.computeIfAbsent(q.category(), k -> EnumSet.noneOf(Group.class)).add(Group.CHOICE);
            choiceClass.putIfAbsent(q.category(), q.reliabilityClass());
            Object a = answers.get(q.code());
            if (a instanceof String code) q.option(code).map(o -> o.score()).ifPresent(sc -> { if (sc != null) choiceScores.computeIfAbsent(q.category(), k -> new ArrayList<>()).add(sc); });
        }
        choiceScores.forEach((c, list) -> evidence.computeIfAbsent(c, k -> new ArrayList<>()).add(GroupEvidence.of(EvidenceRole.SELF_RATING_CHOICE, Group.CHOICE,
                list.stream().mapToDouble(Double::doubleValue).average().orElse(0), scoring.classReliability(p, choiceClass.get(c)))));

        // ---- 3. Điểm thô (q = 1) → mâu thuẫn → điểm + độ chắc chắn theo q ----
        Map<String, Double> rawScores = new HashMap<>();
        for (String c : rs.primaryCompetencies()) {
            Double s = scoring.score(TYPE, c, evidence.get(c), displayed.get(c), 1.0, p).score();
            if (s != null) rawScores.put(c, s);
        }
        Map<String, String> choiceAnswers = new HashMap<>();
        answers.forEach((k, v) -> { if (v instanceof String s) choiceAnswers.put(k, s); });
        Map<String, Double> bands = new HashMap<>();
        for (String band : List.of("BEGINNER", "INTERMEDIATE", "ADVANCED", "ELITE")) p.find("band." + band).ifPresent(v -> bands.put(band, v));
        List<ConsistencyChecker.Flag> flags = consistency.check(rs.consistencyRules(),
                new ConsistencyChecker.Facts(choiceAnswers, nodeValues, failedVerification, rawScores, bands));

        Map<String, String> quality = new HashMap<>();
        for (String c : rs.primaryCompetencies()) {
            boolean conflict = flags.stream().anyMatch(f -> f.severity().equals("CONFLICT") && f.affected().contains(c));
            boolean warn = flags.stream().anyMatch(f -> f.severity().equals("WARNING") && f.affected().contains(c));
            quality.put(c, conflict ? "CONFLICTED" : warn ? "MEDIUM" : "HIGH");
        }
        Map<String, CompetencyScore> scores = new LinkedHashMap<>();
        Map<String, Double> competencyScores = new HashMap<>();
        Map<String, Double> weightsUsed = new TreeMap<>();
        double confNum = 0, confDen = 0;
        for (String c : rs.primaryCompetencies()) {
            CompetencyScore cs = scoring.score(TYPE, c, evidence.get(c), displayed.get(c), p.require("quality." + quality.get(c)), p);
            scores.put(c, cs);
            if (cs.score() != null) competencyScores.put(c, cs.score());
            for (GroupEvidence ge : evidence.get(c)) weightsUsed.put(c + "." + ge.group().name(), p.groupWeight(TYPE, c, ge.group().name()));
            double w = p.require("overall.weight." + c);
            confNum += w * cs.answerConfidence();
            confDen += w;
        }
        Double overall = scoring.overall(competencyScores, rs.primaryCompetencies(), p);
        double answerConfidence = confDen == 0 ? 0 : confNum / confDen;

        // ---- 4. Skill state từ ladder (tự khai báo) → level tạm thời ----
        Map<String, SkillState> skills = skillStates(rs, byCompetency);
        Set<String> conflicted = new TreeSet<>();
        flags.stream().filter(f -> f.severity().equals("CONFLICT")).forEach(f -> conflicted.addAll(f.affected()));
        InitialResult level = levelEngine.evaluateInitial(new InitialInput(overall, competencyScores, skills, conflicted, answerConfidence, rs.levels()), p);

        String dq = quality.containsValue("CONFLICTED") ? "CONFLICTED" : quality.containsValue("MEDIUM") ? "MEDIUM" : "HIGH";
        return new InitialComputation(ladderResults, scores, overall, answerConfidence, flags, quality, dq, skills, level, weightsUsed, ladderReliability, visible);
    }

    /** Stage được khai (hoặc suy ra) ⇒ ACHIEVED_SELF_REPORTED; ladder đã trả lời mà stage cao hơn "bài khó nhất" ⇒ NOT_ACHIEVED; còn lại UNKNOWN. */
    private Map<String, SkillState> skillStates(RuleSetV2 rs, Map<String, LadderResult> byCompetency) {
        Map<String, SkillState> out = new HashMap<>();
        for (Ladder l : rs.ladders()) {
            LadderResult r = byCompetency.get(l.competency());
            for (Stage s : l.stages()) {
                SkillState st = SkillState.UNKNOWN;
                if (r != null) {
                    StageStatus status = r.stages().stream().filter(x -> x.stage().equals(s.code())).findFirst().orElseThrow().status();
                    if (status == StageStatus.PASS || status == StageStatus.INFERRED_PASS) st = SkillState.ACHIEVED_SELF_REPORTED;
                    else if (status == StageStatus.FAIL || status == StageStatus.REJECTED_PREREQ) st = SkillState.NOT_ACHIEVED;
                    else if (r.state() == EvidenceState.NONE_ACHIEVED) st = SkillState.NOT_ACHIEVED;
                    else if (r.state() == EvidenceState.ACHIEVED && r.highestRank() != null && s.rank() > r.highestRank()) st = SkillState.NOT_ACHIEVED;
                }
                out.put(s.code(), st);
            }
        }
        return out;
    }

    private double reliability(RuleParams p, TemplateMeta t, Map<String, Object> answers, Set<String> visible, String competency, String reliabilityClass) {
        String form = null, recency = null;
        for (QuestionMeta q : t.questions()) {
            if (!"RELIABILITY_MODIFIER".equals(q.evidenceRole()) || q.config() == null || !q.config().has("modifies")
                    || !competency.equals(q.config().get("modifies").asString()) || !visible.contains(q.code())) continue;
            if (answers.get(q.code()) instanceof String code) {
                if (p.find("form_factor." + code).isPresent()) form = code;
                else if (p.find("recency." + code).isPresent()) recency = code;
            }
        }
        return scoring.itemReliability(p, reliabilityClass == null ? "HIGH" : reliabilityClass, form, recency);
    }

    private static QuestionMeta find(TemplateMeta t, String answerKind, String ladderCode) {
        return t.questions().stream().filter(q -> answerKind.equals(q.answerKind()) && ladderCode.equals(q.ladderCode())).findFirst().orElse(null);
    }

    private static QuestionMeta findValue(TemplateMeta t, String ladderCode, boolean verify) {
        return t.questions().stream().filter(q -> "LADDER_VALUE".equals(q.answerKind()) && ladderCode.equals(q.ladderCode())
                && verify == (q.config() != null && q.config().has("verifiesStageBelowClaimed"))).findFirst().orElse(null);
    }

    private static Double number(Map<String, Object> answers, QuestionMeta q) {
        if (q == null) return null;
        Object v = answers.get(q.code());
        return v instanceof Number n ? n.doubleValue() : null;
    }
}
