package com.calishealth.api.repository;

import com.calishealth.api.entity.EngineParameter;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EngineParameterRepository extends JpaRepository<EngineParameter, Long> {
    List<EngineParameter> findByRuleSetId(Long ruleSetId);
    void deleteByRuleSetId(Long ruleSetId);
}
