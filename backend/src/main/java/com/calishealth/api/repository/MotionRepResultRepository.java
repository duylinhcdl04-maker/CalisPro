package com.calishealth.api.repository;

import com.calishealth.api.entity.MotionRepResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MotionRepResultRepository extends JpaRepository<MotionRepResult, Long> {
    List<MotionRepResult> findByMovementSessionIdOrderByRepNumberAsc(Long movementSessionId);
}
