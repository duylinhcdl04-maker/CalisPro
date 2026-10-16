package com.calishealth.api.repository;

import com.calishealth.api.entity.AssessmentScore;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssessmentScoreRepository extends JpaRepository<AssessmentScore, Long> {
    java.util.List<AssessmentScore> findByAssessmentSessionId(Long sessionId);
}
