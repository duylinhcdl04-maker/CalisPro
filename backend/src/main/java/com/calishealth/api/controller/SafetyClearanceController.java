package com.calishealth.api.controller;

import com.calishealth.api.dto.AssessmentV2Dtos.*;
import com.calishealth.api.service.assessmentv2.SafetyClearanceService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Acknowledgement (đã đọc) và Clearance (gỡ/giảm hạn chế) - hai thứ tách biệt. Chỉ bật khi app.assessment-v2.enabled=true.
 * Lưu ý: yêu cầu bị từ chối vì không có clearance rule trả 400 (CLEARANCE_METHOD_NOT_ALLOWED) và không lưu dòng nào.
 */
@RestController
@ConditionalOnProperty(name = "app.assessment-v2.enabled", havingValue = "true")
public class SafetyClearanceController {
    private final SafetyClearanceService service;

    public SafetyClearanceController(SafetyClearanceService service) { this.service = service; }

    @PostMapping("/api/v1/me/safety-status/acknowledge")
    public AcknowledgementDto acknowledge(@AuthenticationPrincipal Jwt jwt, @RequestBody(required = false) AcknowledgeRequest req) {
        return service.acknowledge(uid(jwt), req == null ? null : req.advisoryVersion());
    }

    @PostMapping("/api/v1/me/safety-status/clearance-requests")
    public ClearanceDto request(@AuthenticationPrincipal Jwt jwt, @RequestBody ClearanceRequestDto req) { return service.request(uid(jwt), req); }

    @GetMapping("/api/v1/me/safety-status/clearance-requests")
    public List<ClearanceDto> mine(@AuthenticationPrincipal Jwt jwt) { return service.mine(uid(jwt)); }

    @GetMapping("/api/v1/coach/safety-clearances")
    public List<ClearanceDto> queue(@RequestParam(required = false) String status) { return service.queue(status); }

    @GetMapping("/api/v1/coach/safety-clearances/{id}")
    public ClearanceDetailDto detail(Authentication auth, @PathVariable long id) {
        return service.detail(auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_COACH")), id);
    }

    @PostMapping("/api/v1/coach/safety-clearances/{id}/decision")
    public ClearanceDto decide(@AuthenticationPrincipal Jwt jwt, Authentication auth, @PathVariable long id, @RequestBody ClearanceDecisionRequest req) {
        boolean coach = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_COACH"));
        return service.decide(uid(jwt), coach, id, req);
    }

    private static long uid(Jwt jwt) { return Long.parseLong(jwt.getSubject()); }
}
