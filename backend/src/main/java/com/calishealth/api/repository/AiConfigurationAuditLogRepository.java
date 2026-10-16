package com.calishealth.api.repository;

import com.calishealth.api.entity.AiConfigurationAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiConfigurationAuditLogRepository extends JpaRepository<AiConfigurationAuditLog, Long> {
    List<AiConfigurationAuditLog> findTop50ByOrderByCreatedAtDesc();
    List<AiConfigurationAuditLog> findByProfileIdOrderByCreatedAtDesc(Long profileId);
    List<AiConfigurationAuditLog> findByTargetRefOrderByCreatedAtDesc(String targetRef);
}
