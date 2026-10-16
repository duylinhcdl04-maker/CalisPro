package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Một vi phạm đã vượt persistence trong phiên phân tích - lưu đủ để kiểm toán:
 * rule nào (đúng phiên bản), đo được bao nhiêu, kỳ vọng bao nhiêu, phản hồi/audio nào đã phát.
 */
@Entity
@Table(name = "motion_violation_events", indexes = @Index(name = "ix_mve_session", columnList = "movement_session_id"))
public class MotionViolationEvent {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "movement_session_id", nullable = false) private Long movementSessionId;
    @Column(name = "rep_number") private Integer repNumber;
    @Column(name = "phase_code", length = 30) private String phaseCode;
    @Column(name = "rule_id", nullable = false) private Long ruleId;
    @Column(name = "rule_code", nullable = false, length = 80) private String ruleCode;
    @Column(name = "rule_version", nullable = false) private int ruleVersion;
    @Column(nullable = false, length = 20) private String severity;
    @Column(name = "metric_type", length = 30) private String metricType;
    @Column(name = "observed_value") private Double observedValue;
    @Column(length = 30) private String unit;
    @Column(name = "target_value") private Double targetValue;
    @Column(name = "normal_min") private Double normalMin;
    @Column(name = "normal_max") private Double normalMax;
    @Column(name = "expected_text", length = 120) private String expectedText;
    @Column(name = "feedback_code", length = 100) private String feedbackCode;
    /** Phản hồi đã được chọn phát cho vi phạm này (không bị cooldown) */
    @Column(name = "feedback_delivered", nullable = false) private boolean feedbackDelivered;
    @Column(name = "audio_url", length = 500) private String audioUrl;
    @Column(name = "invalid_rep", nullable = false) private boolean invalidRep;
    @Column(name = "stop_exercise", nullable = false) private boolean stopExercise;
    @Column(name = "timestamp_ms", nullable = false) private long timestampMs;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;

    @PrePersist void onCreate() { createdAt = Instant.now(); }

    public Long getId() { return id; }
    public Long getMovementSessionId() { return movementSessionId; } public void setMovementSessionId(Long v) { movementSessionId = v; }
    public Integer getRepNumber() { return repNumber; } public void setRepNumber(Integer v) { repNumber = v; }
    public String getPhaseCode() { return phaseCode; } public void setPhaseCode(String v) { phaseCode = v; }
    public Long getRuleId() { return ruleId; } public void setRuleId(Long v) { ruleId = v; }
    public String getRuleCode() { return ruleCode; } public void setRuleCode(String v) { ruleCode = v; }
    public int getRuleVersion() { return ruleVersion; } public void setRuleVersion(int v) { ruleVersion = v; }
    public String getSeverity() { return severity; } public void setSeverity(String v) { severity = v; }
    public String getMetricType() { return metricType; } public void setMetricType(String v) { metricType = v; }
    public Double getObservedValue() { return observedValue; } public void setObservedValue(Double v) { observedValue = v; }
    public String getUnit() { return unit; } public void setUnit(String v) { unit = v; }
    public Double getTargetValue() { return targetValue; } public void setTargetValue(Double v) { targetValue = v; }
    public Double getNormalMin() { return normalMin; } public void setNormalMin(Double v) { normalMin = v; }
    public Double getNormalMax() { return normalMax; } public void setNormalMax(Double v) { normalMax = v; }
    public String getExpectedText() { return expectedText; } public void setExpectedText(String v) { expectedText = v; }
    public String getFeedbackCode() { return feedbackCode; } public void setFeedbackCode(String v) { feedbackCode = v; }
    public boolean isFeedbackDelivered() { return feedbackDelivered; } public void setFeedbackDelivered(boolean v) { feedbackDelivered = v; }
    public String getAudioUrl() { return audioUrl; } public void setAudioUrl(String v) { audioUrl = v; }
    public boolean isInvalidRep() { return invalidRep; } public void setInvalidRep(boolean v) { invalidRep = v; }
    public boolean isStopExercise() { return stopExercise; } public void setStopExercise(boolean v) { stopExercise = v; }
    public long getTimestampMs() { return timestampMs; } public void setTimestampMs(long v) { timestampMs = v; }
    public Instant getCreatedAt() { return createdAt; }
}
