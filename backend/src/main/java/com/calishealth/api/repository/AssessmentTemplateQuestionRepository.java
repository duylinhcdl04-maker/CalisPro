package com.calishealth.api.repository;

import com.calishealth.api.entity.AssessmentTemplateQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface AssessmentTemplateQuestionRepository extends JpaRepository<AssessmentTemplateQuestion, Long> {
    @Query("select tq from AssessmentTemplateQuestion tq join fetch tq.question where tq.template.id = :templateId order by tq.sortOrder")
    List<AssessmentTemplateQuestion> findWithQuestionByTemplateId(@Param("templateId") Long templateId);

    /** [templateId, số câu hỏi] */
    @Query("select tq.template.id, count(tq) from AssessmentTemplateQuestion tq where tq.template.id in :ids group by tq.template.id")
    List<Object[]> countByTemplateIds(@Param("ids") Collection<Long> templateIds);

    /** [questionId, số bài đánh giá đang dùng] */
    @Query("select tq.question.id, count(distinct tq.template.id) from AssessmentTemplateQuestion tq group by tq.question.id")
    List<Object[]> countUsageByQuestion();

    boolean existsByQuestionId(Long questionId);

    @Modifying(flushAutomatically = true)
    @Query("delete from AssessmentTemplateQuestion tq where tq.template.id = :templateId")
    void deleteByTemplateId(@Param("templateId") Long templateId);
}
