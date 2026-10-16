package com.calishealth.api.repository;

import com.calishealth.api.entity.MotionFeedbackTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface MotionFeedbackTemplateRepository extends JpaRepository<MotionFeedbackTemplate, Long> {
    Optional<MotionFeedbackTemplate> findByFeedbackCodeAndLanguage(String feedbackCode, String language);
    List<MotionFeedbackTemplate> findByAiProfileIdOrderByFeedbackCodeAsc(Long aiProfileId);
    List<MotionFeedbackTemplate> findByFeedbackCodeInAndLanguage(Collection<String> codes, String language);
    boolean existsByFeedbackCodeAndActiveTrue(String feedbackCode);
}
