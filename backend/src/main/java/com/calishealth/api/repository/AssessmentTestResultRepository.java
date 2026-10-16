package com.calishealth.api.repository;

import com.calishealth.api.entity.AssessmentTestResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface AssessmentTestResultRepository extends JpaRepository<AssessmentTestResult, Long> {
    @Query("select r from AssessmentTestResult r join fetch r.testItem i join fetch i.exercise where r.assessmentSessionId = :sessionId order by r.id")
    List<AssessmentTestResult> findWithItemBySessionId(Long sessionId);
}
