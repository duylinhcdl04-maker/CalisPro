package com.calishealth.api.controller;

import com.calishealth.api.dto.MotionDtos.*;
import com.calishealth.api.service.motion.MotionConfigService;
import com.calishealth.api.service.motion.MotionFeedbackService;
import com.calishealth.api.service.motion.MotionRuleAiGeneratorService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Admin: cấu hình Motion Rule Engine (MOTION_RULE_ENGINE_DESIGN.md §10). */
@RestController
@RequestMapping("/api/v1/admin")
public class AdminMotionController {
    private final MotionConfigService config;
    private final MotionFeedbackService feedback;
    private final MotionRuleAiGeneratorService aiRules;

    public AdminMotionController(MotionConfigService config, MotionFeedbackService feedback, MotionRuleAiGeneratorService aiRules) {
        this.config = config;
        this.feedback = feedback;
        this.aiRules = aiRules;
    }

    @GetMapping("/motion/catalog")
    public CatalogDto catalog() {
        return config.catalog();
    }

    // ============================== Profile ==============================

    @GetMapping("/motion-profiles")
    public List<ProfileSummaryDto> profiles(@RequestParam(required = false) Long exerciseId) {
        return config.listProfiles(exerciseId);
    }

    @GetMapping("/exercises/{exerciseId}/motion-profiles")
    public List<ProfileSummaryDto> exerciseProfiles(@PathVariable Long exerciseId) {
        return config.listProfiles(exerciseId);
    }

    @PostMapping("/exercises/{exerciseId}/motion-profiles")
    @ResponseStatus(HttpStatus.CREATED)
    public ProfileDto createProfile(@AuthenticationPrincipal Jwt jwt, @PathVariable Long exerciseId, @RequestBody ProfileUpsertRequest req) {
        return config.createProfile(exerciseId, req, actor(jwt));
    }

    /** AI soạn rule cho bài: chỉ lưu bản nháp hợp lệ và không trùng; không gửi duyệt, không xuất bản. */
    @PostMapping("/motion-profiles/{id}/ai-rules")
    public GenerateRulesResponse generateRules(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id, @RequestBody(required = false) GenerateRulesRequest req) {
        return aiRules.generate(id, req, actor(jwt));
    }

    /** Xem prompt sẽ gửi cho AI (đã điền thông tin bài và các rule đang có). */
    @GetMapping("/motion-profiles/{id}/ai-rules/prompt")
    public PromptPreviewDto aiRulesPrompt(@PathVariable Long id, @RequestParam(required = false) Integer count, @RequestParam(required = false) String focus) {
        return aiRules.preview(id, new GenerateRulesRequest(count, focus));
    }

    @GetMapping("/motion-profiles/{id}")
    public ProfileDto profile(@PathVariable Long id) {
        return config.profile(id);
    }

    @PutMapping("/motion-profiles/{id}")
    public ProfileDto updateProfile(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id, @RequestBody ProfileUpsertRequest req) {
        return config.updateProfile(id, req, actor(jwt));
    }

    @PutMapping("/motion-profiles/{id}/phases")
    public ProfileDto updatePhase(@PathVariable Long id, @RequestBody PhaseUpdateRequest req) {
        return config.updatePhase(id, req);
    }

    // ============================== Rule ==============================

    @GetMapping("/motion-profiles/{id}/rules")
    public List<RuleDto> rules(@PathVariable Long id) {
        return config.listRules(id);
    }

    @PostMapping("/motion-profiles/{id}/rules")
    @ResponseStatus(HttpStatus.CREATED)
    public RuleDto createRule(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id, @RequestBody RuleUpsertRequest req) {
        return config.createRule(id, req, actor(jwt));
    }

    @GetMapping("/motion-rules/{id}")
    public RuleDto rule(@PathVariable Long id) {
        return config.rule(id);
    }

    @PutMapping("/motion-rules/{id}")
    public RuleDto updateRule(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id, @RequestBody RuleUpsertRequest req) {
        return config.updateRule(id, req, actor(jwt));
    }

    @DeleteMapping("/motion-rules/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRule(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        config.deleteDraft(id, actor(jwt));
    }

    @PostMapping("/motion-rules/{id}/test")
    public RuleTestResponse test(@PathVariable Long id, @RequestBody RuleTestRequest req) {
        return config.test(id, req);
    }

    @PostMapping("/motion-rules/{id}/submit-review")
    public RuleDto submitReview(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id, @RequestBody(required = false) WorkflowRequest req) {
        return config.submitReview(id, note(req), actor(jwt));
    }

    @PostMapping("/motion-rules/{id}/reject")
    public RuleDto reject(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id, @RequestBody(required = false) WorkflowRequest req) {
        return config.reject(id, note(req), actor(jwt));
    }

    @PostMapping("/motion-rules/{id}/publish")
    public RuleDto publish(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id, @RequestBody(required = false) WorkflowRequest req) {
        return config.publish(id, note(req), actor(jwt));
    }

    @PostMapping("/motion-rules/{id}/archive")
    public RuleDto archive(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id, @RequestBody(required = false) WorkflowRequest req) {
        return config.archive(id, note(req), actor(jwt));
    }

    @GetMapping("/motion-rules/{id}/versions")
    public List<RuleVersionDto> versions(@PathVariable Long id) {
        return config.versions(id);
    }

    @GetMapping("/motion-rules/{id}/audit")
    public List<AuditDto> audit(@PathVariable Long id) {
        return config.audit(id);
    }

    // ============================== Feedback template ==============================

    @GetMapping("/motion-profiles/{id}/feedback-templates")
    public List<FeedbackTemplateDto> templates(@PathVariable Long id) {
        return feedback.list(id);
    }

    @PostMapping("/motion-profiles/{id}/feedback-templates")
    @ResponseStatus(HttpStatus.CREATED)
    public FeedbackTemplateDto createTemplate(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id, @RequestBody FeedbackTemplateRequest req) {
        return feedback.upsert(id, null, req, actor(jwt));
    }

    @PutMapping("/motion-profiles/{id}/feedback-templates/{templateId}")
    public FeedbackTemplateDto updateTemplate(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id, @PathVariable Long templateId,
                                              @RequestBody FeedbackTemplateRequest req) {
        return feedback.upsert(id, templateId, req, actor(jwt));
    }

    @PostMapping("/motion-feedback-templates/{templateId}/generate-audio")
    public FeedbackTemplateDto generateAudio(@AuthenticationPrincipal Jwt jwt, @PathVariable Long templateId) {
        return feedback.generateAudio(templateId, actor(jwt));
    }

    private static String actor(Jwt jwt) {
        return jwt == null ? null : jwt.getClaimAsString("email");
    }

    private static String note(WorkflowRequest req) {
        return req == null ? null : req.note();
    }
}
