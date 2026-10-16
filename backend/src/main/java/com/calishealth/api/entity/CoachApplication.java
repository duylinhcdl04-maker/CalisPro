package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "coach_applications")
public class CoachApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "full_name", nullable = false, length = 255)
    private String fullName;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "gender", length = 30)
    private String gender;

    @Column(name = "phone_number", nullable = false, length = 50)
    private String phoneNumber;

    @Column(name = "email", nullable = false, length = 255)
    private String email;

    @Column(name = "location", length = 255)
    private String location;

    @Column(name = "id_card_number", nullable = false, length = 50)
    private String idCardNumber;

    @Column(name = "id_card_front_url", nullable = false, columnDefinition = "LONGTEXT")
    private String idCardFrontUrl;

    @Column(name = "id_card_back_url", nullable = false, columnDefinition = "LONGTEXT")
    private String idCardBackUrl;

    @Column(name = "experience_years", nullable = false)
    private Integer experienceYears = 1;

    @Column(name = "primary_specialty", nullable = false, length = 100)
    private String primarySpecialty;

    @Column(name = "skills_description", columnDefinition = "TEXT")
    private String skillsDescription;

    @Column(name = "personal_records", columnDefinition = "TEXT")
    private String personalRecords;

    @Column(name = "skill_demo_video_url", length = 500)
    private String skillDemoVideoUrl;

    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;

    @Column(name = "expected_rate", length = 100)
    private String expectedRate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private CoachApplicationStatus status = CoachApplicationStatus.PENDING;

    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "application", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CoachApplicationCertificate> certificates = new ArrayList<>();

    @OneToMany(mappedBy = "application", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CoachApplicationActivity> activities = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public void addCertificate(CoachApplicationCertificate cert) {
        certificates.add(cert);
        cert.setApplication(this);
    }

    public void removeCertificate(CoachApplicationCertificate cert) {
        certificates.remove(cert);
        cert.setApplication(null);
    }

    public void addActivity(CoachApplicationActivity act) {
        activities.add(act);
        act.setApplication(this);
    }

    public void removeActivity(CoachApplicationActivity act) {
        activities.remove(act);
        act.setApplication(null);
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getIdCardNumber() { return idCardNumber; }
    public void setIdCardNumber(String idCardNumber) { this.idCardNumber = idCardNumber; }

    public String getIdCardFrontUrl() { return idCardFrontUrl; }
    public void setIdCardFrontUrl(String idCardFrontUrl) { this.idCardFrontUrl = idCardFrontUrl; }

    public String getIdCardBackUrl() { return idCardBackUrl; }
    public void setIdCardBackUrl(String idCardBackUrl) { this.idCardBackUrl = idCardBackUrl; }

    public Integer getExperienceYears() { return experienceYears; }
    public void setExperienceYears(Integer experienceYears) { this.experienceYears = experienceYears; }

    public String getPrimarySpecialty() { return primarySpecialty; }
    public void setPrimarySpecialty(String primarySpecialty) { this.primarySpecialty = primarySpecialty; }

    public String getSkillsDescription() { return skillsDescription; }
    public void setSkillsDescription(String skillsDescription) { this.skillsDescription = skillsDescription; }

    public String getPersonalRecords() { return personalRecords; }
    public void setPersonalRecords(String personalRecords) { this.personalRecords = personalRecords; }

    public String getSkillDemoVideoUrl() { return skillDemoVideoUrl; }
    public void setSkillDemoVideoUrl(String skillDemoVideoUrl) { this.skillDemoVideoUrl = skillDemoVideoUrl; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getExpectedRate() { return expectedRate; }
    public void setExpectedRate(String expectedRate) { this.expectedRate = expectedRate; }

    public CoachApplicationStatus getStatus() { return status; }
    public void setStatus(CoachApplicationStatus status) { this.status = status; }

    public String getAdminNotes() { return adminNotes; }
    public void setAdminNotes(String adminNotes) { this.adminNotes = adminNotes; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public User getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(User reviewedBy) { this.reviewedBy = reviewedBy; }

    public Instant getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(Instant reviewedAt) { this.reviewedAt = reviewedAt; }

    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    public List<CoachApplicationCertificate> getCertificates() { return certificates; }
    public void setCertificates(List<CoachApplicationCertificate> certificates) { this.certificates = certificates; }

    public List<CoachApplicationActivity> getActivities() { return activities; }
    public void setActivities(List<CoachApplicationActivity> activities) { this.activities = activities; }
}
