package com.calishealth.api.service;

import com.calishealth.api.dto.UserTraineeDtos.GeneratePlanRequest;
import com.calishealth.api.dto.WorkoutDtos.WorkoutPlanRequest;
import com.calishealth.api.dto.WorkoutDtos.WorkoutPlanResponse;
import com.calishealth.api.entity.Goal;
import com.calishealth.api.entity.User;
import com.calishealth.api.entity.UserGoal;
import com.calishealth.api.entity.WorkoutPlan;
import com.calishealth.api.entity.WorkoutPlanStatus;
import com.calishealth.api.repository.GoalRepository;
import com.calishealth.api.repository.UserGoalRepository;
import com.calishealth.api.repository.UserRepository;
import com.calishealth.api.repository.WorkoutPlanRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class WorkoutPlanService {
    private final WorkoutPlanRepository planRepo;
    private final UserRepository userRepo;
    private final GoalRepository goalRepo;
    private final UserGoalRepository userGoalRepo;
    private final com.calishealth.api.service.level.FitnessStateService fitnessState;

    public WorkoutPlanService(WorkoutPlanRepository planRepo,
                              UserRepository userRepo,
                              GoalRepository goalRepo,
                              UserGoalRepository userGoalRepo,
                              com.calishealth.api.service.level.FitnessStateService fitnessState) {
        this.fitnessState = fitnessState;
        this.planRepo = planRepo;
        this.userRepo = userRepo;
        this.goalRepo = goalRepo;
        this.userGoalRepo = userGoalRepo;
    }

    /**
     * Sinh chu kỳ tập cá nhân hoá bằng Level Engine (level + 6 năng lực + mục tiêu + ràng buộc -> giáo án mẫu -> bài theo nấc).
     * goalId: đặt làm mục tiêu chính; daysPerWeek: cập nhật ràng buộc. Độ dài chu kỳ do level quyết định (bỏ qua durationWeeks).
     */
    @Transactional
    public WorkoutPlanResponse generatePersonalizedPlan(Long userId, GeneratePlanRequest req) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));
        String reason = "CONSTRAINT_CHANGED";
        if (req != null && req.goalId() != null) {
            Goal goal = goalRepo.findById(req.goalId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy mục tiêu với ID: " + req.goalId()));
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
                primary.setUser(user);
                primary.setGoal(goal);
                primary.setStartDate(LocalDate.now());
            }
            primary.setPriority(1);
            primary.setStatus(com.calishealth.api.entity.UserGoalStatus.ACTIVE);
            userGoalRepo.save(primary);
            reason = "GOAL_CHANGED";
        }
        if (req != null && req.daysPerWeek() != null) {
            fitnessState.updateConstraints(userId, new com.calishealth.api.dto.LevelEngineDtos.UpdateConstraintsRequest(
                    req.daysPerWeek(), null, null, null, null, false));
        }
        var cycle = fitnessState.regenerate(userId, reason);
        return toResponse(planRepo.findById(Long.valueOf(cycle.planId())).orElseThrow());
    }

    @Transactional(readOnly = true)
    public List<WorkoutPlanResponse> listUserPlans(Long userId) {
        return planRepo.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public WorkoutPlanResponse getPlan(Long userId, Long id) {
        WorkoutPlan plan = planRepo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy kế hoạch tập luyện với ID: " + id));
        return toResponse(plan);
    }

    @Transactional
    public WorkoutPlanResponse createPlan(Long userId, WorkoutPlanRequest req) {
        if (req.name() == null || req.name().isBlank()) {
            throw new IllegalArgumentException("Tên kế hoạch tập luyện không được để trống");
        }

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));

        Goal goal = null;
        if (req.goalId() != null) {
            goal = goalRepo.findById(req.goalId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy mục tiêu với ID: " + req.goalId()));
        }

        WorkoutPlan plan = new WorkoutPlan();
        plan.setUser(user);
        plan.setName(req.name().trim());
        plan.setDescription(req.description());
        plan.setGoal(goal);
        plan.setDifficultyLevel(req.difficultyLevel());
        plan.setDurationWeeks(req.durationWeeks());
        plan.setDaysPerWeek(req.daysPerWeek());
        plan.setStatus(req.status() != null ? req.status() : WorkoutPlanStatus.DRAFT);
        plan.setStartDate(req.startDate());
        plan.setEndDate(req.endDate());
        plan.setVersion(1);

        return toResponse(planRepo.save(plan));
    }

    @Transactional
    public WorkoutPlanResponse updatePlan(Long userId, Long id, WorkoutPlanRequest req) {
        WorkoutPlan plan = planRepo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy kế hoạch tập luyện với ID: " + id));

        if (req.name() != null && !req.name().isBlank()) plan.setName(req.name().trim());
        if (req.description() != null) plan.setDescription(req.description());
        if (req.goalId() != null) {
            Goal goal = goalRepo.findById(req.goalId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy mục tiêu với ID: " + req.goalId()));
            plan.setGoal(goal);
        }
        if (req.difficultyLevel() != null) plan.setDifficultyLevel(req.difficultyLevel());
        if (req.durationWeeks() != null) plan.setDurationWeeks(req.durationWeeks());
        if (req.daysPerWeek() != null) plan.setDaysPerWeek(req.daysPerWeek());
        if (req.status() != null) plan.setStatus(req.status());
        if (req.startDate() != null) plan.setStartDate(req.startDate());
        if (req.endDate() != null) plan.setEndDate(req.endDate());
        plan.setVersion(plan.getVersion() + 1);

        return toResponse(planRepo.save(plan));
    }

    @Transactional
    public void deletePlan(Long userId, Long id) {
        WorkoutPlan plan = planRepo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy kế hoạch tập luyện với ID: " + id));
        planRepo.delete(plan);
    }

    private WorkoutPlanResponse toResponse(WorkoutPlan p) {
        return new WorkoutPlanResponse(
                p.getId(),
                p.getUser().getId(),
                p.getName(),
                p.getDescription(),
                p.getGoal() != null ? p.getGoal().getId() : null,
                p.getGoal() != null ? p.getGoal().getName() : null,
                p.getDifficultyLevel(),
                p.getDurationWeeks(),
                p.getDaysPerWeek(),
                p.getStatus(),
                p.getStartDate(),
                p.getEndDate(),
                p.getVersion(),
                p.getCreatedAt()
        );
    }
}
