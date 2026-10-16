package com.calishealth.api.repository;

import com.calishealth.api.entity.UserCompetencyScore;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserCompetencyScoreRepository extends JpaRepository<UserCompetencyScore, Long> {
    List<UserCompetencyScore> findByUserIdOrderByCreatedAtAsc(Long userId);
    List<UserCompetencyScore> findByAssessmentSessionId(Long assessmentSessionId);
}
