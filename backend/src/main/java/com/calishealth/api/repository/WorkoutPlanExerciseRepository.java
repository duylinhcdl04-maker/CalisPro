package com.calishealth.api.repository;

import com.calishealth.api.entity.WorkoutPlanExercise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;

public interface WorkoutPlanExerciseRepository extends JpaRepository<WorkoutPlanExercise, Long> {
    @Query("select e from WorkoutPlanExercise e join fetch e.exercise where e.workoutPlanDay.id in :dayIds order by e.workoutPlanDay.id, e.sequenceNo")
    List<WorkoutPlanExercise> findWithExerciseByDayIds(Collection<Long> dayIds);
}
