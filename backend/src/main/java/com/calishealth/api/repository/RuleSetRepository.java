package com.calishealth.api.repository;

import com.calishealth.api.entity.RuleSet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RuleSetRepository extends JpaRepository<RuleSet, Long> {
    Optional<RuleSet> findTopByCodeAndStatusOrderByVersionDesc(String code, String status);
    Optional<RuleSet> findTopByCodeOrderByVersionDesc(String code);
    List<RuleSet> findByCodeOrderByVersionDesc(String code);
}
