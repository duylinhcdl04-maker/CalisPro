package com.calishealth.api.repository;

import com.calishealth.api.entity.ExerciseSet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface ExerciseSetRepository extends JpaRepository<ExerciseSet, Long> {
    List<ExerciseSet> findByWorkoutSessionExerciseIdIn(Collection<Long> ids);
}
