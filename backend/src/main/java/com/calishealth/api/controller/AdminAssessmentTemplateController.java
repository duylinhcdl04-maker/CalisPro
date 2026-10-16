package com.calishealth.api.controller;

import com.calishealth.api.dto.AssessmentTemplateDtos.*;
import com.calishealth.api.service.assessment.AdminAssessmentTemplateService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Quản trị bài đánh giá, ngân hàng câu hỏi và bài test đầu vào (chỉ ADMIN - /api/v1/admin/**). */
@RestController
@RequestMapping("/api/v1/admin")
public class AdminAssessmentTemplateController {
    private final AdminAssessmentTemplateService service;

    public AdminAssessmentTemplateController(AdminAssessmentTemplateService service) {
        this.service = service;
    }

    // ---------- Bài đánh giá ----------

    @GetMapping("/assessment-templates")
    public List<AssessmentDto> list() {
        return service.listTemplates();
    }

    @GetMapping("/assessment-templates/{id}")
    public AssessmentDto get(@PathVariable Long id) {
        return service.getTemplate(id);
    }

    /** Tạo mới hoặc cập nhật (id trong body). Bài đang là bài test đầu vào -> trả về phiên bản mới (forkedFromId != null). */
    @PostMapping("/assessment-templates")
    public AssessmentDto save(@RequestBody AssessmentDto req) {
        return service.saveTemplate(req);
    }

    @PostMapping("/assessment-templates/{id}/publish")
    public AssessmentDto publish(@PathVariable Long id) {
        return service.publish(id);
    }

    /** Coach gửi bài nháp cho Admin duyệt (Admin nhận thông báo realtime). */
    @PostMapping("/assessment-templates/{id}/submit-review")
    public AssessmentDto submitReview(@PathVariable Long id) {
        return service.submitForReview(id);
    }

    @PatchMapping("/assessment-templates/{id}/status")
    public AssessmentDto updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return service.updateStatus(id, body.get("status"));
    }

    @PostMapping("/assessment-templates/{id}/duplicate")
    public AssessmentDto duplicate(@PathVariable Long id) {
        return service.duplicate(id);
    }

    @DeleteMapping("/assessment-templates/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    @GetMapping("/assessment-templates/{id}/validation")
    public ValidationResultDto validate(@PathVariable Long id, @RequestParam(defaultValue = "false") boolean onboarding) {
        return service.validate(id, onboarding);
    }

    // ---------- Ngân hàng câu hỏi ----------

    @GetMapping("/assessment-questions")
    public List<QuestionDto> listQuestions() {
        return service.listBankQuestions();
    }

    @GetMapping("/assessment-questions/{id}")
    public QuestionDto getQuestion(@PathVariable Long id) {
        return service.getQuestion(id);
    }

    /** Tạo mới hoặc cập nhật câu hỏi ngân hàng (id trong body) */
    @PostMapping("/assessment-questions")
    public QuestionDto saveQuestion(@RequestBody QuestionDto req) {
        return service.saveBankQuestion(req);
    }

    @DeleteMapping("/assessment-questions/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteQuestion(@PathVariable Long id) {
        service.deleteBankQuestion(id);
    }

    // ---------- Bài test đầu vào ----------

    @GetMapping("/assessment-onboarding")
    public OnboardingSettingsDto getOnboarding() {
        return service.getOnboardingSettings();
    }

    /** activeTemplateId: id bài / "" để tắt / null để giữ nguyên */
    @PutMapping("/assessment-onboarding")
    public OnboardingSettingsDto updateOnboarding(@RequestBody UpdateOnboardingSettingsRequest req, @AuthenticationPrincipal Jwt jwt) {
        return service.updateOnboardingSettings(req, adminName(jwt));
    }

    @PostMapping("/assessment-onboarding/require-retake")
    public OnboardingSettingsDto requireRetake(@AuthenticationPrincipal Jwt jwt) {
        return service.requireRetake(adminName(jwt));
    }

    private static String adminName(Jwt jwt) {
        if (jwt == null) return "ADMIN";
        String email = jwt.getClaimAsString("email");
        return email != null ? email : jwt.getSubject();
    }
}
