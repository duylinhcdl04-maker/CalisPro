package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "ai_configuration_versions")
public class AiConfigurationVersion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ai_profile_id", nullable = false)
    private ExerciseAiProfile aiProfile;

    @Column(name = "version_number", nullable = false, length = 20)
    private String versionNumber;

    @Column(name = "configuration_snapshot", nullable = false, columnDefinition = "longtext")
    private String configurationSnapshot;

    @Column(nullable = false, length = 30)
    private String status = "DRAFT"; // DRAFT, TESTING, ACTIVE, ARCHIVED

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "approved_by", length = 100)
    private String approvedBy;

    @Column(name = "change_summary", columnDefinition = "text")
    private String changeSummary;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "published_at")
    private Instant publishedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public ExerciseAiProfile getAiProfile() { return aiProfile; }
    public void setAiProfile(ExerciseAiProfile aiProfile) { this.aiProfile = aiProfile; }
    public String getVersionNumber() { return versionNumber; }
    public void setVersionNumber(String versionNumber) { this.versionNumber = versionNumber; }
    public String getConfigurationSnapshot() { return configurationSnapshot; }
    public void setConfigurationSnapshot(String configurationSnapshot) { this.configurationSnapshot = configurationSnapshot; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public String getApprovedBy() { return approvedBy; }
    public void setApprovedBy(String approvedBy) { this.approvedBy = approvedBy; }
    public String getChangeSummary() { return changeSummary; }
    public void setChangeSummary(String changeSummary) { this.changeSummary = changeSummary; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getPublishedAt() { return publishedAt; }
    public void setPublishedAt(Instant publishedAt) { this.publishedAt = publishedAt; }
}
