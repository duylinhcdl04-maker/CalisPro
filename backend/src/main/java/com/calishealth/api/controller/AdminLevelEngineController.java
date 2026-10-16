package com.calishealth.api.controller;

import com.calishealth.api.dto.LevelEngineDtos.*;
import com.calishealth.api.service.level.AdminLevelEngineService;
import com.calishealth.api.service.level.AdminProgramTemplateService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Admin: bộ quy tắc Level Engine (có version, mô phỏng) và giáo án mẫu theo level. */
@RestController
@RequestMapping("/api/v1/admin")
public class AdminLevelEngineController {
    private final AdminLevelEngineService ruleSets;
    private final AdminProgramTemplateService templates;

    public AdminLevelEngineController(AdminLevelEngineService ruleSets, AdminProgramTemplateService templates) {
        this.ruleSets = ruleSets;
        this.templates = templates;
    }

    // ============================== Rule sets ==============================

    @GetMapping("/level-engine/rule-sets")
    public List<RuleSetSummaryDto> ruleSets() {
        return ruleSets.list();
    }

    @GetMapping("/level-engine/rule-sets/{id}")
    public RuleSetDetailDto ruleSet(@PathVariable Long id) {
        return ruleSets.detail(id);
    }

    @PostMapping("/level-engine/rule-sets/{id}/clone")
    @ResponseStatus(HttpStatus.CREATED)
    public RuleSetDetailDto cloneRuleSet(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return ruleSets.cloneRuleSet(id, jwt.getClaimAsString("email"), Long.valueOf(jwt.getSubject()));
    }

    @PutMapping("/level-engine/rule-sets/{id}")
    public RuleSetDetailDto updateRuleSet(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id, @RequestBody UpdateRuleSetRequest req) {
        return ruleSets.update(id, req, Long.valueOf(jwt.getSubject()));
    }

    @GetMapping("/level-engine/rule-sets/{id}/validate")
    public ValidationDto validate(@PathVariable Long id) {
        return ruleSets.validateRuleSet(id);
    }

    @PostMapping("/level-engine/rule-sets/{id}/activate")
    public RuleSetDetailDto activate(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return ruleSets.activate(id, Long.valueOf(jwt.getSubject()));
    }

    /** Coach gửi bản DRAFT của mình cho Admin duyệt. */
    @PostMapping("/level-engine/rule-sets/{id}/submit")
    public RuleSetDetailDto submit(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return ruleSets.submit(id, Long.valueOf(jwt.getSubject()));
    }

    /** Tác giả rút lại yêu cầu duyệt. */
    @PostMapping("/level-engine/rule-sets/{id}/withdraw")
    public RuleSetDetailDto withdraw(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return ruleSets.withdraw(id, Long.valueOf(jwt.getSubject()));
    }

    /** Admin duyệt (kích hoạt) hoặc trả về chỉnh sửa. */
    @PostMapping("/level-engine/rule-sets/{id}/decision")
    public RuleSetDetailDto decision(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id, @RequestBody RuleSetDecisionRequest req) {
        return ruleSets.decide(id, Long.valueOf(jwt.getSubject()), req);
    }

    @PostMapping("/level-engine/simulate")
    public SimulateResponse simulate(@RequestBody SimulateRequest req) {
        return ruleSets.simulate(req);
    }

    // ============================== Giáo án mẫu ==============================

    @GetMapping("/program-templates")
    public List<ProgramTemplateDto> templates(@RequestParam(defaultValue = "false") boolean includeArchived) {
        return templates.list(includeArchived);
    }

    @GetMapping("/program-templates/coverage")
    public CoverageDto coverage() {
        return templates.coverage();
    }

    @GetMapping("/program-templates/{id}")
    public ProgramTemplateDto template(@PathVariable Long id) {
        return templates.get(id);
    }

    @PostMapping("/program-templates")
    @ResponseStatus(HttpStatus.CREATED)
    public ProgramTemplateDto create(@AuthenticationPrincipal Jwt jwt, @RequestBody ProgramTemplateRequest req) {
        return templates.create(req, jwt.getClaimAsString("email"));
    }

    @PutMapping("/program-templates/{id}")
    public ProgramTemplateDto update(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id, @RequestBody ProgramTemplateRequest req) {
        return templates.update(id, req, jwt.getClaimAsString("email"));
    }

    @PatchMapping("/program-templates/{id}/status")
    public ProgramTemplateDto status(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return templates.setStatus(id, body.get("status"));
    }

    /** Coach gửi giáo án nháp cho Admin duyệt (Admin nhận thông báo realtime). */
    @PostMapping("/program-templates/{id}/submit-review")
    public ProgramTemplateDto submitReview(@PathVariable Long id) {
        return templates.submitForReview(id);
    }

    @PostMapping("/program-templates/{id}/duplicate")
    @ResponseStatus(HttpStatus.CREATED)
    public ProgramTemplateDto duplicate(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return templates.duplicate(id, jwt.getClaimAsString("email"));
    }

    @DeleteMapping("/program-templates/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        templates.delete(id);
    }
}
