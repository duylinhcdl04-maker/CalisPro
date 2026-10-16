package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "ai_landmark_requirements")
public class AiLandmarkRequirement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ai_profile_id", nullable = false)
    private ExerciseAiProfile aiProfile;

    @Column(name = "landmark_name", nullable = false, length = 60)
    private String landmarkName;

    @Column(name = "landmark_index")
    private Integer landmarkIndex;

    @Column(nullable = false)
    private boolean required = true;

    @Column(name = "min_visibility")
    private Double minVisibility = 0.65;

    @Column(length = 20)
    private String side = "BOTH"; // LEFT, RIGHT, BOTH, CENTER

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public ExerciseAiProfile getAiProfile() { return aiProfile; }
    public void setAiProfile(ExerciseAiProfile aiProfile) { this.aiProfile = aiProfile; }
    public String getLandmarkName() { return landmarkName; }
    public void setLandmarkName(String landmarkName) { this.landmarkName = landmarkName; }
    public Integer getLandmarkIndex() { return landmarkIndex; }
    public void setLandmarkIndex(Integer landmarkIndex) { this.landmarkIndex = landmarkIndex; }
    public boolean isRequired() { return required; }
    public void setRequired(boolean required) { this.required = required; }
    public Double getMinVisibility() { return minVisibility; }
    public void setMinVisibility(Double minVisibility) { this.minVisibility = minVisibility; }
    public String getSide() { return side; }
    public void setSide(String side) { this.side = side; }
    public Instant getCreatedAt() { return createdAt; }
}
