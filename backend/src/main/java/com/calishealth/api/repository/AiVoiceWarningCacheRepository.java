package com.calishealth.api.repository;

import com.calishealth.api.entity.AiVoiceWarningCache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AiVoiceWarningCacheRepository extends JpaRepository<AiVoiceWarningCache, Long> {
    Optional<AiVoiceWarningCache> findByTextHash(String textHash);
}
