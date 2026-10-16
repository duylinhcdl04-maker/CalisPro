package com.calishealth.api.repository;

import com.calishealth.api.entity.WorkoutSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface WorkoutSessionRepository extends JpaRepository<WorkoutSession, Long> {
    List<WorkoutSession> findByUserIdOrderByStartedAtDesc(Long userId);
    Optional<WorkoutSession> findByIdAndUserId(Long id, Long userId);
}
