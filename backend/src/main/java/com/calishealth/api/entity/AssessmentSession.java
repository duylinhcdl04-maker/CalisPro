package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity @Table(name = "assessment_sessions")
public class AssessmentSession {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id", nullable = false) private User user;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "assessment_type_id", nullable = false) private AssessmentType assessmentType;
 @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "template_id") private AssessmentTemplate template;
 @Column(name = "template_version") private Integer templateVersion;
 // ONBOARDING = bài test đầu vào; GENERAL = các bài đánh giá khác
 @Column(nullable = false, length = 30) private String purpose = "GENERAL";
 // SELF_REPORTED (tự khai báo) | AI_MEASURED | COACH_VERIFIED
 @Column(nullable = false, length = 30) private String source = "SELF_REPORTED";
 @Column(name = "onboarding_round") private Integer onboardingRound;
 @Column(name = "overall_score", precision = 6, scale = 2) private java.math.BigDecimal overallScore;
 @Column(name = "level_code", length = 30) private String levelCode;
 @Column(name = "started_at", nullable = false) private Instant startedAt;
 @Column(name = "completed_at") private Instant completedAt;
 @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30) private AssessmentSessionStatus status = AssessmentSessionStatus.IN_PROGRESS;
 @Column(nullable = false, length = 20) private String version = "1.0";
 // HIGH | MEDIUM | LOW | CONFLICTED (chất lượng dữ liệu tự khai báo) hoặc RETEST_REQUIRED (đo không tin cậy)
 @Column(name = "data_quality_status", length = 20) private String dataQualityStatus;
 @Column(precision = 4, scale = 3) private java.math.BigDecimal confidence;
 @Column(name = "rule_set_id") private Long ruleSetId;
 @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;

 @PrePersist void onCreate(){ if(startedAt == null) startedAt = Instant.now(); createdAt = Instant.now(); }

 public Long getId(){return id;}
 public User getUser(){return user;} public void setUser(User v){user=v;}
 public AssessmentType getAssessmentType(){return assessmentType;} public void setAssessmentType(AssessmentType v){assessmentType=v;}
 public AssessmentTemplate getTemplate(){return template;} public void setTemplate(AssessmentTemplate v){template=v;}
 public Integer getTemplateVersion(){return templateVersion;} public void setTemplateVersion(Integer v){templateVersion=v;}
 public String getPurpose(){return purpose;} public void setPurpose(String v){purpose=v;}
 public String getSource(){return source;} public void setSource(String v){source=v;}
 public Integer getOnboardingRound(){return onboardingRound;} public void setOnboardingRound(Integer v){onboardingRound=v;}
 public java.math.BigDecimal getOverallScore(){return overallScore;} public void setOverallScore(java.math.BigDecimal v){overallScore=v;}
 public String getLevelCode(){return levelCode;} public void setLevelCode(String v){levelCode=v;}
 public Instant getStartedAt(){return startedAt;} public void setStartedAt(Instant v){startedAt=v;}
 public Instant getCompletedAt(){return completedAt;} public void setCompletedAt(Instant v){completedAt=v;}
 public AssessmentSessionStatus getStatus(){return status;} public void setStatus(AssessmentSessionStatus v){status=v;}
 public String getVersion(){return version;} public void setVersion(String v){version=v;}
 public String getDataQualityStatus(){return dataQualityStatus;} public void setDataQualityStatus(String v){dataQualityStatus=v;}
 public java.math.BigDecimal getConfidence(){return confidence;} public void setConfidence(java.math.BigDecimal v){confidence=v;}
 public Long getRuleSetId(){return ruleSetId;} public void setRuleSetId(Long v){ruleSetId=v;}
 public Instant getCreatedAt(){return createdAt;}
}
