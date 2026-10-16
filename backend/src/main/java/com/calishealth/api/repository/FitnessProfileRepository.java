package com.calishealth.api.repository;

import com.calishealth.api.entity.FitnessProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FitnessProfileRepository extends JpaRepository<FitnessProfile, Long> {
    Optional<FitnessProfile> findTopByUserIdOrderByCreatedAtDesc(Long userId);
    List<FitnessProfile> findByUserIdOrderByCreatedAtDesc(Long userId);
}
