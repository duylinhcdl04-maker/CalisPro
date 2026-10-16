package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

/**
 * Lịch sử năng lực (append-only). Mỗi lần đánh giá ghi 1 dòng / năng lực:
 * observation = điểm riêng của lần này; blended = điểm sau khi hợp nhất mọi lần (độ tin cậy × suy giảm thời gian).
 */
@Entity @Table(name = "user_competency_scores", indexes = @Index(name = "ix_ucs_user", columnList = "user_id, competency_code, created_at"))
public class UserCompetencyScore {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @Column(name = "user_id", nullable = false) private Long userId;
 @Column(name = "assessment_session_id", nullable = false) private Long assessmentSessionId;
 @Column(name = "competency_code", nullable = false, length = 30) private String competencyCode;
 @Column(name = "observation_score", precision = 5, scale = 2) private BigDecimal observationScore;
 @Column(name = "blended_score", precision = 5, scale = 2) private BigDecimal blendedScore;
 @Column(nullable = false, precision = 4, scale = 3) private BigDecimal confidence;
 // Độ tin cậy r và hệ số chất lượng dữ liệu q của riêng observation này (dùng lại khi hợp nhất các lần sau)
 @Column(nullable = false, precision = 4, scale = 3) private BigDecimal reliability;
 @Column(name = "quality_factor", nullable = false, precision = 4, scale = 3) private BigDecimal qualityFactor;
 @Column(length = 20) private String band;
 // SELF_REPORTED | AI_MEASURED | COACH_VERIFIED
 @Column(nullable = false, length = 20) private String source;
 @Column(name = "data_quality", nullable = false, length = 20) private String dataQuality;
 @Column(length = 20) private String trend;
 @Column(name = "rule_set_id", nullable = false) private Long ruleSetId;
 @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;

 @PrePersist void onCreate(){ if (createdAt == null) createdAt = Instant.now(); }

 public Long getId(){return id;}
 public Long getUserId(){return userId;} public void setUserId(Long v){userId=v;}
 public Long getAssessmentSessionId(){return assessmentSessionId;} public void setAssessmentSessionId(Long v){assessmentSessionId=v;}
 public String getCompetencyCode(){return competencyCode;} public void setCompetencyCode(String v){competencyCode=v;}
 public BigDecimal getObservationScore(){return observationScore;} public void setObservationScore(BigDecimal v){observationScore=v;}
 public BigDecimal getBlendedScore(){return blendedScore;} public void setBlendedScore(BigDecimal v){blendedScore=v;}
 public BigDecimal getConfidence(){return confidence;} public void setConfidence(BigDecimal v){confidence=v;}
 public BigDecimal getReliability(){return reliability;} public void setReliability(BigDecimal v){reliability=v;}
 public BigDecimal getQualityFactor(){return qualityFactor;} public void setQualityFactor(BigDecimal v){qualityFactor=v;}
 public String getBand(){return band;} public void setBand(String v){band=v;}
 public String getSource(){return source;} public void setSource(String v){source=v;}
 public String getDataQuality(){return dataQuality;} public void setDataQuality(String v){dataQuality=v;}
 public String getTrend(){return trend;} public void setTrend(String v){trend=v;}
 public Long getRuleSetId(){return ruleSetId;} public void setRuleSetId(Long v){ruleSetId=v;}
 public Instant getCreatedAt(){return createdAt;} public void setCreatedAt(Instant v){createdAt=v;}
}
