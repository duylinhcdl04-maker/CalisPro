package com.calishealth.api.repository;

import com.calishealth.api.entity.AiConfigurationVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiConfigurationVersionRepository extends JpaRepository<AiConfigurationVersion, Long> {
    List<AiConfigurationVersion> findByAiProfileIdOrderByCreatedAtDesc(Long aiProfileId);
}
