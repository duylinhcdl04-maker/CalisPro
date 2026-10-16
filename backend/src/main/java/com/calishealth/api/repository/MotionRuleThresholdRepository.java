package com.calishealth.api.repository;

import com.calishealth.api.entity.MotionRuleThreshold;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;

public interface MotionRuleThresholdRepository extends JpaRepository<MotionRuleThreshold, Long> {
    List<MotionRuleThreshold> findByRuleIdOrderBySortOrderAsc(Long ruleId);
    List<MotionRuleThreshold> findByRuleIdIn(Collection<Long> ruleIds);

    @Modifying(flushAutomatically = true)
    @Query("delete from MotionRuleThreshold t where t.ruleId = :ruleId")
    void deleteByRuleId(Long ruleId);

    /** Dọn dải ngưỡng của rule đã bị xoá bởi luồng cũ (Exercise Builder / màn hình rule cũ). */
    @Modifying(flushAutomatically = true)
    @Query("delete from MotionRuleThreshold t where t.ruleId not in (select r.id from AiMotionRule r)")
    int deleteOrphans();
}
