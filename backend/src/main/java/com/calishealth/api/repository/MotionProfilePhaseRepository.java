package com.calishealth.api.repository;

import com.calishealth.api.entity.MotionProfilePhase;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MotionProfilePhaseRepository extends JpaRepository<MotionProfilePhase, Long> {
    List<MotionProfilePhase> findByAiProfileIdOrderBySortOrderAsc(Long aiProfileId);
    boolean existsByAiProfileId(Long aiProfileId);
    void deleteByAiProfileId(Long aiProfileId);
}
