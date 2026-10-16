package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity @Table(name = "recommendations")
public class Recommendation {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "recommendation_run_id", nullable = false) private RecommendationRun recommendationRun;
 @Column(name = "recommendation_type", nullable = false, length = 50) private String recommendationType;
 @Column(name = "target_id") private Long targetId;
 @Column(nullable = false) private int priority = 1;
 @Column(name = "confidence_score", precision = 5, scale = 2) private BigDecimal confidenceScore;
 @Column(columnDefinition = "text") private String reason;
 @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;

 @PrePersist void onCreate(){ createdAt = Instant.now(); }

 public Long getId(){return id;}
 public RecommendationRun getRecommendationRun(){return recommendationRun;} public void setRecommendationRun(RecommendationRun v){recommendationRun=v;}
 public String getRecommendationType(){return recommendationType;} public void setRecommendationType(String v){recommendationType=v;}
 public Long getTargetId(){return targetId;} public void setTargetId(Long v){targetId=v;}
 public int getPriority(){return priority;} public void setPriority(int v){priority=v;}
 public BigDecimal getConfidenceScore(){return confidenceScore;} public void setConfidenceScore(BigDecimal v){confidenceScore=v;}
 public String getReason(){return reason;} public void setReason(String v){reason=v;}
 public Instant getCreatedAt(){return createdAt;}
}
