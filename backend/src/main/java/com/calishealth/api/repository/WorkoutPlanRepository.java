package com.calishealth.api.repository;

import com.calishealth.api.entity.WorkoutPlan;
import com.calishealth.api.entity.WorkoutPlanStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface WorkoutPlanRepository extends JpaRepository<WorkoutPlan, Long> {
    Optional<WorkoutPlan> findTopByUserIdAndStatusOrderByStartDateDesc(Long userId, WorkoutPlanStatus status);
    List<WorkoutPlan> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<WorkoutPlan> findByIdAndUserId(Long id, Long userId);

    // ---- Training Cycle / giáo án mẫu ----
    Optional<WorkoutPlan> findTopByUserIdAndStatusOrderByStartDateDescIdDesc(Long userId, WorkoutPlanStatus status);
    List<WorkoutPlan> findByUserIdAndStatus(Long userId, WorkoutPlanStatus status);
    long countByProgramTemplateId(Long programTemplateId);
    long countByProgramTemplateIdAndStatus(Long programTemplateId, WorkoutPlanStatus status);

    @Query("select count(distinct p.user.id) from WorkoutPlan p where p.programTemplateId = :templateId")
    long countDistinctUsersByProgramTemplateId(Long templateId);
}
