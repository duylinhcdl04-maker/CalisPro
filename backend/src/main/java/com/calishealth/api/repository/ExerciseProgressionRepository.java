package com.calishealth.api.repository;

import com.calishealth.api.entity.ExerciseProgression;
import com.calishealth.api.entity.ProgressionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ExerciseProgressionRepository extends JpaRepository<ExerciseProgression, Long> {
    @Query("select p from ExerciseProgression p join fetch p.exercise join fetch p.prerequisiteExercise")
    List<ExerciseProgression> findAllWithExercises();
    boolean existsByExerciseIdAndPrerequisiteExerciseIdAndProgressionType(Long exerciseId, Long prerequisiteId, ProgressionType type);
}
