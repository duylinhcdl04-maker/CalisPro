package com.calishealth.api.repository;

import com.calishealth.api.entity.MotionViolationEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MotionViolationEventRepository extends JpaRepository<MotionViolationEvent, Long> {
    List<MotionViolationEvent> findByMovementSessionIdOrderByTimestampMsAsc(Long movementSessionId);
}
