package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "ai_motion_rules")
public class AiMotionRule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ai_profile_id", nullable = false)
    private ExerciseAiProfile aiProfile;

    @Column(name = "rule_code", nullable = false, length = 80)
    private String ruleCode;

    @Column(name = "rule_name", nullable = false, length = 150)
    private String ruleName;

    @Column(name = "rule_type", length = 50)
    private String ruleType = "FORM_CHECK"; // FORM_CHECK, SAFETY, TEMPO, ROM

    @Column(name = "metric_type", nullable = false, length = 50)
    private String metricType; // ANGLE, DISTANCE, DEPTH, ALIGNMENT, VELOCITY, ROM, TEMPO, SYMMETRY, CUSTOM

    @Column(nullable = false, length = 30)
    private String operator; // BETWEEN, GREATER_THAN, LESS_THAN, GREATER_OR_EQUAL, LESS_OR_EQUAL, EQUAL, OUTSIDE_RANGE

    @Column(name = "threshold_min")
    private Double thresholdMin;

    @Column(name = "threshold_max")
    private Double thresholdMax;

    @Column(name = "warning_threshold")
    private Double warningThreshold;

    @Column(name = "critical_threshold")
    private Double criticalThreshold;

    @Column(nullable = false, length = 20)
    private String severity = "WARNING"; // INFO, WARNING, ERROR, CRITICAL

    @Column(name = "invalid_rep", nullable = false)
    private boolean invalidRep = false;

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(nullable = false)
    private int priority = 1; // Higher number = higher priority

    @Column(name = "feedback_message", columnDefinition = "text")
    private String feedbackMessage;

    @Column(name = "voice_prompt", columnDefinition = "text")
    private String voicePrompt;

    // ===================== Motion Rule Engine (MOTION_RULE_ENGINE_DESIGN.md) =====================
    // Mỗi dòng là MỘT PHIÊN BẢN của rule_code; chỉ status = PUBLISHED được chạy realtime / đánh giá.

    @Column(columnDefinition = "text")
    private String description;

    /** ALL hoặc mã pha của motion profile (TOP, DESCENDING, BOTTOM, ASCENDING, HOLD...) */
    @Column(name = "phase_code", length = 30)
    private String phaseCode;

    @Column(length = 30)
    private String unit;

    /** Cấu hình đo theo metric type: {"points":[11,13,15],"pointsRight":[],"method":null,"axis":null,"phase":null,"windowFrames":null} */
    @Column(name = "measurement_json", columnDefinition = "text")
    private String measurementJson;

    @Column(name = "target_value")
    private Double targetValue;

    @Column(name = "normal_min")
    private Double normalMin;

    @Column(name = "normal_max")
    private Double normalMax;

    @Column(name = "normal_min_inclusive")
    private Boolean normalMinInclusive;

    @Column(name = "normal_max_inclusive")
    private Boolean normalMaxInclusive;

    /** FRAME | TIME */
    @Column(name = "persistence_type", length = 10)
    private String persistenceType;

    /** Số khung (FRAME) hoặc mili giây (TIME) lỗi phải duy trì liên tục */
    @Column(name = "persistence_value")
    private Integer persistenceValue;

    @Column(name = "cooldown_ms")
    private Long cooldownMs;

    @Column(name = "evaluation_interval_ms")
    private Long evaluationIntervalMs;

    /** Rep chỉ bị đánh invalid khi vi phạm đạt mức này trở lên (null = mọi mức) */
    @Column(name = "invalid_rep_min_severity", length = 20)
    private String invalidRepMinSeverity;

    @Column(name = "stop_exercise")
    private Boolean stopExercise;

    @Column(name = "feedback_code", length = 100)
    private String feedbackCode;

    /** null/ANY = mọi góc; SIDE | FRONT | DIAGONAL */
    @Column(name = "camera_view", length = 20)
    private String cameraView;

    @Column(name = "rule_version")
    private Integer ruleVersion;

    /** DRAFT | PENDING_REVIEW | PUBLISHED | ARCHIVED */
    @Column(name = "status", length = 20)
    private String status;

    @Column(name = "previous_version_id")
    private Long previousVersionId;

    /** SCIENTIFIC_EVIDENCE | COACHING_BENCHMARK | PRODUCT_RULE | COACH_CONFIGURED | DATA_DERIVED */
    @Column(name = "source_type", length = 30)
    private String sourceType;

    @Column(name = "source_reference", length = 500)
    private String sourceReference;

    @Column(name = "change_note", columnDefinition = "text")
    private String changeNote;

    @Column(name = "created_by", length = 150)
    private String createdBy;

    @Column(name = "updated_by", length = 150)
    private String updatedBy;

    @Column(name = "submitted_by", length = 150)
    private String submittedBy;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "approved_by", length = 150)
    private String approvedBy;

    @Column(name = "approved_at")
    private Instant approvedAt;

    /** Lần chạy Rule Tester gần nhất trên chính phiên bản này (bắt buộc trước khi gửi duyệt) */
    @Column(name = "last_tested_at")
    private Instant lastTestedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public ExerciseAiProfile getAiProfile() { return aiProfile; }
    public void setAiProfile(ExerciseAiProfile aiProfile) { this.aiProfile = aiProfile; }
    public String getRuleCode() { return ruleCode; }
    public void setRuleCode(String ruleCode) { this.ruleCode = ruleCode; }
    public String getRuleName() { return ruleName; }
    public void setRuleName(String ruleName) { this.ruleName = ruleName; }
    public String getRuleType() { return ruleType; }
    public void setRuleType(String ruleType) { this.ruleType = ruleType; }
    public String getMetricType() { return metricType; }
    public void setMetricType(String metricType) { this.metricType = metricType; }
    public String getOperator() { return operator; }
    public void setOperator(String operator) { this.operator = operator; }
    public Double getThresholdMin() { return thresholdMin; }
    public void setThresholdMin(Double thresholdMin) { this.thresholdMin = thresholdMin; }
    public Double getThresholdMax() { return thresholdMax; }
    public void setThresholdMax(Double thresholdMax) { this.thresholdMax = thresholdMax; }
    public Double getWarningThreshold() { return warningThreshold; }
    public void setWarningThreshold(Double warningThreshold) { this.warningThreshold = warningThreshold; }
    public Double getCriticalThreshold() { return criticalThreshold; }
    public void setCriticalThreshold(Double criticalThreshold) { this.criticalThreshold = criticalThreshold; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public boolean isInvalidRep() { return invalidRep; }
    public void setInvalidRep(boolean invalidRep) { this.invalidRep = invalidRep; }
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public int getPriority() { return priority; }
    public void setPriority(int priority) { this.priority = priority; }
    public String getFeedbackMessage() { return feedbackMessage; }
    public void setFeedbackMessage(String feedbackMessage) { this.feedbackMessage = feedbackMessage; }
    public String getVoicePrompt() { return voicePrompt; }
    public void setVoicePrompt(String voicePrompt) { this.voicePrompt = voicePrompt; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    // ---- Motion Rule Engine ----
    public String getDescription() { return description; }
    public void setDescription(String v) { this.description = v; }
    public String getPhaseCode() { return phaseCode; }
    public void setPhaseCode(String v) { this.phaseCode = v; }
    public String getUnit() { return unit; }
    public void setUnit(String v) { this.unit = v; }
    public String getMeasurementJson() { return measurementJson; }
    public void setMeasurementJson(String v) { this.measurementJson = v; }
    public Double getTargetValue() { return targetValue; }
    public void setTargetValue(Double v) { this.targetValue = v; }
    public Double getNormalMin() { return normalMin; }
    public void setNormalMin(Double v) { this.normalMin = v; }
    public Double getNormalMax() { return normalMax; }
    public void setNormalMax(Double v) { this.normalMax = v; }
    public Boolean getNormalMinInclusive() { return normalMinInclusive; }
    public void setNormalMinInclusive(Boolean v) { this.normalMinInclusive = v; }
    public Boolean getNormalMaxInclusive() { return normalMaxInclusive; }
    public void setNormalMaxInclusive(Boolean v) { this.normalMaxInclusive = v; }
    public String getPersistenceType() { return persistenceType; }
    public void setPersistenceType(String v) { this.persistenceType = v; }
    public Integer getPersistenceValue() { return persistenceValue; }
    public void setPersistenceValue(Integer v) { this.persistenceValue = v; }
    public Long getCooldownMs() { return cooldownMs; }
    public void setCooldownMs(Long v) { this.cooldownMs = v; }
    public Long getEvaluationIntervalMs() { return evaluationIntervalMs; }
    public void setEvaluationIntervalMs(Long v) { this.evaluationIntervalMs = v; }
    public Boolean getStopExercise() { return stopExercise; }
    public void setStopExercise(Boolean v) { this.stopExercise = v; }
    public String getFeedbackCode() { return feedbackCode; }
    public void setFeedbackCode(String v) { this.feedbackCode = v; }
    public String getCameraView() { return cameraView; }
    public void setCameraView(String v) { this.cameraView = v; }
    public Integer getRuleVersion() { return ruleVersion; }
    public void setRuleVersion(Integer v) { this.ruleVersion = v; }
    public String getStatus() { return status; }
    public void setStatus(String v) { this.status = v; }
    public Long getPreviousVersionId() { return previousVersionId; }
    public void setPreviousVersionId(Long v) { this.previousVersionId = v; }
    public String getSourceType() { return sourceType; }
    public void setSourceType(String v) { this.sourceType = v; }
    public String getSourceReference() { return sourceReference; }
    public void setSourceReference(String v) { this.sourceReference = v; }
    public String getChangeNote() { return changeNote; }
    public void setChangeNote(String v) { this.changeNote = v; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String v) { this.createdBy = v; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String v) { this.updatedBy = v; }
    public String getSubmittedBy() { return submittedBy; }
    public void setSubmittedBy(String v) { this.submittedBy = v; }
    public java.time.Instant getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(java.time.Instant v) { this.submittedAt = v; }
    public String getApprovedBy() { return approvedBy; }
    public void setApprovedBy(String v) { this.approvedBy = v; }
    public java.time.Instant getApprovedAt() { return approvedAt; }
    public void setApprovedAt(java.time.Instant v) { this.approvedAt = v; }
    public String getInvalidRepMinSeverity() { return invalidRepMinSeverity; }
    public void setInvalidRepMinSeverity(String v) { this.invalidRepMinSeverity = v; }
    public java.time.Instant getLastTestedAt() { return lastTestedAt; }
    public void setLastTestedAt(java.time.Instant v) { this.lastTestedAt = v; }
}
