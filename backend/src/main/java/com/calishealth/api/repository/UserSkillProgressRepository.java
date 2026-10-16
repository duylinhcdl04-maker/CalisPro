package com.calishealth.api.repository;

import com.calishealth.api.entity.UserSkillProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserSkillProgressRepository extends JpaRepository<UserSkillProgress, Long> {
    List<UserSkillProgress> findByUserId(Long userId);
    Optional<UserSkillProgress> findByUserIdAndExerciseId(Long userId, Long exerciseId);
}
