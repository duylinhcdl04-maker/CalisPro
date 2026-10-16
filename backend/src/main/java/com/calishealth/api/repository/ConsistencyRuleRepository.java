package com.calishealth.api.repository;

import com.calishealth.api.entity.ConsistencyRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConsistencyRuleRepository extends JpaRepository<ConsistencyRule, Long> {
    List<ConsistencyRule> findByRuleSetId(Long ruleSetId);
    void deleteByRuleSetId(Long ruleSetId);
}
