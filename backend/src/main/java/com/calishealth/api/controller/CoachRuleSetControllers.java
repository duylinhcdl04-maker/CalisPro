package com.calishealth.api.controller;

import com.calishealth.api.dto.RuleSetGovernanceDtos.*;
import com.calishealth.api.service.assessmentv2.CoachRuleSetService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Rule set V2 (§33): Coach soạn và gửi duyệt, ADMIN duyệt và kích hoạt. /api/v1/coach/** cho COACH và ADMIN, /api/v1/admin/** chỉ ADMIN (SecurityConfig).
 * Chỉ bật khi app.assessment-v2.enabled=true.
 */
@RestController
@ConditionalOnProperty(name = "app.assessment-v2.enabled", havingValue = "true")
public class CoachRuleSetControllers {
    private final CoachRuleSetService service;

    public CoachRuleSetControllers(CoachRuleSetService service) { this.service = service; }

    // ---- Coach: soạn ----
    @GetMapping("/api/v1/coach/assessment-v2/rule-sets")
    public List<RuleSetSummary> list() { return service.list(); }

    @GetMapping("/api/v1/coach/assessment-v2/rule-sets/{id}")
    public RuleSetDetail detail(@PathVariable long id) { return service.detail(id); }

    @GetMapping("/api/v1/coach/assessment-v2/rule-sets/{id}/validate")
    public List<String> validate(@PathVariable long id) { return service.validate(id); }

    @PostMapping("/api/v1/coach/assessment-v2/rule-sets/{id}/clone")
    public RuleSetDetail clone(@AuthenticationPrincipal Jwt jwt, @PathVariable long id) { return service.clone(uid(jwt), id); }

    @PutMapping("/api/v1/coach/assessment-v2/rule-sets/{id}")
    public RuleSetDetail update(@AuthenticationPrincipal Jwt jwt, @PathVariable long id, @RequestBody UpdateRuleSetRequest req) { return service.update(uid(jwt), id, req); }

    @PostMapping("/api/v1/coach/assessment-v2/rule-sets/{id}/submit")
    public RuleSetDetail submit(@AuthenticationPrincipal Jwt jwt, @PathVariable long id) { return service.submit(uid(jwt), id); }

    // ---- Admin: duyệt và kích hoạt ----
    @GetMapping("/api/v1/admin/assessment-v2/rule-sets")
    public List<RuleSetSummary> adminList(@RequestParam(defaultValue = "PENDING_REVIEW") String status) { return service.listByStatus(status.toUpperCase()); }

    @GetMapping("/api/v1/admin/assessment-v2/rule-sets/{id}")
    public RuleSetDetail adminDetail(@PathVariable long id) { return service.detail(id); }

    @PostMapping("/api/v1/admin/assessment-v2/rule-sets/{id}/decision")
    public RuleSetDetail decide(@AuthenticationPrincipal Jwt jwt, @PathVariable long id, @RequestBody DecisionRequest req) { return service.decide(uid(jwt), id, req); }

    private static long uid(Jwt jwt) { return Long.parseLong(jwt.getSubject()); }
}
