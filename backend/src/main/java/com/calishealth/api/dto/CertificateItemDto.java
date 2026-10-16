package com.calishealth.api.dto;

public class CertificateItemDto {
    private Long id;
    private String certificateName;
    private String issuingOrganization;
    private Integer issueYear;
    private String certificateUrl;

    public CertificateItemDto() {}

    public CertificateItemDto(Long id, String certificateName, String issuingOrganization, Integer issueYear, String certificateUrl) {
        this.id = id;
        this.certificateName = certificateName;
        this.issuingOrganization = issuingOrganization;
        this.issueYear = issueYear;
        this.certificateUrl = certificateUrl;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCertificateName() { return certificateName; }
    public void setCertificateName(String certificateName) { this.certificateName = certificateName; }

    public String getIssuingOrganization() { return issuingOrganization; }
    public void setIssuingOrganization(String issuingOrganization) { this.issuingOrganization = issuingOrganization; }

    public Integer getIssueYear() { return issueYear; }
    public void setIssueYear(Integer issueYear) { this.issueYear = issueYear; }

    public String getCertificateUrl() { return certificateUrl; }
    public void setCertificateUrl(String certificateUrl) { this.certificateUrl = certificateUrl; }
}
