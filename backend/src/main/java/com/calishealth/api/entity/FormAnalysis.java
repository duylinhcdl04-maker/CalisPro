package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity @Table(name = "form_analysis")
public class FormAnalysis {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "movement_session_id", nullable = false) private MovementSession movementSession;
 @Column(name = "overall_score", precision = 5, scale = 2) private BigDecimal overallScore;
 @Column(name = "stability_score", precision = 5, scale = 2) private BigDecimal stabilityScore;
 @Column(name = "range_of_motion", precision = 5, scale = 2) private BigDecimal rangeOfMotion;
 @Column(name = "alignment_score", precision = 5, scale = 2) private BigDecimal alignmentScore;
 @Column(name = "tempo_score", precision = 5, scale = 2) private BigDecimal tempoScore;
 @Column(name = "analysis_version", nullable = false, length = 50) private String analysisVersion;
 @Column(columnDefinition = "text") private String feedback;
 @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;

 @PrePersist void onCreate(){ createdAt = Instant.now(); }

 public Long getId(){return id;}
 public MovementSession getMovementSession(){return movementSession;} public void setMovementSession(MovementSession v){movementSession=v;}
 public BigDecimal getOverallScore(){return overallScore;} public void setOverallScore(BigDecimal v){overallScore=v;}
 public BigDecimal getStabilityScore(){return stabilityScore;} public void setStabilityScore(BigDecimal v){stabilityScore=v;}
 public BigDecimal getRangeOfMotion(){return rangeOfMotion;} public void setRangeOfMotion(BigDecimal v){rangeOfMotion=v;}
 public BigDecimal getAlignmentScore(){return alignmentScore;} public void setAlignmentScore(BigDecimal v){alignmentScore=v;}
 public BigDecimal getTempoScore(){return tempoScore;} public void setTempoScore(BigDecimal v){tempoScore=v;}
 public String getAnalysisVersion(){return analysisVersion;} public void setAnalysisVersion(String v){analysisVersion=v;}
 public String getFeedback(){return feedback;} public void setFeedback(String v){feedback=v;}
 public Instant getCreatedAt(){return createdAt;}
}
