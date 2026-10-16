package com.calishealth.api.repository;

import com.calishealth.api.entity.AssessmentTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssessmentTemplateRepository extends JpaRepository<AssessmentTemplate, Long> {
    List<AssessmentTemplate> findAllByOrderByUpdatedAtDesc();
    boolean existsByCode(String code);
    java.util.Optional<AssessmentTemplate> findByCode(String code);
    /** Bài đánh giá định kỳ đang dùng (PUBLISHED, mới nhất) */
    java.util.Optional<AssessmentTemplate> findTopByTypeAndStatusOrderByVersionDescIdDesc(String type, String status);
    /** Các phiên bản cùng chuỗi: bài gốc + các bản có rootId = gốc */
    List<AssessmentTemplate> findByIdOrRootIdOrderByVersionDesc(Long id, Long rootId);
}
