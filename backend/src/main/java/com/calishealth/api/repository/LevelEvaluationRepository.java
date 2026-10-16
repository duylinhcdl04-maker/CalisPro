package com.calishealth.api.repository;

import com.calishealth.api.entity.LevelEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LevelEvaluationRepository extends JpaRepository<LevelEvaluation, Long> {
    List<LevelEvaluation> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<LevelEvaluation> findTopByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<LevelEvaluation> findTopByUserIdAndAssessmentSessionId(Long userId, Long assessmentSessionId);
}
