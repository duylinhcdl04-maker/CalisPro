package com.calishealth.api.controller;

import com.calishealth.api.dto.AssessmentV2Dtos.*;
import com.calishealth.api.service.assessmentv2.BaselineService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

/** Baseline thực hành đầu tiên (V2): start → next/attempts (staircase) → tự kết thúc khi VERIFIED hoặc RETEST_REQUIRED. Chỉ bật khi app.assessment-v2.enabled=true. */
@RestController
@RequestMapping("/api/v1/assessments/baseline")
@ConditionalOnProperty(name = "app.assessment-v2.enabled", havingValue = "true")
public class BaselineAssessmentController {
    private final BaselineService service;

    public BaselineAssessmentController(BaselineService service) { this.service = service; }

    @PostMapping("/start")
    public StartBaselineResponse start(@AuthenticationPrincipal Jwt jwt) { return service.start(uid(jwt)); }

    @GetMapping("/{sessionId}/next")
    public BaselineProgressDto next(@AuthenticationPrincipal Jwt jwt, @PathVariable long sessionId) { return service.next(uid(jwt), sessionId); }

    @PostMapping("/{sessionId}/attempts")
    public BaselineProgressDto attempt(@AuthenticationPrincipal Jwt jwt, @PathVariable long sessionId, @RequestBody SubmitAttemptRequest req) {
        return service.submitAttempt(uid(jwt), sessionId, req);
    }

    @GetMapping("/{sessionId}/result")
    public BaselineProgressDto result(@AuthenticationPrincipal Jwt jwt, @PathVariable long sessionId) { return service.result(uid(jwt), sessionId); }

    /** Kết thúc sớm: chốt level theo những bài đã đo đủ (vd không có dụng cụ cho bài kế tiếp). */
    @PostMapping("/{sessionId}/finish-early")
    public BaselineProgressDto finishEarly(@AuthenticationPrincipal Jwt jwt, @PathVariable long sessionId) { return service.finishEarly(uid(jwt), sessionId); }

    /** "Bỏ qua, đo sau": dùng level tạm từ khảo sát, nhắc lại sau vài ngày. */
    @PostMapping("/defer")
    public DeferDto defer(@AuthenticationPrincipal Jwt jwt) { return service.defer(uid(jwt)); }

    private static long uid(Jwt jwt) { return Long.parseLong(jwt.getSubject()); }
}
