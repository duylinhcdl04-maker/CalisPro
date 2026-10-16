package com.calishealth.api.repository;

import com.calishealth.api.entity.AssessmentTestItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface AssessmentTestItemRepository extends JpaRepository<AssessmentTestItem, Long> {
    @Query("select i from AssessmentTestItem i join fetch i.exercise where i.template.id = :templateId order by i.sortOrder")
    List<AssessmentTestItem> findWithExerciseByTemplateId(Long templateId);
}
