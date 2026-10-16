package com.calishealth.api.repository;

import com.calishealth.api.entity.Goal;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface GoalRepository extends JpaRepository<Goal, Long> {
    Optional<Goal> findByCode(String code);
    List<Goal> findByActiveTrue();
}
