package com.calishealth.api.repository;

import com.calishealth.api.entity.CoachOverride;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CoachOverrideRepository extends JpaRepository<CoachOverride, Long> {
    List<CoachOverride> findByUserIdOrderByCreatedAtDesc(Long userId);
}
