package com.calishealth.api.controller;

import com.calishealth.api.dto.AssessmentV2Dtos.*;
import com.calishealth.api.service.assessmentv2.SafetyScreeningService;
import com.calishealth.api.service.assessmentv2.SafetyStatusService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

/** Sàng lọc an toàn (bước 0). Chỉ sinh Safety Status + ràng buộc; không chấm điểm, không đổi level. */
@RestController
@ConditionalOnProperty(name = "app.assessment-v2.enabled", havingValue = "true")
public class SafetyScreeningController {
    private final SafetyScreeningService screening;
    private final SafetyStatusService status;

    public SafetyScreeningController(SafetyScreeningService screening, SafetyStatusService status) { this.screening = screening; this.status = status; }

    @PostMapping("/api/v1/safety-screening/start")
    public StartResponse start(@AuthenticationPrincipal Jwt jwt) { return screening.start(uid(jwt)); }

    @GetMapping("/api/v1/safety-screening/{sessionId}/questions")
    public QuestionsResponse questions(@AuthenticationPrincipal Jwt jwt, @PathVariable long sessionId) { return screening.questions(uid(jwt), sessionId); }

    @PutMapping("/api/v1/safety-screening/{sessionId}/answers")
    public SaveAnswersResponse answers(@AuthenticationPrincipal Jwt jwt, @PathVariable long sessionId, @RequestBody SaveAnswersRequest req) {
        return screening.saveAnswers(uid(jwt), sessionId, req.answers());
    }

    @PostMapping("/api/v1/safety-screening/{sessionId}/complete")
    public SafetyStatusDto complete(@AuthenticationPrincipal Jwt jwt, @PathVariable long sessionId) { return screening.complete(uid(jwt), sessionId); }

    @GetMapping("/api/v1/me/safety-status")
    public SafetyStatusDto current(@AuthenticationPrincipal Jwt jwt) {
        return status.current(uid(jwt)).map(SafetyScreeningService::toDto)
                .orElseThrow(() -> new IllegalArgumentException("Chưa có kết quả sàng lọc an toàn"));
    }

    private static long uid(Jwt jwt) { return Long.parseLong(jwt.getSubject()); }
}
