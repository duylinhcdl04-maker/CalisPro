package com.calishealth.api.repository;

import com.calishealth.api.entity.CompetencyLadderNode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CompetencyLadderNodeRepository extends JpaRepository<CompetencyLadderNode, Long> {
    @Query("select n from CompetencyLadderNode n join fetch n.exercise where n.ruleSetId = :ruleSetId order by n.competencyCode, n.nodeOrder")
    List<CompetencyLadderNode> findWithExerciseByRuleSetId(Long ruleSetId);
    void deleteByRuleSetId(Long ruleSetId);
}
