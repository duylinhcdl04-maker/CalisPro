package com.calishealth.api.entity;

import jakarta.persistence.*;

/** Một dải mức độ TƯỜNG MINH của rule (WARNING / ERROR / CRITICAL); null = cận mở. */
@Entity
@Table(name = "motion_rule_thresholds")
public class MotionRuleThreshold {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "rule_id", nullable = false) private Long ruleId;
    @Column(nullable = false, length = 20) private String severity;
    @Column(name = "min_value") private Double minValue;
    @Column(name = "max_value") private Double maxValue;
    @Column(name = "min_inclusive", nullable = false) private boolean minInclusive = true;
    @Column(name = "max_inclusive", nullable = false) private boolean maxInclusive = true;
    @Column(name = "sort_order", nullable = false) private int sortOrder;

    public Long getId() { return id; }
    public Long getRuleId() { return ruleId; } public void setRuleId(Long v) { ruleId = v; }
    public String getSeverity() { return severity; } public void setSeverity(String v) { severity = v; }
    public Double getMinValue() { return minValue; } public void setMinValue(Double v) { minValue = v; }
    public Double getMaxValue() { return maxValue; } public void setMaxValue(Double v) { maxValue = v; }
    public boolean isMinInclusive() { return minInclusive; } public void setMinInclusive(boolean v) { minInclusive = v; }
    public boolean isMaxInclusive() { return maxInclusive; } public void setMaxInclusive(boolean v) { maxInclusive = v; }
    public int getSortOrder() { return sortOrder; } public void setSortOrder(int v) { sortOrder = v; }
}
