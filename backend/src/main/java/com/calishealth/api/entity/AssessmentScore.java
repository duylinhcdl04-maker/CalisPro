package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity @Table(name = "assessment_scores")
public class AssessmentScore {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "assessment_session_id", nullable = false) private AssessmentSession assessmentSession;
 @Column(name = "score_type", nullable = false, length = 50) private String scoreType;
 @Column(nullable = false, precision = 8, scale = 2) private BigDecimal score;
 @Column(length = 30) private String level;
 @Column(columnDefinition = "json") private String metadata;
 @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;

 @PrePersist void onCreate(){ createdAt = Instant.now(); }

 public Long getId(){return id;}
 public AssessmentSession getAssessmentSession(){return assessmentSession;} public void setAssessmentSession(AssessmentSession v){assessmentSession=v;}
 public String getScoreType(){return scoreType;} public void setScoreType(String v){scoreType=v;}
 public BigDecimal getScore(){return score;} public void setScore(BigDecimal v){score=v;}
 public String getLevel(){return level;} public void setLevel(String v){level=v;}
 public String getMetadata(){return metadata;} public void setMetadata(String v){metadata=v;}
 public Instant getCreatedAt(){return createdAt;}
}
