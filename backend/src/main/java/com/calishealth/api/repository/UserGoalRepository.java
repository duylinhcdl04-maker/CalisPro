package com.calishealth.api.repository;

import com.calishealth.api.entity.UserGoal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserGoalRepository extends JpaRepository<UserGoal, Long> {
    List<UserGoal> findByUserIdOrderByPriorityAsc(Long userId);
    Optional<UserGoal> findByIdAndUserId(Long id, Long userId);
}
