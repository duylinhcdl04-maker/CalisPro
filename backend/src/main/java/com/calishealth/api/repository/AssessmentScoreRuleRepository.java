package com.calishealth.api.repository;

import com.calishealth.api.entity.AssessmentScoreRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface AssessmentScoreRuleRepository extends JpaRepository<AssessmentScoreRule, Long> {
    @Query("select r from AssessmentScoreRule r where r.template.id = :templateId order by r.sortOrder")
    List<AssessmentScoreRule> findByTemplateId(@Param("templateId") Long templateId);

    /** Quy tắc mặc định của câu hỏi trong ngân hàng (không gắn bài) */
    @Query("select r from AssessmentScoreRule r where r.template is null and r.question.id in :questionIds order by r.sortOrder")
    List<AssessmentScoreRule> findBankRules(@Param("questionIds") Collection<Long> questionIds);

    @Modifying(flushAutomatically = true)
    @Query("delete from AssessmentScoreRule r where r.template.id = :templateId")
    void deleteByTemplateId(@Param("templateId") Long templateId);

    @Modifying(flushAutomatically = true)
    @Query("delete from AssessmentScoreRule r where r.template is null and r.question.id = :questionId")
    void deleteBankRulesByQuestionId(@Param("questionId") Long questionId);
}
