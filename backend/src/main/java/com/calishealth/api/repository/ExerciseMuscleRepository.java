package com.calishealth.api.repository;

import com.calishealth.api.entity.ExerciseMuscle;
import com.calishealth.api.entity.ExerciseMuscleId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface ExerciseMuscleRepository extends JpaRepository<ExerciseMuscle, ExerciseMuscleId> {
    @Query("select em from ExerciseMuscle em join fetch em.muscle where em.exercise.id in :exerciseIds order by em.sortOrder")
    List<ExerciseMuscle> findWithMuscleByExerciseIds(@Param("exerciseIds") Collection<Long> exerciseIds);

    // Lọc động tác theo nhóm cơ (vd. PECTORALIS_MAJOR), có thể giới hạn theo vai trò
    @Query("select distinct em.exercise.id from ExerciseMuscle em where em.muscle.code = :muscleCode and (:role is null or em.role = :role)")
    List<Long> findExerciseIdsByMuscle(@Param("muscleCode") String muscleCode, @Param("role") com.calishealth.api.entity.MuscleRole role);

    @Modifying(flushAutomatically = true)
    @Query("delete from ExerciseMuscle em where em.exercise.id = :exerciseId")
    void deleteByExerciseId(@Param("exerciseId") Long exerciseId);
}
