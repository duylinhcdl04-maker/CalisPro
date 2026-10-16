package com.calishealth.api.repository;

import com.calishealth.api.entity.AssessmentQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AssessmentQuestionRepository extends JpaRepository<AssessmentQuestion, Long> {
    Optional<AssessmentQuestion> findByQuestionCode(String code);
    boolean existsByQuestionCode(String code);
    /** Ngân hàng câu hỏi: câu hỏi không thuộc riêng bài nào */
    List<AssessmentQuestion> findByOwnerTemplateIdIsNullAndActiveTrueOrderByUpdatedAtDesc();
}
