package com.calishealth.api.controller;

import com.calishealth.api.dto.AssessmentV2Dtos.*;
import com.calishealth.api.service.assessmentv2.L4ReviewService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** L4 cần Coach xác nhận (§32). Chỉ bật khi app.assessment-v2.enabled=true. Phân quyền /api/v1/coach/** (COACH, ADMIN) do SecurityConfig. */
@RestController
@ConditionalOnProperty(name = "app.assessment-v2.enabled", havingValue = "true")
public class L4ReviewControllers {
    private final L4ReviewService service;

    public L4ReviewControllers(L4ReviewService service) { this.service = service; }

    // ---- user ----
    @PutMapping({"/api/v1/assessments/baseline/{sessionId}/recording-consent", "/api/v1/assessments/periodic/{sessionId}/recording-consent"})
    public RecordingConsentDto consent(@AuthenticationPrincipal Jwt jwt, @PathVariable long sessionId, @RequestBody RecordingConsentRequest req) {
        return service.grantConsent(uid(jwt), sessionId, req.granted());
    }

    @PostMapping({"/api/v1/assessments/baseline/{sessionId}/recording/upload-signature", "/api/v1/assessments/periodic/{sessionId}/recording/upload-signature"})
    public Map<String, Object> signature(@AuthenticationPrincipal Jwt jwt, @PathVariable long sessionId) { return service.uploadSignature(uid(jwt), sessionId); }

    @PutMapping({"/api/v1/assessments/baseline/{sessionId}/attempts/{attemptId}/video", "/api/v1/assessments/periodic/{sessionId}/attempts/{attemptId}/video"})
    public ResponseEntity<Void> video(@AuthenticationPrincipal Jwt jwt, @PathVariable long sessionId, @PathVariable long attemptId, @RequestBody AttachVideoRequest req) {
        service.attachVideo(uid(jwt), sessionId, attemptId, req.videoUrl());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/v1/me/l4-review")
    public ResponseEntity<L4ReviewSummaryDto> mine(@AuthenticationPrincipal Jwt jwt) {
        return service.latestFor(uid(jwt)).map(ResponseEntity::ok).orElse(ResponseEntity.noContent().build());
    }

    // ---- coach ----
    @GetMapping("/api/v1/coach/l4-reviews")
    public List<L4ReviewSummaryDto> list(@RequestParam(required = false) String status) { return service.list(status); }

    @GetMapping("/api/v1/coach/l4-reviews/{id}")
    public L4ReviewDetailDto detail(@PathVariable long id) { return service.detail(id); }

    @PostMapping("/api/v1/coach/l4-reviews/{id}/decision")
    public L4ReviewSummaryDto decide(@AuthenticationPrincipal Jwt jwt, @PathVariable long id, @RequestBody DecideL4Request req) {
        return service.decide(uid(jwt), id, req.decision(), req.reason());
    }

    private static long uid(Jwt jwt) { return Long.parseLong(jwt.getSubject()); }
}
