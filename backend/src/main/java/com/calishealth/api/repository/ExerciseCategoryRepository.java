package com.calishealth.api.repository;

import com.calishealth.api.entity.ExerciseCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ExerciseCategoryRepository extends JpaRepository<ExerciseCategory, Long> {
    Optional<ExerciseCategory> findByCode(String code);
}
