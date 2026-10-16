package com.calishealth.api.repository;

import com.calishealth.api.entity.Exercise;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ExerciseRepository extends JpaRepository<Exercise, Long> {
    List<Exercise> findByActiveTrue();
    Optional<Exercise> findByCode(String code);
    List<Exercise> findByCategoryId(Long categoryId);
}
