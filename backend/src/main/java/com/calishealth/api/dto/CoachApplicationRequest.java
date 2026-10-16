package com.calishealth.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class CoachApplicationRequest {

    @NotBlank(message = "Họ và tên không được để trống")
    private String fullName;

    private LocalDate dateOfBirth;
    private String gender;

    @NotBlank(message = "Số điện thoại không được để trống")
    private String phoneNumber;

    @NotBlank(message = "Email không được để trống")
    private String email;

    private String location;

    @NotBlank(message = "Số CCCD không được để trống")
    private String idCardNumber;

    @NotBlank(message = "Ảnh mặt trước CCCD không được để trống")
    private String idCardFrontUrl;

    @NotBlank(message = "Ảnh mặt sau CCCD không được để trống")
    private String idCardBackUrl;

    @NotNull(message = "Số năm kinh nghiệm không được để trống")
    private Integer experienceYears;

    @NotBlank(message = "Chuyên môn chính không được để trống")
    private String primarySpecialty;

    private String skillsDescription;
    private String personalRecords;
    private String skillDemoVideoUrl;
    private String bio;
    private String expectedRate;

    private List<CertificateItemDto> certificates = new ArrayList<>();
    private List<ActivityItemDto> activities = new ArrayList<>();

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

    public List<CertificateItemDto> getCertificates() { return certificates; }
    public void setCertificates(List<CertificateItemDto> certificates) { this.certificates = certificates; }

    public List<ActivityItemDto> getActivities() { return activities; }
    public void setActivities(List<ActivityItemDto> activities) { this.activities = activities; }
}
