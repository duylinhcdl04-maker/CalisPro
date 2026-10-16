package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity @Table(name = "fitness_profiles")
public class FitnessProfile {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id", nullable = false) private User user;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "assessment_session_id", nullable = false, unique = true) private AssessmentSession assessmentSession;
 @Column(name = "fitness_level", nullable = false, length = 30) private String fitnessLevel;
 @Column(name = "strength_score", precision = 8, scale = 2) private BigDecimal strengthScore;
 @Column(name = "endurance_score", precision = 8, scale = 2) private BigDecimal enduranceScore;
 @Column(name = "mobility_score", precision = 8, scale = 2) private BigDecimal mobilityScore;
 @Column(name = "balance_score", precision = 8, scale = 2) private BigDecimal balanceScore;
 @Column(name = "core_score", precision = 8, scale = 2) private BigDecimal coreScore;
 @Column(name = "overall_score", precision = 8, scale = 2) private BigDecimal overallScore;
 @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;

 @PrePersist void onCreate(){ createdAt = Instant.now(); }

 public Long getId(){return id;}
 public User getUser(){return user;} public void setUser(User v){user=v;}
 public AssessmentSession getAssessmentSession(){return assessmentSession;} public void setAssessmentSession(AssessmentSession v){assessmentSession=v;}
 public String getFitnessLevel(){return fitnessLevel;} public void setFitnessLevel(String v){fitnessLevel=v;}
 public BigDecimal getStrengthScore(){return strengthScore;} public void setStrengthScore(BigDecimal v){strengthScore=v;}
 public BigDecimal getEnduranceScore(){return enduranceScore;} public void setEnduranceScore(BigDecimal v){enduranceScore=v;}
 public BigDecimal getMobilityScore(){return mobilityScore;} public void setMobilityScore(BigDecimal v){mobilityScore=v;}
 public BigDecimal getBalanceScore(){return balanceScore;} public void setBalanceScore(BigDecimal v){balanceScore=v;}
 public BigDecimal getCoreScore(){return coreScore;} public void setCoreScore(BigDecimal v){coreScore=v;}
 public BigDecimal getOverallScore(){return overallScore;} public void setOverallScore(BigDecimal v){overallScore=v;}
 public Instant getCreatedAt(){return createdAt;}
}
