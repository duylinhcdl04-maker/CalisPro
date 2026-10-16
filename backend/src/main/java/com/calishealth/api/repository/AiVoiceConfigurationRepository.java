package com.calishealth.api.repository;

import com.calishealth.api.entity.AiVoiceConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AiVoiceConfigurationRepository extends JpaRepository<AiVoiceConfiguration, Long> {
    Optional<AiVoiceConfiguration> findFirstByOrderByIdAsc();
}
