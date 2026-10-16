package com.calishealth.api.repository;

import com.calishealth.api.entity.ExerciseCoachingCue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface ExerciseCoachingCueRepository extends JpaRepository<ExerciseCoachingCue, Long> {
    List<ExerciseCoachingCue> findByExerciseIdInOrderBySortOrderAsc(Collection<Long> exerciseIds);

    // Xóa hàng loạt ngay lập tức (không đợi flush) để ghi lại danh sách mới trong cùng transaction
    @Modifying(flushAutomatically = true)
    @Query("delete from ExerciseCoachingCue x where x.exercise.id = :exerciseId")
    void deleteByExerciseId(@Param("exerciseId") Long exerciseId);
}
