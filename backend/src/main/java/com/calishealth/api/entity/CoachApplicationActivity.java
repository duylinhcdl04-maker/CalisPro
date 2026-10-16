package com.calishealth.api.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "coach_application_activities")
public class CoachApplicationActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false)
    @JsonIgnore
    private CoachApplication application;

    @Column(name = "activity_name", nullable = false, length = 255)
    private String activityName;

    @Column(name = "role_or_achievement", nullable = false, length = 255)
    private String roleOrAchievement;

    @Column(name = "organizer", length = 255)
    private String organizer;

    @Column(name = "event_year")
    private Integer eventYear;

    @Column(name = "proof_image_url", columnDefinition = "LONGTEXT")
    private String proofImageUrl;

    @Column(name = "proof_link_url", length = 500)
    private String proofLinkUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public CoachApplication getApplication() { return application; }
    public void setApplication(CoachApplication application) { this.application = application; }

    public String getActivityName() { return activityName; }
    public void setActivityName(String activityName) { this.activityName = activityName; }

    public String getRoleOrAchievement() { return roleOrAchievement; }
    public void setRoleOrAchievement(String roleOrAchievement) { this.roleOrAchievement = roleOrAchievement; }

    public String getOrganizer() { return organizer; }
    public void setOrganizer(String organizer) { this.organizer = organizer; }

    public Integer getEventYear() { return eventYear; }
    public void setEventYear(Integer eventYear) { this.eventYear = eventYear; }

    public String getProofImageUrl() { return proofImageUrl; }
    public void setProofImageUrl(String proofImageUrl) { this.proofImageUrl = proofImageUrl; }

    public String getProofLinkUrl() { return proofLinkUrl; }
    public void setProofLinkUrl(String proofLinkUrl) { this.proofLinkUrl = proofLinkUrl; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
