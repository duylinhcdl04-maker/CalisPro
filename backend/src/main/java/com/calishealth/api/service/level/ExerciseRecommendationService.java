package com.calishealth.api.service.level;

import com.calishealth.api.dto.PlanChoiceDtos.RecommendedExercise;
import com.calishealth.api.dto.PlanChoiceDtos.Recommendations;
import com.calishealth.api.engine.config.RuleSetConfig;
import com.calishealth.api.engine.config.RuleSetConfig.LadderNode;
import org.springframework.jdbc.core.JdbcTemplate;
import com.calishealth.api.engine.skill.SkillGraph;
import com.calishealth.api.entity.Exercise;
import com.calishealth.api.entity.Goal;
import com.calishealth.api.entity.UserGoal;
import com.calishealth.api.entity.UserTrainingConstraints;
import com.calishealth.api.entity.WorkoutPlan;
import com.calishealth.api.entity.WorkoutPlanStatus;
import com.calishealth.api.repository.ExerciseRepository;
import com.calishealth.api.repository.UserGoalRepository;
import com.calishealth.api.repository.WorkoutPlanDayRepository;
import com.calishealth.api.repository.WorkoutPlanExerciseRepository;
import com.calishealth.api.repository.WorkoutPlanRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Gợi ý bài tập cho học viên theo trạng thái của họ:
 *  - Lần đánh giá định kỳ gần nhất chưa đủ để lên level: các bài cho PHẦN YẾU của học viên để tập cải thiện rồi đo lại (WEAK_AREAS).
 *  - Đang tập theo giáo án HỆ THỐNG: các bài trong chu kỳ hiện tại (PLAN).
 *  - Đã làm khảo sát nhưng không theo giáo án hệ thống: theo mục tiêu và hướng tập họ đã chọn (GOAL).
 *  - Chưa làm khảo sát: các bài nền tảng cho người mới (FOUNDATION).
 * Chỉ gợi ý bài, không đổi level hay giáo án của ai.
 */
@Service
public class ExerciseRecommendationService {
    private static final int LIMIT = 8;
    private static final List<String> HEALTH_COMPETENCIES = List.of("PUSH", "PULL", "LEGS", "CORE");

    private final JdbcTemplate jdbc;
    private final PlanChoiceService planChoice;
    private final TrainingCycleService cycles;
    private final LevelDataService levelData;
    private final SkillProgressService skills;
    private final RuleSetProvider ruleSets;
    private final UserGoalRepository userGoalRepo;
    private final ExerciseRepository exerciseRepo;
    private final WorkoutPlanRepository planRepo;
    private final WorkoutPlanDayRepository dayRepo;
    private final WorkoutPlanExerciseRepository planExerciseRepo;

    public ExerciseRecommendationService(JdbcTemplate jdbc, PlanChoiceService planChoice, TrainingCycleService cycles, LevelDataService levelData, SkillProgressService skills,
                                         RuleSetProvider ruleSets, UserGoalRepository userGoalRepo, ExerciseRepository exerciseRepo, WorkoutPlanRepository planRepo,
                                         WorkoutPlanDayRepository dayRepo, WorkoutPlanExerciseRepository planExerciseRepo) {
        this.jdbc = jdbc; this.planChoice = planChoice; this.cycles = cycles; this.levelData = levelData; this.skills = skills; this.ruleSets = ruleSets;
        this.userGoalRepo = userGoalRepo; this.exerciseRepo = exerciseRepo; this.planRepo = planRepo; this.dayRepo = dayRepo; this.planExerciseRepo = planExerciseRepo;
    }

    @Transactional(readOnly = true)
    public Recommendations recommend(Long userId) {
        RuleSetConfig rs = ruleSets.active();
        UserTrainingConstraints c = cycles.constraints(userId);
        Set<String> equipment = cycles.readSet(c.getEquipmentJson());

        if (PlanChoiceService.SYSTEM.equals(planChoice.effectiveMode(userId))) {
            Recommendations weak = weakAreas(userId, rs, equipment);
            if (weak != null) return weak;
            Optional<WorkoutPlan> plan = planRepo.findTopByUserIdAndStatusOrderByStartDateDescIdDesc(userId, WorkoutPlanStatus.ACTIVE);
            if (plan.isPresent()) {
                LinkedHashSet<Long> ids = new LinkedHashSet<>();
                List<Long> dayIds = dayRepo.findByWorkoutPlanIdOrderByDayNumberAsc(plan.get().getId()).stream().filter(d -> !d.isRestDay()).limit(3).map(d -> d.getId()).toList();
                if (!dayIds.isEmpty()) planExerciseRepo.findWithExerciseByDayIds(dayIds).stream()
                        .filter(e -> !"WARMUP".equals(e.getSectionType()) && !"COOLDOWN".equals(e.getSectionType()))
                        .forEach(e -> ids.add(e.getExercise().getId()));
                List<RecommendedExercise> items = items(rs, ids, "Có trong giáo án hệ thống của bạn", equipment);
                if (!items.isEmpty()) return new Recommendations("PLAN", "Các bài trong giáo án hệ thống hiện tại của bạn", items);
            }
        }

        List<UserGoal> goals = userGoalRepo.findByUserIdOrderByPriorityAsc(userId);
        Optional<Integer> rank = levelData.state(userId).map(s -> level(rs, s.getLevelCode()));
        if (!goals.isEmpty()) {
            Goal primary = goals.get(0).getGoal();
            String focus = c.getTrainingFocus() != null ? c.getTrainingFocus() : "SKILL".equalsIgnoreCase(primary.getCategory()) ? "SKILL" : "HEALTH";
            LinkedHashSet<Long> ids = new LinkedHashSet<>();
            String why;
            if (primary.getTargetExercise() != null) {
                Long target = primary.getTargetExercise().getId();
                SkillGraph graph = skills.graph(rs);
                List<Long> chain = new ArrayList<>(graph.easier(target, 6).keySet());
                Collections.reverse(chain);   // từ nấc dễ đến mục tiêu
                ids.addAll(chain);
                ids.add(target);
                why = "Trên đường tới mục tiêu \"" + primary.getName() + "\"";
            } else {
                ladderPicks(rs, "SKILL".equals(focus) ? List.of("SKILL") : HEALTH_COMPETENCIES, rank.orElse(0), "SKILL".equals(focus) ? 4 : 2).forEach(ids::add);
                why = "SKILL".equals(focus) ? "Phù hợp hướng Kỹ năng bạn chọn" : "Phù hợp hướng Sức khỏe và mục tiêu của bạn";
            }
            List<RecommendedExercise> items = items(rs, ids, why, equipment);
            if (!items.isEmpty()) return new Recommendations("GOAL", "Gợi ý theo mục tiêu bạn đã chọn trong bài khảo sát", items);
        }

        LinkedHashSet<Long> ids = new LinkedHashSet<>(ladderPicks(rs, HEALTH_COMPETENCIES, 0, 1));
        return new Recommendations("FOUNDATION", "Các bài nền tảng cho người mới. Làm bài khảo sát để nhận gợi ý đúng mục tiêu của bạn",
                items(rs, ids, "Bài nền tảng cho người mới bắt đầu", equipment));
    }

    /**
     * Các bài đánh dấu "Đề xuất cho bạn" trong mọi danh sách bài tập:
     *  - Tập theo giáo án HỆ THỐNG: các bài trong giáo án hiện tại (theo level).
     *  - Không tập theo giáo án hệ thống: theo hướng đã chọn (Kỹ năng: các bài trong thang Kỹ năng; Sức khỏe: các bài nền tảng đẩy/kéo/chân/core), nếu có mục tiêu có bài đích thì thêm chuỗi bài tới bài đích.
     *  - Chưa chọn gì: không đánh dấu.
     */
    @Transactional(readOnly = true)
    public com.calishealth.api.dto.PlanChoiceDtos.RecommendedIds recommendedIds(Long userId) {
        RuleSetConfig rs = ruleSets.active();
        UserTrainingConstraints c = cycles.constraints(userId);
        LinkedHashSet<Long> ids = new LinkedHashSet<>();
        if (PlanChoiceService.SYSTEM.equals(planChoice.effectiveMode(userId))) {
            planRepo.findTopByUserIdAndStatusOrderByStartDateDescIdDesc(userId, WorkoutPlanStatus.ACTIVE).ifPresent(plan -> {
                List<Long> dayIds = dayRepo.findByWorkoutPlanIdOrderByDayNumberAsc(plan.getId()).stream().map(d -> d.getId()).toList();
                if (!dayIds.isEmpty()) planExerciseRepo.findWithExerciseByDayIds(dayIds).forEach(e -> ids.add(e.getExercise().getId()));
            });
            return new com.calishealth.api.dto.PlanChoiceDtos.RecommendedIds("PLAN", new ArrayList<>(ids));
        }
        List<UserGoal> goals = userGoalRepo.findByUserIdOrderByPriorityAsc(userId);
        Goal primary = goals.isEmpty() ? null : goals.get(0).getGoal();
        String focus = c.getTrainingFocus() != null ? c.getTrainingFocus() : primary != null ? ("SKILL".equalsIgnoreCase(primary.getCategory()) ? "SKILL" : "HEALTH") : null;
        if (focus == null) return new com.calishealth.api.dto.PlanChoiceDtos.RecommendedIds("NONE", List.of());
        int rank = levelData.state(userId).map(s -> level(rs, s.getLevelCode())).orElse(0);
        if ("SKILL".equals(focus)) {
            rs.ladder("SKILL").forEach(n -> ids.add(n.exerciseId()));
        } else {
            ladderPicks(rs, HEALTH_COMPETENCIES, rank, 2).forEach(ids::add);
        }
        if (primary != null && primary.getTargetExercise() != null) {
            Long target = primary.getTargetExercise().getId();
            ids.addAll(skills.graph(rs).easier(target, 6).keySet());
            ids.add(target);
        }
        return new com.calishealth.api.dto.PlanChoiceDtos.RecommendedIds("FOCUS", new ArrayList<>(ids));
    }

    /**
     * Lần đo định kỳ gần nhất giữ nguyên level vì chưa đủ để lên: gợi ý bài cho 2 năng lực có điểm thấp nhất, bắt đầu từ nấc ngay trên bài dễ nhất của thang
     * ở mức tương ứng level hiện tại, để tập cải thiện rồi đo lại ở cuối chu kỳ sau. Trả null khi không áp dụng.
     */
    private Recommendations weakAreas(Long userId, RuleSetConfig rs, Set<String> equipment) {
        List<String> reasons = jdbc.queryForList("""
                SELECT reason_code FROM level_decisions_v2 WHERE user_id = ? AND kind = 'PERIODIC' AND outcome = 'DECIDED' ORDER BY id DESC LIMIT 1""", String.class, userId);
        if (reasons.isEmpty() || !Set.of("BELOW_LEVEL_STANDARD", "PROMOTION_GATE_FAILED", "PROMOTION_EVIDENCE_INCOMPLETE").contains(reasons.get(0))) return null;
        var scores = levelData.currentCompetencies(userId);
        List<String> weakest = rs.primaryCompetencies().stream().map(d -> scores.get(d.code())).filter(r -> r != null && r.score() != null)
                .sorted(Comparator.comparingDouble(r -> r.score())).limit(2).map(r -> r.code()).toList();
        if (weakest.isEmpty()) return null;
        int rank = levelData.state(userId).map(s -> level(rs, s.getLevelCode())).orElse(0);
        LinkedHashSet<Long> ids = new LinkedHashSet<>(ladderPicks(rs, weakest, rank, 3));
        List<RecommendedExercise> items = items(rs, ids, "Giúp cải thiện phần còn yếu để lên level", equipment);
        if (items.isEmpty()) return null;
        String names = String.join(", ", weakest.stream().map(c -> rs.competency(c).map(d -> d.name()).orElse(c)).toList());
        return new Recommendations("WEAK_AREAS", "Lần đánh giá gần nhất chưa đủ để lên level. Tập cải thiện phần còn yếu (" + names + ") rồi đo lại ở cuối chu kỳ sau", items);
    }

    /** Với mỗi năng lực lấy `count` bài trên thang tiến trình, bắt đầu từ nấc tương ứng level hiện tại (heuristic: nấc = rank của level, giới hạn trong thang). */
    private List<Long> ladderPicks(RuleSetConfig rs, List<String> competencies, int levelRank, int count) {
        List<Long> out = new ArrayList<>();
        for (String comp : competencies) {
            List<LadderNode> nodes = rs.ladder(comp).stream().sorted(Comparator.comparingInt(LadderNode::order)).toList();
            if (nodes.isEmpty()) continue;
            int start = Math.min(levelRank, nodes.size() - 1);
            for (int i = start; i < Math.min(nodes.size(), start + count); i++) out.add(nodes.get(i).exerciseId());
        }
        return out;
    }

    private List<RecommendedExercise> items(RuleSetConfig rs, Collection<Long> ids, String why, Set<String> equipment) {
        if (ids.isEmpty()) return List.of();
        Map<Long, Set<String>> req = skills.equipmentRequirements(ids);
        Map<Long, Exercise> byId = new HashMap<>();
        exerciseRepo.findAllById(ids).forEach(e -> byId.put(e.getId(), e));
        List<RecommendedExercise> out = new ArrayList<>();
        for (Long id : ids) {
            Exercise e = byId.get(id);
            if (e == null || !e.isActive() || !SkillProgressService.equipmentOk(req.get(id), equipment)) continue;
            String comp = rs.ladderNode(id).map(LadderNode::competency).orElse(null);
            out.add(new RecommendedExercise(e.getId(), e.getCode(), e.getDisplayName() != null && !e.getDisplayName().isBlank() ? e.getDisplayName() : e.getName(),
                    e.getThumbnailUrl(), comp, why));
            if (out.size() >= LIMIT) break;
        }
        return out;
    }

    private static int level(RuleSetConfig rs, String code) {
        try { return rs.level(code).rank(); } catch (RuntimeException e) { return 0; }
    }
}
