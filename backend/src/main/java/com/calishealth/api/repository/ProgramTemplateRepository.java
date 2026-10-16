package com.calishealth.api.repository;

import com.calishealth.api.entity.ProgramTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProgramTemplateRepository extends JpaRepository<ProgramTemplate, Long> {
    List<ProgramTemplate> findByStatus(String status);
    List<ProgramTemplate> findByStatusNotOrderByUpdatedAtDesc(String status);
    Optional<ProgramTemplate> findTopByCodeOrderByVersionDesc(String code);
    boolean existsByCode(String code);
}
