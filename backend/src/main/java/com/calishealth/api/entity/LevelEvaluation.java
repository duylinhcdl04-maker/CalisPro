package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

/** Bản ghi bất biến của mỗi lần xét level: đủ dữ liệu để trả lời "vì sao lên / không lên / tụt level". */
@Entity @Table(name = "level_evaluations", indexes = @Index(name = "ix_le_user", columnList = "user_id, created_at"))
public class LevelEvaluation {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @Column(name = "user_id", nullable = false) private Long userId;
 @Column(name = "assessment_session_id", nullable = false) private Long assessmentSessionId;
 @Column(name = "previous_level", length = 10) private String previousLevel;
 @Column(name = "candidate_level", length = 10) private String candidateLevel;
 @Column(name = "final_level", nullable = false, length = 10) private String finalLevel;
 @Column(name = "overall_score", precision = 5, scale = 2) private BigDecimal overallScore;
 @Column(name = "ewma_overall", precision = 5, scale = 2) private BigDecimal ewmaOverall;
 @Column(name = "reliability_gate", length = 10) private String reliabilityGate;
 @Column(name = "performance_gate", length = 10) private String performanceGate;
 @Column(name = "quality_gate", length = 10) private String qualityGate;
 @Column(name = "competency_gate", length = 10) private String competencyGate;
 @Column(name = "skill_gate", length = 10) private String skillGate;
 @Column(name = "stability_gate", length = 10) private String stabilityGate;
 // PROVISIONAL_ASSIGNED | PROMOTED | MAINTAINED | REGRESSED | RETEST_REQUIRED
 @Column(nullable = false, length = 30) private String decision;
 @Column(name = "reasons_json", nullable = false, columnDefinition = "json") private String reasonsJson;
 @Column(name = "snapshot_json", nullable = false, columnDefinition = "json") private String snapshotJson;
 @Column(name = "explanation", columnDefinition = "text") private String explanation;
 @Column(name = "rule_set_id", nullable = false) private Long ruleSetId;
 @Column(name = "algorithm_version", nullable = false, length = 30) private String algorithmVersion;
 @Column(name = "coach_override_id") private Long coachOverrideId;
 @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;

 @PrePersist void onCreate(){ createdAt = Instant.now(); }

 public Long getId(){return id;}
 public Long getUserId(){return userId;} public void setUserId(Long v){userId=v;}
 public Long getAssessmentSessionId(){return assessmentSessionId;} public void setAssessmentSessionId(Long v){assessmentSessionId=v;}
 public String getPreviousLevel(){return previousLevel;} public void setPreviousLevel(String v){previousLevel=v;}
 public String getCandidateLevel(){return candidateLevel;} public void setCandidateLevel(String v){candidateLevel=v;}
 public String getFinalLevel(){return finalLevel;} public void setFinalLevel(String v){finalLevel=v;}
 public BigDecimal getOverallScore(){return overallScore;} public void setOverallScore(BigDecimal v){overallScore=v;}
 public BigDecimal getEwmaOverall(){return ewmaOverall;} public void setEwmaOverall(BigDecimal v){ewmaOverall=v;}
 public String getReliabilityGate(){return reliabilityGate;} public void setReliabilityGate(String v){reliabilityGate=v;}
 public String getPerformanceGate(){return performanceGate;} public void setPerformanceGate(String v){performanceGate=v;}
 public String getQualityGate(){return qualityGate;} public void setQualityGate(String v){qualityGate=v;}
 public String getCompetencyGate(){return competencyGate;} public void setCompetencyGate(String v){competencyGate=v;}
 public String getSkillGate(){return skillGate;} public void setSkillGate(String v){skillGate=v;}
 public String getStabilityGate(){return stabilityGate;} public void setStabilityGate(String v){stabilityGate=v;}
 public String getDecision(){return decision;} public void setDecision(String v){decision=v;}
 public String getReasonsJson(){return reasonsJson;} public void setReasonsJson(String v){reasonsJson=v;}
 public String getSnapshotJson(){return snapshotJson;} public void setSnapshotJson(String v){snapshotJson=v;}
 public String getExplanation(){return explanation;} public void setExplanation(String v){explanation=v;}
 public Long getRuleSetId(){return ruleSetId;} public void setRuleSetId(Long v){ruleSetId=v;}
 public String getAlgorithmVersion(){return algorithmVersion;} public void setAlgorithmVersion(String v){algorithmVersion=v;}
 public Long getCoachOverrideId(){return coachOverrideId;} public void setCoachOverrideId(Long v){coachOverrideId=v;}
 public Instant getCreatedAt(){return createdAt;}
}
