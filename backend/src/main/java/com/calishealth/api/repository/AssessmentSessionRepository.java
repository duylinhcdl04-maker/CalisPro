package com.calishealth.api.repository;

import com.calishealth.api.entity.AssessmentSession;
import com.calishealth.api.entity.AssessmentSessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface AssessmentSessionRepository extends JpaRepository<AssessmentSession, Long> {
    Optional<AssessmentSession> findTopByUserIdOrderByCreatedAtDesc(Long userId);

    List<AssessmentSession> findByUserIdOrderByStartedAtDesc(Long userId);

    /** Lần làm / bỏ qua bài test đầu vào gần nhất của người dùng */
    Optional<AssessmentSession> findTopByUserIdAndPurposeAndStatusInOrderByCreatedAtDesc(
            Long userId, String purpose, Collection<AssessmentSessionStatus> statuses);

    /** Thống kê theo bài: [templateId, số lượt, số lượt hoàn thành, điểm trung bình] */
    @Query("select s.template.id, count(s), "
            + "sum(case when s.status = com.calishealth.api.entity.AssessmentSessionStatus.COMPLETED then 1 else 0 end), "
            + "avg(s.overallScore) from AssessmentSession s where s.template.id in :ids group by s.template.id")
    List<Object[]> statsByTemplateIds(@Param("ids") Collection<Long> templateIds);

    boolean existsByTemplateId(Long templateId);

    /** Số người đã hoàn thành bài test đầu vào ở vòng hiện tại */
    long countByPurposeAndStatusAndOnboardingRoundGreaterThanEqual(String purpose, AssessmentSessionStatus status, Integer round);
}
