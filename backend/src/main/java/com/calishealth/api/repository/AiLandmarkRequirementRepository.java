package com.calishealth.api.repository;

import com.calishealth.api.entity.AiLandmarkRequirement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiLandmarkRequirementRepository extends JpaRepository<AiLandmarkRequirement, Long> {
    List<AiLandmarkRequirement> findByAiProfileId(Long aiProfileId);
    void deleteByAiProfileId(Long aiProfileId);
}
