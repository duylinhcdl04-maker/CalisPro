package com.calishealth.api.repository;

import com.calishealth.api.entity.MovementSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MovementSessionRepository extends JpaRepository<MovementSession, Long> {
    Optional<MovementSession> findByIdAndUserId(Long id, Long userId);
}
