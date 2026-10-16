package com.calishealth.api.repository;

import com.calishealth.api.entity.WorkoutPlanDay;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkoutPlanDayRepository extends JpaRepository<WorkoutPlanDay, Long> {
    List<WorkoutPlanDay> findByWorkoutPlanIdOrderByDayNumberAsc(Long workoutPlanId);
}
