package com.calishealth.api.repository;

import com.calishealth.api.entity.ExerciseRestriction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ExerciseRestrictionRepository extends JpaRepository<ExerciseRestriction, Long> {
    @Query("select r from ExerciseRestriction r join fetch r.exercise")
    List<ExerciseRestriction> findAllWithExercise();
}
