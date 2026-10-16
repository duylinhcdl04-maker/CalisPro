package com.calishealth.api.dto;

import com.calishealth.api.entity.CoachApplication;
import com.calishealth.api.entity.CoachApplicationStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

public class CoachApplicationResponse {

    private Long id;
    private Long userId;
    private String userEmail;
    private String fullName;
    private LocalDate dateOfBirth;
    private String gender;
    private String phoneNumber;
    private String email;
    private String location;
    private String idCardNumber;
    private String idCardFrontUrl;
    private String idCardBackUrl;
    private Integer experienceYears;
    private String primarySpecialty;
    private String skillsDescription;
    private String personalRecords;
    private String skillDemoVideoUrl;
    private String bio;
    private String expectedRate;
    private CoachApplicationStatus status;
    private String adminNotes;
    private String rejectionReason;
    private Long reviewedById;
    private String reviewedByEmail;
    private Instant reviewedAt;
    private Instant createdAt;
    private Instant updatedAt;
    private List<CertificateItemDto> certificates;
    private List<ActivityItemDto> activities;

    public static CoachApplicationResponse fromEntity(CoachApplication entity) {
        CoachApplicationResponse resp = new CoachApplicationResponse();
        resp.setId(entity.getId());
        if (entity.getUser() != null) {
            resp.setUserId(entity.getUser().getId());
            resp.setUserEmail(entity.getUser().getEmail());
        }
        resp.setFullName(entity.getFullName());
        resp.setDateOfBirth(entity.getDateOfBirth());
        resp.setGender(entity.getGender());
        resp.setPhoneNumber(entity.getPhoneNumber());
        resp.setEmail(entity.getEmail());
        resp.setLocation(entity.getLocation());
        resp.setIdCardNumber(entity.getIdCardNumber());
        resp.setIdCardFrontUrl(entity.getIdCardFrontUrl());
        resp.setIdCardBackUrl(entity.getIdCardBackUrl());
        resp.setExperienceYears(entity.getExperienceYears());
        resp.setPrimarySpecialty(entity.getPrimarySpecialty());
        resp.setSkillsDescription(entity.getSkillsDescription());
        resp.setPersonalRecords(entity.getPersonalRecords());
        resp.setSkillDemoVideoUrl(entity.getSkillDemoVideoUrl());
        resp.setBio(entity.getBio());
        resp.setExpectedRate(entity.getExpectedRate());
        resp.setStatus(entity.getStatus());
        resp.setAdminNotes(entity.getAdminNotes());
        resp.setRejectionReason(entity.getRejectionReason());
        if (entity.getReviewedBy() != null) {
            resp.setReviewedById(entity.getReviewedBy().getId());
            resp.setReviewedByEmail(entity.getReviewedBy().getEmail());
        }
        resp.setReviewedAt(entity.getReviewedAt());
        resp.setCreatedAt(entity.getCreatedAt());
        resp.setUpdatedAt(entity.getUpdatedAt());

        if (entity.getCertificates() != null) {
            resp.setCertificates(entity.getCertificates().stream()
                    .map(c -> new CertificateItemDto(
                            c.getId(),
                            c.getCertificateName(),
                            c.getIssuingOrganization(),
                            c.getIssueYear(),
                            c.getCertificateUrl()
                    ))
                    .collect(Collectors.toList()));
        }

        if (entity.getActivities() != null) {
            resp.setActivities(entity.getActivities().stream()
                    .map(a -> new ActivityItemDto(
                            a.getId(),
                            a.getActivityName(),
                            a.getRoleOrAchievement(),
                            a.getOrganizer(),
                            a.getEventYear(),
                            a.getProofImageUrl(),
                            a.getProofLinkUrl()
                    ))
                    .collect(Collectors.toList()));
        }

        return resp;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

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

    public Long getReviewedById() { return reviewedById; }
    public void setReviewedById(Long reviewedById) { this.reviewedById = reviewedById; }

    public String getReviewedByEmail() { return reviewedByEmail; }
    public void setReviewedByEmail(String reviewedByEmail) { this.reviewedByEmail = reviewedByEmail; }

    public Instant getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(Instant reviewedAt) { this.reviewedAt = reviewedAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public List<CertificateItemDto> getCertificates() { return certificates; }
    public void setCertificates(List<CertificateItemDto> certificates) { this.certificates = certificates; }

    public List<ActivityItemDto> getActivities() { return activities; }
    public void setActivities(List<ActivityItemDto> activities) { this.activities = activities; }
}
