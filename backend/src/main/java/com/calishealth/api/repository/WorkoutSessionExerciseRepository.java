package com.calishealth.api.repository;

import com.calishealth.api.entity.WorkoutSessionExercise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;

public interface WorkoutSessionExerciseRepository extends JpaRepository<WorkoutSessionExercise, Long> {
    @Query("select e from WorkoutSessionExercise e join fetch e.workoutSession s join fetch e.exercise "
            + "where s.user.id = :userId and s.status = com.calishealth.api.entity.WorkoutSessionStatus.COMPLETED "
            + "and s.completedAt >= :since "
            // Bằng chứng nâng level chỉ gồm BÀI NẰM TRONG giáo án HỆ THỐNG mà buổi tập thuộc về: buổi tự do, buổi của danh sách tự tạo,
            // và bài tập thêm ngoài giáo án đều không được tính
            + "and s.workoutPlan is not null and (s.workoutPlan.generationReason is null or s.workoutPlan.generationReason <> 'USER_SELF_BUILT') "
            + "and exists (select 1 from WorkoutPlanExercise pe where pe.workoutPlanDay.workoutPlan.id = s.workoutPlan.id and pe.exercise.id = e.exercise.id) "
            + "order by s.completedAt desc")
    List<WorkoutSessionExercise> findCompletedSince(Long userId, Instant since);

    @Query("select e from WorkoutSessionExercise e join fetch e.exercise where e.workoutSession.id = :workoutSessionId")
    List<WorkoutSessionExercise> findWithExerciseBySessionId(Long workoutSessionId);
}
