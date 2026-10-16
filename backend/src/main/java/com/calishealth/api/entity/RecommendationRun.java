package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity @Table(name = "recommendation_runs")
public class RecommendationRun {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id", nullable = false) private User user;
 @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "assessment_session_id") private AssessmentSession assessmentSession;
 @Column(name = "algorithm_version", nullable = false, length = 50) private String algorithmVersion;
 @Column(name = "input_snapshot", columnDefinition = "json") private String inputSnapshot;
 @Column(name = "output_snapshot", columnDefinition = "json") private String outputSnapshot;
 @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;

 @PrePersist void onCreate(){ createdAt = Instant.now(); }

 public Long getId(){return id;}
 public User getUser(){return user;} public void setUser(User v){user=v;}
 public AssessmentSession getAssessmentSession(){return assessmentSession;} public void setAssessmentSession(AssessmentSession v){assessmentSession=v;}
 public String getAlgorithmVersion(){return algorithmVersion;} public void setAlgorithmVersion(String v){algorithmVersion=v;}
 public String getInputSnapshot(){return inputSnapshot;} public void setInputSnapshot(String v){inputSnapshot=v;}
 public String getOutputSnapshot(){return outputSnapshot;} public void setOutputSnapshot(String v){outputSnapshot=v;}
 public Instant getCreatedAt(){return createdAt;}
}
