package com.calishealth.api.service.level;

import com.calishealth.api.dto.PlanChoiceDtos.PlanChoiceStatus;
import com.calishealth.api.entity.UserLevelState;
import com.calishealth.api.entity.UserTrainingConstraints;
import com.calishealth.api.entity.WorkoutPlan;
import com.calishealth.api.entity.WorkoutPlanStatus;
import com.calishealth.api.repository.WorkoutPlanRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.Set;

/**
 * Sau khi học viên có level, họ quyết định tập theo giáo án HỆ THỐNG (engine sinh chu kỳ theo level) hay TỰ TẠO (danh sách bài tập riêng, xem SelfPlanService).
 * Lựa chọn lưu ở user_training_constraints.plan_mode và đổi được bất cứ lúc nào. Hướng tập Sức khỏe/Kỹ năng chỉ để gợi ý bài tập, không đổi level.
 * Chỉ tập theo giáo án HỆ THỐNG mới có bằng chứng nâng/hạ level: danh sách tự tạo không được tính.
 */
@Service
public class PlanChoiceService {
    public static final String SYSTEM = "SYSTEM", SELF = "SELF";
    private static final Set<String> FOCUS = Set.of("HEALTH", "SKILL");

    private final TrainingCycleService cycles;
    private final LevelDataService levelData;
    private final FitnessStateService fitnessState;
    private final SelfPlanService selfPlan;
    private final WorkoutPlanRepository planRepo;

    public PlanChoiceService(TrainingCycleService cycles, LevelDataService levelData, FitnessStateService fitnessState, SelfPlanService selfPlan,
                             WorkoutPlanRepository planRepo) {
        this.cycles = cycles; this.levelData = levelData; this.fitnessState = fitnessState; this.selfPlan = selfPlan; this.planRepo = planRepo;
    }

    /** Chế độ đang hiệu lực: người đã có chu kỳ do hệ thống sinh từ trước (chưa từng chọn) coi như SYSTEM. null = chưa quyết định. */
    @Transactional(readOnly = true)
    public String effectiveMode(Long userId) {
        String mode = cycles.constraints(userId).getPlanMode();
        if (mode != null) return mode;
        return planRepo.findTopByUserIdAndStatusOrderByStartDateDescIdDesc(userId, WorkoutPlanStatus.ACTIVE)
                .filter(p -> !TrainingCycleService.SELF_BUILT.equals(p.getGenerationReason())).isPresent() ? SYSTEM : null;
    }

    /** Cầu nối V2 chỉ tự sinh chu kỳ mới khi học viên đã chọn tập theo hệ thống. */
    public boolean autoGenerate(Long userId) { return SYSTEM.equals(effectiveMode(userId)); }

    @Transactional(readOnly = true)
    public PlanChoiceStatus status(Long userId) {
        UserTrainingConstraints c = cycles.constraints(userId);
        Optional<UserLevelState> level = levelData.state(userId);
        String eff = effectiveMode(userId);
        Optional<WorkoutPlan> active = planRepo.findTopByUserIdAndStatusOrderByStartDateDescIdDesc(userId, WorkoutPlanStatus.ACTIVE);
        String source = active.map(p -> TrainingCycleService.SELF_BUILT.equals(p.getGenerationReason()) ? SELF : SYSTEM).orElse(null);
        return new PlanChoiceStatus(level.map(UserLevelState::getLevelCode).orElse(null), c.getPlanMode(), eff, level.isPresent() && eff == null,
                c.getTrainingFocus(), active.map(WorkoutPlan::getId).orElse(null), active.map(WorkoutPlan::getName).orElse(null), source);
    }

    @Transactional
    public PlanChoiceStatus choose(Long userId, String mode, String focus) {
        String m = mode == null ? "" : mode.trim().toUpperCase();
        if (!SYSTEM.equals(m) && !SELF.equals(m)) throw new IllegalArgumentException("MODE_INVALID: mode phải là SYSTEM hoặc SELF");
        if (SYSTEM.equals(m) && levelData.state(userId).isEmpty())
            throw new IllegalStateException("LEVEL_REQUIRED: Bạn chưa được phân level nên chưa thể tập theo giáo án của hệ thống. Hãy làm bài đánh giá trước.");
        UserTrainingConstraints c = cycles.constraints(userId);
        c.setPlanMode(m);
        if (focus != null) c.setTrainingFocus(normalizeFocus(focus));
        cycles.saveConstraints(c);
        if (SYSTEM.equals(m)) fitnessState.regenerate(userId, "CONSTRAINT_CHANGED");
        else selfPlan.activate(userId);
        return status(userId);
    }

    @Transactional
    public PlanChoiceStatus setFocus(Long userId, String focus) {
        UserTrainingConstraints c = cycles.constraints(userId);
        c.setTrainingFocus(normalizeFocus(focus));
        cycles.saveConstraints(c);
        return status(userId);
    }

    private static String normalizeFocus(String focus) {
        if (focus == null || focus.isBlank()) return null;
        String f = focus.trim().toUpperCase();
        if (!FOCUS.contains(f)) throw new IllegalArgumentException("FOCUS_INVALID: hướng tập phải là HEALTH hoặc SKILL");
        return f;
    }
}
