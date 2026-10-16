package com.calishealth.api.service.level;

import com.calishealth.api.dto.PlanChoiceDtos.SaveSelfPlanRequest;
import com.calishealth.api.dto.PlanChoiceDtos.SelfPlanItem;
import com.calishealth.api.dto.PlanChoiceDtos.SelfPlanItemInput;
import com.calishealth.api.dto.PlanChoiceDtos.SelfPlanView;
import com.calishealth.api.entity.Exercise;
import com.calishealth.api.entity.User;
import com.calishealth.api.entity.UserTrainingConstraints;
import com.calishealth.api.entity.WorkoutPlan;
import com.calishealth.api.entity.WorkoutPlanDay;
import com.calishealth.api.entity.WorkoutPlanExercise;
import com.calishealth.api.entity.WorkoutPlanStatus;
import com.calishealth.api.repository.ExerciseRepository;
import com.calishealth.api.repository.UserRepository;
import com.calishealth.api.repository.WorkoutPlanDayRepository;
import com.calishealth.api.repository.WorkoutPlanExerciseRepository;
import com.calishealth.api.repository.WorkoutPlanRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

/**
 * Danh sách bài tập TỰ TẠO của học viên (giống danh sách bài yêu thích để tập): một WorkoutPlan đánh dấu USER_SELF_BUILT với một buổi tập duy nhất.
 * Danh sách này KHÔNG được dùng làm bằng chứng nâng/hạ level: muốn đổi level phải tập theo giáo án hệ thống (xem PlanChoiceService, TrainingLogService).
 * Chuyển qua lại giữa giáo án hệ thống và danh sách tự tạo bất cứ lúc nào; danh sách cũ được giữ lại.
 */
@Service
public class SelfPlanService {
    static final int MAX_ITEMS = 30;

    private final WorkoutPlanRepository planRepo;
    private final WorkoutPlanDayRepository dayRepo;
    private final WorkoutPlanExerciseRepository planExerciseRepo;
    private final ExerciseRepository exerciseRepo;
    private final UserRepository userRepo;
    private final TrainingCycleService cycles;

    public SelfPlanService(WorkoutPlanRepository planRepo, WorkoutPlanDayRepository dayRepo, WorkoutPlanExerciseRepository planExerciseRepo,
                           ExerciseRepository exerciseRepo, UserRepository userRepo, TrainingCycleService cycles) {
        this.planRepo = planRepo; this.dayRepo = dayRepo; this.planExerciseRepo = planExerciseRepo; this.exerciseRepo = exerciseRepo;
        this.userRepo = userRepo; this.cycles = cycles;
    }

    @Transactional(readOnly = true)
    public SelfPlanView get(Long userId) {
        return find(userId).map(this::view).orElse(new SelfPlanView(null, false, List.of()));
    }

    /** Lưu toàn bộ danh sách (thay thế danh sách cũ) và chuyển sang cách tập tự tạo. Danh sách rỗng được phép (xóa hết bài). */
    @Transactional
    public SelfPlanView save(Long userId, SaveSelfPlanRequest req) {
        List<SelfPlanItemInput> inputs = req == null || req.items() == null ? List.of() : req.items();
        if (inputs.size() > MAX_ITEMS) throw new IllegalArgumentException("SELF_PLAN_TOO_LONG: danh sách tối đa " + MAX_ITEMS + " bài");
        Set<Long> seen = new HashSet<>();
        for (SelfPlanItemInput i : inputs) {
            if (i == null || i.exerciseId() == null) throw new IllegalArgumentException("EXERCISE_REQUIRED: thiếu mã bài tập");
            if (!seen.add(i.exerciseId())) throw new IllegalArgumentException("EXERCISE_DUPLICATED: một bài chỉ xuất hiện một lần trong danh sách");
        }
        Map<Long, Exercise> byId = new HashMap<>();
        exerciseRepo.findAllById(seen).forEach(e -> byId.put(e.getId(), e));
        for (Long id : seen) {
            Exercise e = byId.get(id);
            if (e == null || !e.isActive()) throw new IllegalArgumentException("EXERCISE_NOT_FOUND: bài tập #" + id + " không tồn tại hoặc đã ngừng sử dụng");
        }

        WorkoutPlan plan = find(userId).orElseGet(() -> newPlan(userId));
        WorkoutPlanDay day = dayRepo.findByWorkoutPlanIdOrderByDayNumberAsc(plan.getId()).stream().findFirst().orElseGet(() -> newDay(plan));
        planExerciseRepo.deleteAll(planExerciseRepo.findWithExerciseByDayIds(List.of(day.getId())));
        planExerciseRepo.flush();
        int seq = 1;
        for (SelfPlanItemInput i : inputs) {
            WorkoutPlanExercise pe = new WorkoutPlanExercise();
            pe.setWorkoutPlanDay(day);
            pe.setExercise(byId.get(i.exerciseId()));
            pe.setSequenceNo(seq++);
            pe.setSets(clamp(i.sets(), 1, 10, 3));
            if (i.holdSec() != null && i.holdSec() > 0) {
                pe.setTargetDurationSec(clamp(i.holdSec(), 5, 600, 30));
            } else {
                int min = clamp(i.repMin(), 1, 100, 8);
                pe.setTargetRepsMin(min);
                pe.setTargetRepsMax(Math.max(min, clamp(i.repMax(), 1, 100, Math.max(min, 12))));
            }
            pe.setRestSeconds(clamp(i.restSec(), 10, 600, 90));
            pe.setSectionType("MAIN");
            planExerciseRepo.save(pe);
        }
        day.setEstimatedDurationMin(Math.max(5, inputs.size() * 5));
        dayRepo.save(day);
        activate(userId);
        return get(userId);
    }

    /** Chuyển sang cách tập tự tạo: danh sách tự tạo (nếu có) thành chu kỳ đang chạy, chu kỳ hệ thống đang chạy được đóng lại. */
    @Transactional
    public void activate(Long userId) {
        Optional<WorkoutPlan> self = find(userId);
        for (WorkoutPlan p : planRepo.findByUserIdAndStatus(userId, WorkoutPlanStatus.ACTIVE)) {
            if (self.isPresent() && p.getId().equals(self.get().getId())) continue;
            p.setStatus(WorkoutPlanStatus.COMPLETED);
            planRepo.save(p);
        }
        self.ifPresent(p -> { p.setStatus(WorkoutPlanStatus.ACTIVE); planRepo.save(p); });
        UserTrainingConstraints c = cycles.constraints(userId);
        c.setPlanMode(PlanChoiceService.SELF);
        cycles.saveConstraints(c);
    }

    // ------------------------------------------------------------------ nội bộ

    private Optional<WorkoutPlan> find(Long userId) {
        return planRepo.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(p -> TrainingCycleService.SELF_BUILT.equals(p.getGenerationReason())).findFirst();
    }

    private WorkoutPlan newPlan(Long userId) {
        User user = userRepo.findById(userId).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));
        WorkoutPlan plan = new WorkoutPlan();
        plan.setUser(user);
        plan.setName("Danh sách bài tập của tôi");
        plan.setDescription("Danh sách bài tập bạn tự chọn. Danh sách này không dùng để nâng hoặc hạ level.");
        plan.setStatus(WorkoutPlanStatus.DRAFT);
        plan.setStartDate(LocalDate.now());
        plan.setGenerationReason(TrainingCycleService.SELF_BUILT);
        return planRepo.save(plan);
    }

    private WorkoutPlanDay newDay(WorkoutPlan plan) {
        WorkoutPlanDay day = new WorkoutPlanDay();
        day.setWorkoutPlan(plan);
        day.setDayNumber(1);
        day.setWeekNumber(1);
        day.setName("Danh sách của tôi");
        day.setRestDay(false);
        day.setDeload(false);
        return dayRepo.save(day);
    }

    private SelfPlanView view(WorkoutPlan plan) {
        List<Long> dayIds = dayRepo.findByWorkoutPlanIdOrderByDayNumberAsc(plan.getId()).stream().map(d -> d.getId()).toList();
        List<SelfPlanItem> items = dayIds.isEmpty() ? List.of() : planExerciseRepo.findWithExerciseByDayIds(dayIds).stream().map(e -> {
            Exercise x = e.getExercise();
            String name = x.getDisplayName() != null && !x.getDisplayName().isBlank() ? x.getDisplayName() : x.getName();
            return new SelfPlanItem(x.getId(), name, x.getThumbnailUrl(), e.getSets() == null ? 3 : e.getSets(), e.getTargetRepsMin(), e.getTargetRepsMax(),
                    e.getTargetDurationSec(), e.getRestSeconds());
        }).toList();
        return new SelfPlanView(plan.getId(), plan.getStatus() == WorkoutPlanStatus.ACTIVE, items);
    }

    private static int clamp(Integer v, int min, int max, int fallback) {
        if (v == null) return fallback;
        return Math.max(min, Math.min(max, v));
    }
}
