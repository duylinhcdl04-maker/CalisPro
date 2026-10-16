package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity @Table(name = "movement_sessions")
public class MovementSession {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 // Phiên đo thuộc buổi tập HOẶC thuộc bài đánh giá định kỳ (cột DB cần chạy db/migration_level_engine.sql để bỏ NOT NULL)
 @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "workout_session_id") private WorkoutSession workoutSession;
 @Column(name = "assessment_session_id") private Long assessmentSessionId;
 // ---- Phiên phân tích của Motion Rule Engine ----
 @Column(name = "user_id") private Long userId;
 @Column(name = "ai_profile_id") private Long aiProfileId;
 @Column(name = "profile_version", length = 20) private String profileVersion;
 /** TRAINING | ASSESSMENT */
 @Column(name = "analysis_context", length = 20) private String analysisContext;
 @Column(name = "camera_view", length = 20) private String cameraView;
 @Column(name = "test_item_id") private Long testItemId;
 @Column(name = "summary_json", columnDefinition = "text") private String summaryJson;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "exercise_id", nullable = false) private Exercise exercise;
 @Column(name = "video_url", length = 1000) private String videoUrl;
 @Column(name = "started_at") private Instant startedAt;
 @Column(name = "ended_at") private Instant endedAt;
 @Column(name = "frame_rate", precision = 7, scale = 3) private BigDecimal frameRate;
 @Column(name = "model_name", length = 100) private String modelName;
 @Column(name = "model_version", length = 50) private String modelVersion;
 @Enumerated(EnumType.STRING) @Column(name = "processing_status", nullable = false, length = 30) private MovementProcessingStatus processingStatus = MovementProcessingStatus.PENDING;
 @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;

 @PrePersist void onCreate(){ createdAt = Instant.now(); }

 public Long getId(){return id;}
 public WorkoutSession getWorkoutSession(){return workoutSession;} public void setWorkoutSession(WorkoutSession v){workoutSession=v;}
 public Long getAssessmentSessionId(){return assessmentSessionId;} public void setAssessmentSessionId(Long v){assessmentSessionId=v;}
 public Exercise getExercise(){return exercise;} public void setExercise(Exercise v){exercise=v;}
 public String getVideoUrl(){return videoUrl;} public void setVideoUrl(String v){videoUrl=v;}
 public Instant getStartedAt(){return startedAt;} public void setStartedAt(Instant v){startedAt=v;}
 public Instant getEndedAt(){return endedAt;} public void setEndedAt(Instant v){endedAt=v;}
 public BigDecimal getFrameRate(){return frameRate;} public void setFrameRate(BigDecimal v){frameRate=v;}
 public String getModelName(){return modelName;} public void setModelName(String v){modelName=v;}
 public String getModelVersion(){return modelVersion;} public void setModelVersion(String v){modelVersion=v;}
 public MovementProcessingStatus getProcessingStatus(){return processingStatus;} public void setProcessingStatus(MovementProcessingStatus v){processingStatus=v;}
 public Instant getCreatedAt(){return createdAt;}
 public Long getUserId(){return userId;} public void setUserId(Long v){userId=v;}
 public Long getAiProfileId(){return aiProfileId;} public void setAiProfileId(Long v){aiProfileId=v;}
 public String getProfileVersion(){return profileVersion;} public void setProfileVersion(String v){profileVersion=v;}
 public String getAnalysisContext(){return analysisContext;} public void setAnalysisContext(String v){analysisContext=v;}
 public String getCameraView(){return cameraView;} public void setCameraView(String v){cameraView=v;}
 public Long getTestItemId(){return testItemId;} public void setTestItemId(Long v){testItemId=v;}
 public String getSummaryJson(){return summaryJson;} public void setSummaryJson(String v){summaryJson=v;}
}
