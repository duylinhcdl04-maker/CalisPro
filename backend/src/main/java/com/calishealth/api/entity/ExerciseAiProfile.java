package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "exercise_ai_profiles")
public class ExerciseAiProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "exercise_id", nullable = false)
    private Exercise exercise;

    @Column(name = "profile_name", nullable = false, length = 150)
    private String profileName;

    @Column(name = "pose_model", nullable = false, length = 50)
    private String poseModel = "MediaPipe BlazePose GHUM 3D";

    @Column(name = "tracking_mode", nullable = false, length = 30)
    private String trackingMode = "FULL_BODY";

    @Column(name = "analysis_enabled", nullable = false)
    private boolean analysisEnabled = true;

    @Column(name = "rep_counting_enabled", nullable = false)
    private boolean repCountingEnabled = true;

    @Column(name = "form_analysis_enabled", nullable = false)
    private boolean formAnalysisEnabled = true;

    @Column(name = "voice_warning_enabled", nullable = false)
    private boolean voiceWarningEnabled = true;

    @Column(name = "text_warning_enabled", nullable = false)
    private boolean textWarningEnabled = true;

    @Column(nullable = false, length = 20)
    private String version = "1.0";

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE"; // ACTIVE, DRAFT, TESTING, ARCHIVED

    @Column(name = "rep_start_condition", columnDefinition = "text")
    private String repStartCondition;

    @Column(name = "rep_down_condition", columnDefinition = "text")
    private String repDownCondition;

    @Column(name = "rep_up_condition", columnDefinition = "text")
    private String repUpCondition;

    @Column(name = "min_rep_duration_ms")
    private Integer minRepDurationMs = 800;

    @Column(name = "max_rep_duration_ms")
    private Integer maxRepDurationMs = 10000;

    @Column(name = "debounce_time_ms")
    private Integer debounceTimeMs = 400;

    @Column(name = "min_rom_percentage")
    private Double minRomPercentage = 75.0;

    // ===================== Motion Profile (Motion Rule Engine) =====================
    /** Góc camera chuẩn của profile: SIDE | FRONT | DIAGONAL | ANY */
    @Column(name = "camera_view", length = 20)
    private String cameraView;

    /** REPS (đếm rep) | HOLD (giữ tĩnh) */
    @Column(name = "movement_type", length = 10)
    private String movementType;

    /** Chỉ số chính của máy trạng thái rep - góc 3 điểm: {"points":[11,13,15]} */
    @Column(name = "rep_metric_json", columnDefinition = "text")
    private String repMetricJson;

    /** Ngưỡng của chỉ số chính: ≥ top = TOP, ≤ bottom = BOTTOM (HOLD: khoảng [bottom, top] = đang giữ) */
    @Column(name = "rep_top_threshold")
    private Double repTopThreshold;

    @Column(name = "rep_bottom_threshold")
    private Double repBottomThreshold;

    /** DESCENDING_FIRST | ASCENDING_FIRST */
    @Column(name = "rep_direction", length = 20)
    private String repDirection;

    /** Dưới ngưỡng này: dữ liệu không đủ tin cậy -> không đưa ra cảnh báo form */
    @Column(name = "min_pose_confidence")
    private Double minPoseConfidence;

    @Column(name = "min_landmark_visibility")
    private Double minLandmarkVisibility;

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
    public Exercise getExercise() { return exercise; }
    public void setExercise(Exercise exercise) { this.exercise = exercise; }
    public String getProfileName() { return profileName; }
    public void setProfileName(String profileName) { this.profileName = profileName; }
    public String getPoseModel() { return poseModel; }
    public void setPoseModel(String poseModel) { this.poseModel = poseModel; }
    public String getTrackingMode() { return trackingMode; }
    public void setTrackingMode(String trackingMode) { this.trackingMode = trackingMode; }
    public boolean isAnalysisEnabled() { return analysisEnabled; }
    public void setAnalysisEnabled(boolean analysisEnabled) { this.analysisEnabled = analysisEnabled; }
    public boolean isRepCountingEnabled() { return repCountingEnabled; }
    public void setRepCountingEnabled(boolean repCountingEnabled) { this.repCountingEnabled = repCountingEnabled; }
    public boolean isFormAnalysisEnabled() { return formAnalysisEnabled; }
    public void setFormAnalysisEnabled(boolean formAnalysisEnabled) { this.formAnalysisEnabled = formAnalysisEnabled; }
    public boolean isVoiceWarningEnabled() { return voiceWarningEnabled; }
    public void setVoiceWarningEnabled(boolean voiceWarningEnabled) { this.voiceWarningEnabled = voiceWarningEnabled; }
    public boolean isTextWarningEnabled() { return textWarningEnabled; }
    public void setTextWarningEnabled(boolean textWarningEnabled) { this.textWarningEnabled = textWarningEnabled; }
    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getRepStartCondition() { return repStartCondition; }
    public void setRepStartCondition(String repStartCondition) { this.repStartCondition = repStartCondition; }
    public String getRepDownCondition() { return repDownCondition; }
    public void setRepDownCondition(String repDownCondition) { this.repDownCondition = repDownCondition; }
    public String getRepUpCondition() { return repUpCondition; }
    public void setRepUpCondition(String repUpCondition) { this.repUpCondition = repUpCondition; }
    public Integer getMinRepDurationMs() { return minRepDurationMs; }
    public void setMinRepDurationMs(Integer minRepDurationMs) { this.minRepDurationMs = minRepDurationMs; }
    public Integer getMaxRepDurationMs() { return maxRepDurationMs; }
    public void setMaxRepDurationMs(Integer maxRepDurationMs) { this.maxRepDurationMs = maxRepDurationMs; }
    public Integer getDebounceTimeMs() { return debounceTimeMs; }
    public void setDebounceTimeMs(Integer debounceTimeMs) { this.debounceTimeMs = debounceTimeMs; }
    public Double getMinRomPercentage() { return minRomPercentage; }
    public void setMinRomPercentage(Double minRomPercentage) { this.minRomPercentage = minRomPercentage; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public String getCameraView() { return cameraView; }
    public void setCameraView(String v) { this.cameraView = v; }
    public String getMovementType() { return movementType; }
    public void setMovementType(String v) { this.movementType = v; }
    public String getRepMetricJson() { return repMetricJson; }
    public void setRepMetricJson(String v) { this.repMetricJson = v; }
    public Double getRepTopThreshold() { return repTopThreshold; }
    public void setRepTopThreshold(Double v) { this.repTopThreshold = v; }
    public Double getRepBottomThreshold() { return repBottomThreshold; }
    public void setRepBottomThreshold(Double v) { this.repBottomThreshold = v; }
    public String getRepDirection() { return repDirection; }
    public void setRepDirection(String v) { this.repDirection = v; }
    public Double getMinPoseConfidence() { return minPoseConfidence; }
    public void setMinPoseConfidence(Double v) { this.minPoseConfidence = v; }
    public Double getMinLandmarkVisibility() { return minLandmarkVisibility; }
    public void setMinLandmarkVisibility(Double v) { this.minLandmarkVisibility = v; }
}
