package com.calishealth.api.service.level;

import com.calishealth.api.dto.LevelEngineDtos.*;
import com.calishealth.api.engine.config.RuleSetConfig;
import com.calishealth.api.engine.level.CompetencyScoringEngine;
import com.calishealth.api.engine.level.CompetencyScoringEngine.CompetencyResult;
import com.calishealth.api.engine.skill.SkillEngine;
import com.calishealth.api.engine.skill.SkillEngine.NodeProgress;
import com.calishealth.api.engine.skill.SkillGraph;
import com.calishealth.api.entity.*;
import com.calishealth.api.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDate;
import java.util.*;

/** API phía học viên: trạng thái thể lực, lịch sử level, skill tree, chu kỳ tập hiện tại, ràng buộc tập luyện. */
@Service
public class FitnessStateService {
    private final RuleSetProvider ruleSets;
    private final RuleSetRepository ruleSetRepo;
    private final LevelDataService levelData;
    private final SkillProgressService skills;
    private final TrainingCycleService cycles;
    private final LevelEvaluationRepository evaluationRepo;
    private final UserCompetencyScoreRepository scoreRepo;
    private final WorkoutPlanRepository planRepo;
    private final WorkoutPlanDayRepository dayRepo;
    private final WorkoutPlanExerciseRepository planExerciseRepo;
    private final ObjectMapper json = new ObjectMapper();

    public FitnessStateService(RuleSetProvider ruleSets, RuleSetRepository ruleSetRepo, LevelDataService levelData,
                               SkillProgressService skills, TrainingCycleService cycles, LevelEvaluationRepository evaluationRepo,
                               UserCompetencyScoreRepository scoreRepo, WorkoutPlanRepository planRepo,
                               WorkoutPlanDayRepository dayRepo, WorkoutPlanExerciseRepository planExerciseRepo) {
        this.ruleSets = ruleSets;
        this.ruleSetRepo = ruleSetRepo;
        this.levelData = levelData;
        this.skills = skills;
        this.cycles = cycles;
        this.evaluationRepo = evaluationRepo;
        this.scoreRepo = scoreRepo;
        this.planRepo = planRepo;
        this.dayRepo = dayRepo;
        this.planExerciseRepo = planExerciseRepo;
    }

    // ============================== Trạng thái ==============================

    @Transactional(readOnly = true)
    public FitnessStateDto state(Long userId) {
        RuleSetConfig rs = ruleSets.active();
        Optional<UserLevelState> st = levelData.state(userId);
        Map<String, CompetencyResult> comps = levelData.currentCompetencies(userId);
        TrainingCycleService.UserTrainingContext ctx = cycles.context(userId, rs);
        LevelDto level = st.map(s -> levelDto(rs, s.getLevelCode(), ctx.returning() ? UserLevelState.RETURNING : s.getStatus(),
                UserLevelState.PROVISIONAL.equals(s.getStatus()) ? "SELF_REPORTED" : "MEASURED")).orElse(null);
        LevelEvaluation last = st.map(userLevelState -> userLevelState.getLastEvaluationId()).flatMap(evaluationRepo::findById).orElse(null);
        LocalDate due = st.map(userLevelState -> userLevelState.getNextAssessmentDue()).orElse(null);
        String activeCycle = planRepo.findTopByUserIdAndStatusOrderByStartDateDescIdDesc(userId, WorkoutPlanStatus.ACTIVE)
                .map(p -> String.valueOf(p.getId())).orElse(null);
        return new FitnessStateDto(level,
                st.map(s -> s.getOverallScore() == null ? null : s.getOverallScore().doubleValue()).orElse(null),
                st.map(s -> s.getEwmaOverall() == null ? null : s.getEwmaOverall().doubleValue()).orElse(null),
                FitnessStateMapper.competencies(rs, comps), CompetencyScoringEngine.weakest(rs, comps).orElse(null),
                due, due != null && !due.isAfter(LocalDate.now()),
                st.map(s -> UserLevelState.PROVISIONAL.equals(s.getStatus())).orElse(false) || ctx.returning(),
                FitnessStateMapper.evaluation(last, label(last)), constraintsDto(ctx.constraints()),
                ctx.primaryGoal() == null ? null : ctx.primaryGoal().getCode(), activeCycle);
    }

    @Transactional(readOnly = true)
    public List<EvaluationDto> history(Long userId) {
        return levelData.history(userId).stream().map(e -> FitnessStateMapper.evaluation(e, label(e))).toList();
    }

    /** Kết quả Level Engine của một phiên bài test đầu vào (dùng khi tải lại trang kết quả). */
    @Transactional(readOnly = true)
    public EngineResultDto engineResultForSession(Long userId, Long sessionId) {
        Optional<LevelEvaluation> ev = evaluationRepo.findTopByUserIdAndAssessmentSessionId(userId, sessionId);
        if (ev.isEmpty()) return null;
        RuleSetConfig rs = ruleSets.byId(ev.get().getRuleSetId());
        Map<String, CompetencyResult> comps = new LinkedHashMap<>();
        for (UserCompetencyScore s : scoreRepo.findByAssessmentSessionId(sessionId)) {
            comps.put(s.getCompetencyCode(), new CompetencyResult(s.getCompetencyCode(), LevelDataService.d(s.getBlendedScore()),
                    LevelDataService.d(s.getObservationScore()), s.getConfidence().doubleValue(), s.getBand(), s.getTrend(),
                    s.getSource(), s.getDataQuality()));
        }
        WorkoutPlan plan = planRepo.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(p -> sessionId.equals(p.getAssessmentSessionId())).findFirst().orElse(null);
        LevelEvaluation e = ev.get();
        List<String> warnings = FitnessStateMapper.evaluation(e, null).reasons().stream()
                .filter(r -> "DATA_QUALITY".equals(r.gate())).map(reasonDto -> reasonDto.message()).toList();
        double conf = comps.values().stream().mapToDouble(competencyResult -> competencyResult.confidence()).average().orElse(0);
        String quality = comps.values().stream().map(competencyResult -> competencyResult.dataQuality()).filter(Objects::nonNull)
                .reduce((a, b) -> "CONFLICTED".equals(a) || "CONFLICTED".equals(b) ? "CONFLICTED" : a).orElse(null);
        return new EngineResultDto(levelDto(rs, e.getFinalLevel(), UserLevelState.PROVISIONAL, "SELF_REPORTED"),
                e.getOverallScore() == null ? null : e.getOverallScore().doubleValue(), quality, Math.round(conf * 1000) / 1000.0,
                FitnessStateMapper.competencies(rs, comps), warnings, e.getExplanation(),
                plan == null ? null : String.valueOf(plan.getId()), plan == null ? null : plan.getName());
    }

    // ============================== Skill tree ==============================

    @Transactional(readOnly = true)
    public SkillTreeDto skillTree(Long userId) {
        RuleSetConfig rs = ruleSets.active();
        SkillGraph graph = skills.graph(rs);
        Map<Long, NodeProgress> progress = skills.progress(userId);
        Set<Long> inCycle = planRepo.findTopByUserIdAndStatusOrderByStartDateDescIdDesc(userId, WorkoutPlanStatus.ACTIVE)
                .map(p -> exerciseIds(p.getId())).orElse(Set.of());
        Map<Long, String> statuses = SkillEngine.statuses(graph, progress, inCycle);
        List<SkillNodeDto> nodes = new ArrayList<>();
        for (SkillGraph.Node n : graph.nodes()) {
            NodeProgress p = progress.get(n.id());
            SkillEngine.Criteria c = SkillEngine.criteria(rs, graph, n.id());
            nodes.add(new SkillNodeDto(String.valueOf(n.id()), n.code(), n.name(), n.competency(), statuses.get(n.id()),
                    p == null ? null : p.bestValue(), p == null ? null : p.bestFormScore(), p == null ? 0 : p.qualifyingSessions(),
                    c.metric(), c.value(), graph.prerequisites(n.id()).stream().map(e -> String.valueOf(e.prerequisiteId())).toList()));
        }
        TrainingCycleService.UserTrainingContext ctx = cycles.context(userId, rs);
        ReadinessDto readiness = null;
        Long target = ctx.primaryGoal() != null && ctx.primaryGoal().getTargetExercise() != null
                ? ctx.primaryGoal().getTargetExercise().getId() : null;
        if (target != null) {
            SkillEngine.Readiness r = SkillEngine.readiness(rs, graph, target, progress);
            readiness = new ReadinessDto(ctx.primaryGoal().getCode(), String.valueOf(target),
                    graph.node(target).map(node -> node.code()).orElse(null), r.status(), r.percent(),
                    r.missing().stream().map(FitnessStateMapper::gap).toList());
        }
        Map<String, Double> scores = new LinkedHashMap<>();
        ctx.competencies().forEach((k, v) -> scores.put(k, v.score()));
        List<GapDto> gaps = SkillEngine.gaps(rs, graph, target, progress, scores,
                CompetencyScoringEngine.weakest(rs, ctx.competencies()).orElse(null), 5).stream().map(FitnessStateMapper::gap).toList();
        return new SkillTreeDto(nodes, readiness, gaps);
    }

    // ============================== Chu kỳ tập ==============================

    @Transactional(readOnly = true)
    public CycleDto activeCycle(Long userId) {
        WorkoutPlan p = planRepo.findTopByUserIdAndStatusOrderByStartDateDescIdDesc(userId, WorkoutPlanStatus.ACTIVE)
                .orElseThrow(() -> new IllegalArgumentException("Bạn chưa có chu kỳ tập nào đang hoạt động."));
        return cycleDto(p);
    }

    @Transactional(readOnly = true)
    public CycleDto cycle(Long userId, Long planId) {
        return cycleDto(planRepo.findByIdAndUserId(planId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chu kỳ tập " + planId)));
    }

    @Transactional
    public CycleDto regenerate(Long userId, String reason) {
        if (levelData.state(userId).isEmpty()) {
            throw new IllegalStateException("LEVEL_REQUIRED: Bạn chưa được phân level nên chưa thể tạo chu kỳ tập theo level. Hãy làm bài đánh giá để được phân level, hoặc tự chọn bài tập trong Thư viện bài tập.");
        }
        String r = reason == null || reason.isBlank() ? "CONSTRAINT_CHANGED" : reason.trim().toUpperCase();
        if (!List.of("GOAL_CHANGED", "CONSTRAINT_CHANGED", "RETURNING").contains(r)) r = "CONSTRAINT_CHANGED";
        LevelEvaluation last = levelData.state(userId).map(userLevelState -> userLevelState.getLastEvaluationId()).flatMap(evaluationRepo::findById).orElse(null);
        TrainingCycleService.CycleResult res = cycles.generate(userId, r, last, last == null ? null : last.getAssessmentSessionId());
        return cycleDto(res.plan());
    }

    CycleDto cycleDto(WorkoutPlan p) {
        List<WorkoutPlanDay> days = dayRepo.findByWorkoutPlanIdOrderByDayNumberAsc(p.getId());
        Map<Long, List<WorkoutPlanExercise>> byDay = new HashMap<>();
        if (!days.isEmpty()) {
            planExerciseRepo.findWithExerciseByDayIds(days.stream().map(workoutPlanDay -> workoutPlanDay.getId()).toList())
                    .forEach(e -> byDay.computeIfAbsent(e.getWorkoutPlanDay().getId(), k -> new ArrayList<>()).add(e));
        }
        List<CycleDayDto> dayDtos = days.stream().map(d -> new CycleDayDto(String.valueOf(d.getId()), d.getDayNumber(), d.getWeekNumber(),
                d.getName(), d.getFocus(), d.isRestDay(), Boolean.TRUE.equals(d.getDeload()), d.getEstimatedDurationMin(),
                byDay.getOrDefault(d.getId(), List.of()).stream().map(e -> new CycleExerciseDto(String.valueOf(e.getId()),
                        String.valueOf(e.getExercise().getId()), e.getExercise().getCode(),
                        e.getExercise().getDisplayName() != null ? e.getExercise().getDisplayName() : e.getExercise().getName(),
                        e.getExercise().getThumbnailUrl(), e.getSectionType(), e.getSets(), e.getTargetRepsMin(), e.getTargetRepsMax(),
                        e.getTargetDurationSec(), e.getRestSeconds(), e.getTargetRpe() == null ? null : e.getTargetRpe().doubleValue(),
                        e.getTempo(), e.getNotes(), e.getTemplateExerciseId() == null ? null : String.valueOf(e.getTemplateExerciseId()),
                        reasonText(e.getSelectionReason()))).toList())).toList();
        Map<String, Object> snapshot;
        try {
            snapshot = p.getInputSnapshot() == null ? Map.of() : json.readValue(p.getInputSnapshot(), new TypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            snapshot = Map.of();
        }
        return new CycleDto(String.valueOf(p.getId()), p.getCycleNumber(), p.getName(), p.getDescription(), p.getStatus().name(),
                p.getDifficultyLevel(), p.getStartDate(), p.getEndDate(), p.getDurationWeeks(), p.getDaysPerWeek(), p.getGenerationReason(),
                str(p.getProgramTemplateId()), p.getProgramTemplateVersion(), str(p.getAssessmentSessionId()),
                str(p.getLevelEvaluationId()), str(p.getPreviousPlanId()), snapshot, dayDtos);
    }

    private String reasonText(String raw) {
        if (raw == null) return null;
        try {
            Object r = json.readValue(raw, new TypeReference<Map<String, Object>>() {}).get("reason");
            return r == null ? null : String.valueOf(r);
        } catch (Exception e) {
            return raw;
        }
    }

    private Set<Long> exerciseIds(Long planId) {
        List<Long> dayIds = dayRepo.findByWorkoutPlanIdOrderByDayNumberAsc(planId).stream().map(workoutPlanDay -> workoutPlanDay.getId()).toList();
        Set<Long> ids = new HashSet<>();
        if (!dayIds.isEmpty()) planExerciseRepo.findWithExerciseByDayIds(dayIds).forEach(e -> ids.add(e.getExercise().getId()));
        return ids;
    }

    // ============================== Ràng buộc ==============================

    @Transactional(readOnly = true)
    public ConstraintsDto constraints(Long userId) {
        return constraintsDto(cycles.constraints(userId));
    }

    @Transactional
    public ConstraintsDto updateConstraints(Long userId, UpdateConstraintsRequest req) {
        UserTrainingConstraints c = cycles.constraints(userId);
        if (req.daysPerWeek() != null) {
            if (req.daysPerWeek() < 1 || req.daysPerWeek() > 7) throw new IllegalArgumentException("Số buổi/tuần phải từ 1 đến 7.");
            c.setDaysPerWeek(req.daysPerWeek());
        }
        if (req.sessionMinutes() != null) {
            if (req.sessionMinutes() < 10 || req.sessionMinutes() > 240) throw new IllegalArgumentException("Thời lượng buổi tập phải từ 10 đến 240 phút.");
            c.setSessionMinutes(req.sessionMinutes());
        }
        if (req.equipment() != null) c.setEquipmentJson(json.writeValueAsString(normalize(req.equipment())));
        if (req.limitations() != null) c.setLimitationsJson(json.writeValueAsString(normalize(req.limitations())));
        if (req.environment() != null) c.setEnvironment(req.environment());
        cycles.saveConstraints(c);
        // Lưu ràng buộc luôn được; chỉ tạo lại chu kỳ khi đã có level (chưa có level thì chỉ lưu)
        if (Boolean.TRUE.equals(req.regenerate()) && levelData.state(userId).isPresent()) regenerate(userId, "CONSTRAINT_CHANGED");
        return constraintsDto(c);
    }

    private ConstraintsDto constraintsDto(UserTrainingConstraints c) {
        return new ConstraintsDto(c.getDaysPerWeek(), c.getSessionMinutes(), new ArrayList<>(cycles.readSet(c.getEquipmentJson())),
                new ArrayList<>(cycles.readSet(c.getLimitationsJson())), c.isScreeningFlag(), c.getEnvironment());
    }

    private static List<String> normalize(List<String> codes) {
        return codes.stream().filter(Objects::nonNull).map(s -> s.trim().toUpperCase()).filter(s -> !s.isEmpty() && !"NONE".equals(s))
                .distinct().toList();
    }

    // ============================== Helpers ==============================

    LevelDto levelDto(RuleSetConfig rs, String code, String status, String source) {
        RuleSetConfig.LevelDef l = rs.level(code);
        return new LevelDto(l.code(), l.name(), l.description(), status, source);
    }

    String label(LevelEvaluation e) {
        if (e == null) return null;
        return ruleSetRepo.findById(e.getRuleSetId()).map(r -> r.getCode() + " v" + r.getVersion()).orElse(null);
    }

    private static String str(Long v) { return v == null ? null : String.valueOf(v); }
}
