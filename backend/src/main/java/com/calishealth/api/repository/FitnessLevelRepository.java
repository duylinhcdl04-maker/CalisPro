package com.calishealth.api.repository;

import com.calishealth.api.entity.FitnessLevel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FitnessLevelRepository extends JpaRepository<FitnessLevel, Long> {
    List<FitnessLevel> findByRuleSetIdOrderByRankNoAsc(Long ruleSetId);
}
