package com.calishealth.api.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "coach_application_certificates")
public class CoachApplicationCertificate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false)
    @JsonIgnore
    private CoachApplication application;

    @Column(name = "certificate_name", nullable = false, length = 255)
    private String certificateName;

    @Column(name = "issuing_organization", nullable = false, length = 255)
    private String issuingOrganization;

    @Column(name = "issue_year")
    private Integer issueYear;

    @Column(name = "certificate_url", nullable = false, columnDefinition = "LONGTEXT")
    private String certificateUrl;

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

    public String getCertificateName() { return certificateName; }
    public void setCertificateName(String certificateName) { this.certificateName = certificateName; }

    public String getIssuingOrganization() { return issuingOrganization; }
    public void setIssuingOrganization(String issuingOrganization) { this.issuingOrganization = issuingOrganization; }

    public Integer getIssueYear() { return issueYear; }
    public void setIssueYear(Integer issueYear) { this.issueYear = issueYear; }

    public String getCertificateUrl() { return certificateUrl; }
    public void setCertificateUrl(String certificateUrl) { this.certificateUrl = certificateUrl; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
