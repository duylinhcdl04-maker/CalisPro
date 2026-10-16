package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

/** Kết quả đo (MediaPipe + Rule Engine) của một bài test trong bài đánh giá định kỳ. */
@Entity @Table(name = "assessment_test_results")
public class AssessmentTestResult {
 public static final String VALID = "VALID", RETEST = "RETEST";

 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @Column(name = "assessment_session_id", nullable = false) private Long assessmentSessionId;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "test_item_id", nullable = false) private AssessmentTestItem testItem;
 @Column(name = "movement_session_id") private Long movementSessionId;
 @Column(name = "total_reps") private Integer totalReps;
 @Column(name = "valid_reps") private Integer validReps;
 @Column(name = "hold_sec", precision = 7, scale = 2) private BigDecimal holdSec;
 @Column(name = "angle_deg", precision = 6, scale = 2) private BigDecimal angleDeg;
 @Column(name = "form_score", precision = 5, scale = 2) private BigDecimal formScore;
 @Column(name = "rom_score", precision = 5, scale = 2) private BigDecimal romScore;
 @Column(name = "major_violations") private Integer majorViolations;
 @Column(name = "pose_confidence_avg", precision = 4, scale = 3) private BigDecimal poseConfidenceAvg;
 @Column(name = "visibility_avg", precision = 4, scale = 3) private BigDecimal visibilityAvg;
 @Column(name = "tracked_ratio", precision = 4, scale = 3) private BigDecimal trackedRatio;
 @Column(precision = 4, scale = 3) private BigDecimal reliability;
 // SELF_REPORTED (bài chưa có AI) | AI_MEASURED | COACH_VERIFIED
 @Column(nullable = false, length = 20) private String source = "AI_MEASURED";
 @Column(nullable = false, length = 20) private String status;
 @Column(name = "status_reason", length = 255) private String statusReason;
 @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;

 @PrePersist void onCreate(){ createdAt = Instant.now(); }

 public Long getId(){return id;}
 public Long getAssessmentSessionId(){return assessmentSessionId;} public void setAssessmentSessionId(Long v){assessmentSessionId=v;}
 public AssessmentTestItem getTestItem(){return testItem;} public void setTestItem(AssessmentTestItem v){testItem=v;}
 public Long getMovementSessionId(){return movementSessionId;} public void setMovementSessionId(Long v){movementSessionId=v;}
 public Integer getTotalReps(){return totalReps;} public void setTotalReps(Integer v){totalReps=v;}
 public Integer getValidReps(){return validReps;} public void setValidReps(Integer v){validReps=v;}
 public BigDecimal getHoldSec(){return holdSec;} public void setHoldSec(BigDecimal v){holdSec=v;}
 public BigDecimal getAngleDeg(){return angleDeg;} public void setAngleDeg(BigDecimal v){angleDeg=v;}
 public BigDecimal getFormScore(){return formScore;} public void setFormScore(BigDecimal v){formScore=v;}
 public BigDecimal getRomScore(){return romScore;} public void setRomScore(BigDecimal v){romScore=v;}
 public Integer getMajorViolations(){return majorViolations;} public void setMajorViolations(Integer v){majorViolations=v;}
 public BigDecimal getPoseConfidenceAvg(){return poseConfidenceAvg;} public void setPoseConfidenceAvg(BigDecimal v){poseConfidenceAvg=v;}
 public BigDecimal getVisibilityAvg(){return visibilityAvg;} public void setVisibilityAvg(BigDecimal v){visibilityAvg=v;}
 public BigDecimal getTrackedRatio(){return trackedRatio;} public void setTrackedRatio(BigDecimal v){trackedRatio=v;}
 public BigDecimal getReliability(){return reliability;} public void setReliability(BigDecimal v){reliability=v;}
 public String getSource(){return source;} public void setSource(String v){source=v;}
 public String getStatus(){return status;} public void setStatus(String v){status=v;}
 public String getStatusReason(){return statusReason;} public void setStatusReason(String v){statusReason=v;}
 public Instant getCreatedAt(){return createdAt;}
}
