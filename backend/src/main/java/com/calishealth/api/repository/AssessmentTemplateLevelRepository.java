package com.calishealth.api.repository;

import com.calishealth.api.entity.AssessmentTemplateLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AssessmentTemplateLevelRepository extends JpaRepository<AssessmentTemplateLevel, Long> {
    @Query("select l from AssessmentTemplateLevel l where l.template.id = :templateId order by l.sortOrder")
    List<AssessmentTemplateLevel> findByTemplateId(@Param("templateId") Long templateId);

    @Modifying(flushAutomatically = true)
    @Query("delete from AssessmentTemplateLevel l where l.template.id = :templateId")
    void deleteByTemplateId(@Param("templateId") Long templateId);
}
