package com.calishealth.api.repository;

import com.calishealth.api.entity.AiMotionRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AiMotionRuleRepository extends JpaRepository<AiMotionRule, Long> {
    List<AiMotionRule> findByAiProfileIdOrderByPriorityDesc(Long aiProfileId);

    // ---- Motion Rule Engine: mỗi dòng là 1 phiên bản của rule_code ----
    List<AiMotionRule> findByAiProfileIdOrderByRuleCodeAscRuleVersionDesc(Long aiProfileId);
    List<AiMotionRule> findByAiProfileIdAndStatus(Long aiProfileId, String status);
    List<AiMotionRule> findByAiProfileIdAndRuleCodeOrderByRuleVersionDesc(Long aiProfileId, String ruleCode);
    List<AiMotionRule> findByStatusIsNull();
    List<AiMotionRule> findByAiProfileIdAndEnabledTrueOrderByPriorityDesc(Long aiProfileId);
    Optional<AiMotionRule> findByAiProfileIdAndRuleCode(Long aiProfileId, String ruleCode);

    // Xóa các rule có mã bắt đầu bằng prefix (vd. BUILDER_) - giữ nguyên rule admin tạo tay.
    // Chỉ xoá bản nháp: bản đang chờ duyệt / đã xuất bản / lưu trữ là lịch sử phiên bản, không được mất.
    @Modifying(flushAutomatically = true)
    @Query("delete from AiMotionRule r where r.aiProfile.id = :profileId and r.ruleCode like concat(:prefix, '%') and (r.status is null or r.status = 'DRAFT')")
    int deleteByProfileIdAndRuleCodePrefix(@Param("profileId") Long profileId, @Param("prefix") String prefix);
}
