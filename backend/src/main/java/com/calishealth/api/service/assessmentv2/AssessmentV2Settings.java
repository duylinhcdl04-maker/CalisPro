package com.calishealth.api.service.assessmentv2;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Cấu hình bật/tắt Assessment Framework V2. Mặc định TẮT và chỉ dùng rule set ACTIVE / template PUBLISHED:
 * rule set V2 đang DRAFT (chưa có Coach review) nên V2 không chạy cho tới khi được kích hoạt có chủ đích.
 * allowDraft chỉ dành cho môi trường dev/test.
 */
@Component
public class AssessmentV2Settings {
    private final boolean allowDraft;
    private final String ruleSetCode, initialTemplateCode, safetyTemplateCode;
    private final int sessionExpiryDays;
    private final String advisoryVersion;
    private final String periodicTemplateCode;

    public AssessmentV2Settings(@Value("${app.assessment-v2.allow-draft:false}") boolean allowDraft,
                                @Value("${app.assessment-v2.rule-set-code:LEVEL_ENGINE_V2}") String ruleSetCode,
                                @Value("${app.assessment-v2.initial-template-code:CALISHEALTH_INITIAL_FW2}") String initialTemplateCode,
                                @Value("${app.assessment-v2.safety-template-code:CALISHEALTH_SAFETY_V1}") String safetyTemplateCode,
                                @Value("${app.assessment-v2.session-expiry-days:30}") int sessionExpiryDays,
                                @Value("${app.assessment-v2.advisory-version:1}") String advisoryVersion,
                                @Value("${app.assessment-v2.periodic-template-code:CALISHEALTH_PERIODIC_FW2}") String periodicTemplateCode) {
        this.periodicTemplateCode = periodicTemplateCode;
        this.advisoryVersion = advisoryVersion;
        this.sessionExpiryDays = sessionExpiryDays;
        this.allowDraft = allowDraft; this.ruleSetCode = ruleSetCode;
        this.initialTemplateCode = initialTemplateCode; this.safetyTemplateCode = safetyTemplateCode;
    }

    public boolean allowDraft() { return allowDraft; }
    public String ruleSetCode() { return ruleSetCode; }
    public String initialTemplateCode() { return initialTemplateCode; }
    public String safetyTemplateCode() { return safetyTemplateCode; }
    public int sessionExpiryDays() { return sessionExpiryDays; }
    /** Phiên bản khuyến cáo an toàn hiện hành: acknowledgement gắn với (status, advisory_version). */
    public String advisoryVersion() { return advisoryVersion; }
    public String periodicTemplateCode() { return periodicTemplateCode; }
}
