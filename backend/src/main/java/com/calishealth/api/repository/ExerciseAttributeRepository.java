package com.calishealth.api.repository;

import com.calishealth.api.entity.ExerciseAttribute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface ExerciseAttributeRepository extends JpaRepository<ExerciseAttribute, Long> {
    List<ExerciseAttribute> findByExerciseIdInOrderBySortOrderAsc(Collection<Long> exerciseIds);

    // Lọc động tác theo tag / dụng cụ (không phân biệt hoa thường)
    @Query("select distinct a.exercise.id from ExerciseAttribute a where a.attributeType = :type and lower(a.attributeValue) = lower(:value)")
    List<Long> findExerciseIdsByAttribute(@Param("type") String type, @Param("value") String value);

    // Xóa hàng loạt ngay lập tức (không đợi flush) để ghi lại danh sách mới trong cùng transaction
    @Modifying(flushAutomatically = true)
    @Query("delete from ExerciseAttribute x where x.exercise.id = :exerciseId")
    void deleteByExerciseId(@Param("exerciseId") Long exerciseId);
}
