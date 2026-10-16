package com.calishealth.api.repository;

import com.calishealth.api.entity.FormAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;

public interface FormAnalysisRepository extends JpaRepository<FormAnalysis, Long> {
    @Query("select f from FormAnalysis f join fetch f.movementSession m join fetch m.exercise where m.workoutSession.id in :workoutSessionIds")
    List<FormAnalysis> findByWorkoutSessionIds(Collection<Long> workoutSessionIds);
}
