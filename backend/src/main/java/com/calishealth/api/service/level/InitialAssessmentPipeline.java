package com.calishealth.api.service.level;

import com.calishealth.api.dto.LevelEngineDtos.*;
import com.calishealth.api.engine.config.RuleSetConfig;
import com.calishealth.api.engine.config.RuleSetConfig.LadderNode;
import com.calishealth.api.engine.level.*;
import com.calishealth.api.engine.level.CompetencyScoringEngine.*;
import com.calishealth.api.engine.level.LevelModels.Reason;
import com.calishealth.api.engine.skill.SkillGraph;
import com.calishealth.api.entity.*;
import com.calishealth.api.repository.*;
import com.calishealth.api.service.assessment.AssessmentScoringEngine;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

/**
 * Bài test đầu vào (TỰ KHAI BÁO) -> năng lực tạm thời -> level PROVISIONAL -> cập nhật ràng buộc/mục tiêu -> Cycle #1.
 * Không có rule set ACTIVE thì bỏ qua (giữ hành vi cũ của bài test đầu vào).
 */
@Service
public class InitialAssessmentPipeline {
    /** Category cũ -> năng lực (chỉ các category ánh xạ rõ ràng; UPPER_BODY_STRENGTH bắt buộc ánh xạ theo từng câu). */
    private static final Map<String, String> CATEGORY_FALLBACK = Map.ofEntries(
            Map.entry("LOWER_BODY_STRENGTH", "LEGS"), Map.entry("CORE_STABILITY", "CORE"), Map.entry("CORE", "CORE"),
            Map.entry("SHOULDER_MOBILITY", "MOBILITY"), Map.entry("HIP_MOBILITY", "MOBILITY"), Map.entry("ANKLE_MOBILITY", "MOBILITY"),
            Map.entry("BALANCE", "SKILL"), Map.entry("BODY_CONTROL", "SKILL"), Map.entry("CALISTHENICS_SKILL", "SKILL"),
            Map.entry("CARDIO_ENDURANCE", "ENDURANCE"));

    private final RuleSetRepository ruleSetRepo;
    private final RuleSetProvider ruleSets;
    private final QuestionCompetencyMappingRepository mappingRepo;
    private final LevelDataService levelData;
    private final SkillProgressService skills;
    private final TrainingCycleService cycles;
    private final UserGoalRepository userGoalRepo;
    private final GoalRepository goalRepo;
    private final UserRepository userRepo;
    private final UserProfileRepository profileRepo;
    private final AssessmentSessionRepository sessionRepo;
    private final ObjectMapper json = new ObjectMapper();

    public InitialAssessmentPipeline(RuleSetRepository ruleSetRepo, RuleSetProvider ruleSets, QuestionCompetencyMappingRepository mappingRepo,
                                     LevelDataService levelData, SkillProgressService skills, TrainingCycleService cycles,
                                     UserGoalRepository userGoalRepo, GoalRepository goalRepo, UserRepository userRepo,
                                     UserProfileRepository profileRepo, AssessmentSessionRepository sessionRepo) {
        this.ruleSetRepo = ruleSetRepo;
        this.ruleSets = ruleSets;
        this.mappingRepo = mappingRepo;
        this.levelData = levelData;
        this.skills = skills;
        this.cycles = cycles;
        this.userGoalRepo = userGoalRepo;
        this.goalRepo = goalRepo;
        this.userRepo = userRepo;
        this.profileRepo = profileRepo;
        this.sessionRepo = sessionRepo;
    }

    public boolean enabled() {
        return ruleSetRepo.findTopByCodeAndStatusOrderByVersionDesc(
                com.calishealth.api.engine.config.DefaultLevelEngineConfig.RULE_SET_CODE, RuleSet.ACTIVE).isPresent();
    }

    @Transactional
    public EngineResultDto process(Long userId, AssessmentSession session, List<AssessmentTemplateQuestion> refs,
                                   Map<Long, List<AssessmentQuestionOption>> options, Map<String, Object> answers,
                                   List<AssessmentScoringEngine.QuestionScore> questionScores) {
        RuleSetConfig rs = ruleSets.active();
        Instant now = Instant.now();
        Map<Long, AssessmentQuestion> questions = new LinkedHashMap<>();
        refs.forEach(r -> questions.put(r.getQuestion().getId(), r.getQuestion()));
        Map<Long, List<QuestionCompetencyMapping>> mappings = new HashMap<>();
        mappingRepo.findByQuestionIds(questions.keySet()).forEach(m -> mappings.computeIfAbsent(m.getQuestion().getId(), k -> new ArrayList<>()).add(m));
        Map<Long, Double> scoreByQuestion = new HashMap<>();
        Map<Long, Double> weightByQuestion = new HashMap<>();
        for (AssessmentScoringEngine.QuestionScore qs : questionScores) {
            if (qs.score() != null) scoreByQuestion.put(qs.questionId(), qs.score());
            weightByQuestion.put(qs.questionId(), qs.weight());
        }

        // ---------- 1. Quan sát tự khai ----------
        List<NodeObservation> nodes = new ArrayList<>();
        List<ScoreObservation> scored = new ArrayList<>();
        Map<String, Object> answersByCode = new LinkedHashMap<>();
        Map<String, Double> nodeValues = new LinkedHashMap<>();
        Map<String, String> ladderChoice = new HashMap<>();   // năng lực -> mã bài đã chọn
        Map<String, Double> ladderValue = new HashMap<>();
        int relevant = 0, answered = 0;
        for (AssessmentQuestion q : questions.values()) {
            Object a = answers.get(String.valueOf(q.getId()));
            answersByCode.put(q.getQuestionCode(), a);
            List<QuestionCompetencyMapping> ms = mappings.getOrDefault(q.getId(), List.of());
            boolean counts = !ms.isEmpty() || scoreByQuestion.containsKey(q.getId()) || (weightByQuestion.getOrDefault(q.getId(), 0.0) > 0);
            if (counts) { relevant++; if (!empty(a)) answered++; }
            for (QuestionCompetencyMapping m : ms) {
                switch (m.getMappingType()) {
                    case QuestionCompetencyMapping.LADDER_NODE -> { if (!empty(a)) ladderChoice.put(m.getCompetencyCode(), String.valueOf(a)); }
                    case QuestionCompetencyMapping.LADDER_VALUE -> { Double v = number(a); if (v != null) ladderValue.put(m.getCompetencyCode(), v); }
                    case QuestionCompetencyMapping.LADDER_DIRECT -> {
                        Double v = number(a);
                        if (v != null && m.getExercise() != null) {
                            nodes.add(new NodeObservation(m.getExercise().getId(), v));
                            nodeValues.put(m.getExercise().getCode().toLowerCase(), v);
                        }
                    }
                    default -> {
                        Double s = scoreByQuestion.get(q.getId());
                        if (s != null) scored.add(new ScoreObservation(m.getCompetencyCode(), s, m.getWeight().doubleValue()));
                    }
                }
            }
            if (ms.isEmpty() && scoreByQuestion.containsKey(q.getId())) {
                String c = CATEGORY_FALLBACK.get(q.getCategory() == null ? "" : q.getCategory().toUpperCase());
                if (c != null) scored.add(new ScoreObservation(c, scoreByQuestion.get(q.getId()), 1));
            }
        }
        for (Map.Entry<String, String> e : ladderChoice.entrySet()) {
            List<LadderNode> ladder = rs.ladder(e.getKey());
            if (ladder.isEmpty()) continue;
            if ("NONE".equalsIgnoreCase(e.getValue())) {
                nodes.add(new NodeObservation(ladder.get(0).exerciseId(), 0));   // bằng chứng "chưa làm được nấc nào"
                continue;
            }
            rs.ladderNodeByCode(e.getValue()).ifPresent(n -> {
                double v = ladderValue.getOrDefault(e.getKey(), n.entry());
                nodes.add(new NodeObservation(n.exerciseId(), v));
                nodeValues.put(n.exerciseCode().toLowerCase(), v);
            });
        }
        Map<String, Double> ladderScores = CompetencyScoringEngine.ladderScores(rs, nodes);
        Map<String, Double> obs = CompetencyScoringEngine.combine(rs, ladderScores, scored);

        // ---------- 2. Kiểm tra nhất quán ----------
        double answeredRatio = relevant == 0 ? 1 : answered / (double) relevant;
        ConsistencyChecker.Result quality = ConsistencyChecker.check(rs, answersByCode, nodeValues, ladderScores, answeredRatio);

        // ---------- 3. Năng lực ----------
        double r = rs.sourceReliability("SELF_REPORTED");
        Map<String, Observation> current = new LinkedHashMap<>();
        obs.forEach((c, v) -> current.put(c, new Observation(c, v, "SELF_REPORTED", r,
                rs.qualityFactor(quality.qualityByCompetency().getOrDefault(c, quality.overallQuality())), now)));
        Map<String, CompetencyResult> comps = levelData.record(userId, session.getId(), rs, current, quality.qualityByCompetency(), now);
        Double overall = CompetencyScoringEngine.overall(rs, comps);

        // ---------- 4. Ràng buộc, mục tiêu, hồ sơ ----------
        UserTrainingConstraints constraints = applyConstraints(userId, questions.values(), answers, options);
        applyGoal(userId, questions.values(), answers);

        // ---------- 5. Level tạm thời ----------
        LevelEvaluationEngine.ProvisionalResult pr = LevelEvaluationEngine.provisional(rs, comps, overall,
                quality.conflictedCompetencies(), constraints.isScreeningFlag());
        List<Reason> reasons = new ArrayList<>(pr.reasons());
        quality.violations().forEach(v -> reasons.add(new Reason("DATA_QUALITY", v.code(), String.join(",", v.competencies()),
                null, null, null, false, v.message())));
        String previous = levelData.state(userId).map(userLevelState -> userLevelState.getLevelCode()).orElse(null);
        String explanation = ExplanationBuilder.level(rs, previous, pr.finalLevel(), LevelModels.PROVISIONAL_ASSIGNED, overall, reasons);
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("source", "SELF_REPORTED");
        snapshot.put("ladderObservations", nodes);
        snapshot.put("scoreObservations", scored);
        snapshot.put("competencies", comps);
        snapshot.put("dataQuality", quality);
        Map<String, String> gates = new HashMap<>();
        if (pr.competencyGate() != null) gates.put("COMPETENCY", pr.competencyGate().status());
        LevelEvaluation ev = levelData.saveEvaluation(userId, session.getId(), rs, previous, pr.candidateLevel(), pr.finalLevel(),
                overall, overall, gates, LevelModels.PROVISIONAL_ASSIGNED, reasons, snapshot, explanation);
        levelData.updateState(userId, pr.finalLevel(), UserLevelState.PROVISIONAL, overall, overall, 0, ev.getId(),
                LocalDate.now().plusDays((long) rs.param("assessment.baselineDueDays", 14)));

        double avgConf = comps.values().stream().mapToDouble(competencyResult -> competencyResult.confidence()).average().orElse(0);
        session.setDataQualityStatus(quality.overallQuality());
        session.setConfidence(BigDecimal.valueOf(avgConf).setScale(3, RoundingMode.HALF_UP));
        session.setRuleSetId(rs.id());
        session.setLevelCode(pr.finalLevel());
        if (overall != null) session.setOverallScore(BigDecimal.valueOf(overall).setScale(2, RoundingMode.HALF_UP));
        sessionRepo.save(session);

        // ---------- 6. Skill Tree từ tự khai ----------
        SkillGraph graph = skills.graph(rs);
        for (NodeObservation n : nodes) {
            rs.ladderNode(n.exerciseId()).filter(l -> l.entered(n.value()))
                    .ifPresent(l -> skills.seedFromSelfReport(userId, rs, graph, n.exerciseId(), n.value()));
        }

        // ---------- 7. Chu kỳ tập đầu tiên ----------
        TrainingCycleService.CycleResult cycle = cycles.generate(userId, "INITIAL_PROVISIONAL", ev, session.getId());

        return new EngineResultDto(
                new LevelDto(pr.finalLevel(), rs.level(pr.finalLevel()).name(), rs.level(pr.finalLevel()).description(),
                        UserLevelState.PROVISIONAL, "SELF_REPORTED"),
                overall, quality.overallQuality(), round3(avgConf),
                FitnessStateMapper.competencies(rs, comps),
                quality.violations().stream().map(violation -> violation.message()).toList(),
                explanation, String.valueOf(cycle.plan().getId()), cycle.plan().getName());
    }

    // ============================== Ràng buộc / mục tiêu ==============================

    private UserTrainingConstraints applyConstraints(Long userId, Collection<AssessmentQuestion> questions, Map<String, Object> answers,
                                                     Map<Long, List<AssessmentQuestionOption>> options) {
        UserTrainingConstraints c = cycles.constraints(userId);
        for (AssessmentQuestion q : questions) {
            if (q.getSemanticKey() == null) continue;
            Object a = answers.get(String.valueOf(q.getId()));
            if (empty(a)) continue;
            List<AssessmentQuestionOption> opts = options.getOrDefault(q.getId(), List.of());
            switch (q.getSemanticKey()) {
                case "DAYS_PER_WEEK" -> { Double v = optionNumber(opts, a); if (v != null) c.setDaysPerWeek(Math.max(1, Math.min(7, v.intValue()))); }
                case "SESSION_MINUTES" -> { Double v = optionNumber(opts, a); if (v != null) c.setSessionMinutes(Math.max(10, v.intValue())); }
                case "EQUIPMENT" -> c.setEquipmentJson(json.writeValueAsString(codes(a)));
                case "LIMITATIONS" -> c.setLimitationsJson(json.writeValueAsString(codes(a)));
                case "SCREENING" -> c.setScreeningFlag(!codes(a).isEmpty());
                case "HEIGHT_CM", "WEIGHT_KG" -> applyBody(userId, q.getSemanticKey(), number(a));
                default -> { }
            }
        }
        return cycles.saveConstraints(c);
    }

    private void applyBody(Long userId, String key, Double v) {
        if (v == null) return;
        profileRepo.findByUserId(userId).ifPresent(p -> {
            if ("HEIGHT_CM".equals(key)) p.setHeightCm(BigDecimal.valueOf(v));
            else p.setWeightKg(BigDecimal.valueOf(v));
            profileRepo.save(p);
        });
    }

    /** Mục tiêu chính tự khai -> user_goals ưu tiên 1 (giữ các mục tiêu khác, đẩy xuống ưu tiên sau). */
    private void applyGoal(Long userId, Collection<AssessmentQuestion> questions, Map<String, Object> answers) {
        for (AssessmentQuestion q : questions) {
            if (!"PRIMARY_GOAL".equals(q.getSemanticKey())) continue;
            Object a = answers.get(String.valueOf(q.getId()));
            if (empty(a)) return;
            Goal goal = goalRepo.findByCode(String.valueOf(a)).orElse(null);
            if (goal == null) return;
            List<UserGoal> existing = userGoalRepo.findByUserIdOrderByPriorityAsc(userId);
            UserGoal primary = existing.stream().filter(g -> g.getGoal().getId().equals(goal.getId())).findFirst().orElse(null);
            int p = 2;
            for (UserGoal g : existing) {
                if (g == primary) continue;
                g.setPriority(p++);
                userGoalRepo.save(g);
            }
            if (primary == null) {
                primary = new UserGoal();
                primary.setUser(userRepo.findById(userId).orElseThrow());
                primary.setGoal(goal);
                primary.setStartDate(LocalDate.now());
            }
            primary.setPriority(1);
            primary.setStatus(UserGoalStatus.ACTIVE);
            userGoalRepo.save(primary);
            return;
        }
    }

    private static List<String> codes(Object a) {
        List<String> out = new ArrayList<>();
        if (a instanceof Collection<?> c) c.forEach(x -> out.add(String.valueOf(x).toUpperCase()));
        else if (a != null) out.add(String.valueOf(a).toUpperCase());
        out.remove("NONE");
        return out;
    }

    private static Double optionNumber(List<AssessmentQuestionOption> opts, Object a) {
        for (AssessmentQuestionOption o : opts) {
            if (o.getOptionCode().equalsIgnoreCase(String.valueOf(a)) && o.getNumericValue() != null) return o.getNumericValue().doubleValue();
        }
        return number(a);
    }

    private static Double number(Object o) {
        if (o instanceof Number n) return n.doubleValue();
        if (o == null) return null;
        try { return Double.parseDouble(String.valueOf(o).trim()); } catch (NumberFormatException e) { return null; }
    }

    private static boolean empty(Object a) {
        return a == null || (a instanceof String s && s.isBlank()) || (a instanceof Collection<?> c && c.isEmpty());
    }

    private static double round3(double v) { return Math.round(v * 1000.0) / 1000.0; }
}
