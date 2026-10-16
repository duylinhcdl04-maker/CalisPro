package com.calishealth.api.repository;

import com.calishealth.api.entity.AiFeedbackTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiFeedbackTemplateRepository extends JpaRepository<AiFeedbackTemplate, Long> {
    List<AiFeedbackTemplate> findByRuleId(Long ruleId);
}
