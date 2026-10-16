package com.calishealth.api.repository;

import com.calishealth.api.entity.ExerciseAiProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExerciseAiProfileRepository extends JpaRepository<ExerciseAiProfile, Long> {
    List<ExerciseAiProfile> findByExerciseId(Long exerciseId);
    Optional<ExerciseAiProfile> findByExerciseIdAndStatus(Long exerciseId, String status);
    Optional<ExerciseAiProfile> findFirstByExerciseIdOrderByCreatedAtDesc(Long exerciseId);
    Optional<ExerciseAiProfile> findFirstByOrderByIdAsc();
}
