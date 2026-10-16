package com.calishealth.api.repository;

import com.calishealth.api.entity.AssessmentQuestionOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface AssessmentQuestionOptionRepository extends JpaRepository<AssessmentQuestionOption, Long> {
    @Query("select o from AssessmentQuestionOption o where o.question.id in :questionIds and o.active = true order by o.sortOrder")
    List<AssessmentQuestionOption> findActiveByQuestionIds(@Param("questionIds") Collection<Long> questionIds);

    // Gồm cả đáp án đã ẩn (để khôi phục khi admin thêm lại đúng mã)
    @Query("select o from AssessmentQuestionOption o where o.question.id = :questionId")
    List<AssessmentQuestionOption> findAllByQuestionId(@Param("questionId") Long questionId);

    @Modifying(flushAutomatically = true)
    @Query("delete from AssessmentQuestionOption o where o.question.id = :questionId")
    void deleteByQuestionId(@Param("questionId") Long questionId);
}
