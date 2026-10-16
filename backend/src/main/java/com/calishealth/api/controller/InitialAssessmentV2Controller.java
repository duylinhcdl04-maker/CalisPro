package com.calishealth.api.controller;

import com.calishealth.api.dto.AssessmentV2Dtos.*;
import com.calishealth.api.service.assessmentv2.InitialAssessmentV2Service;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

/** Initial Assessment V2 (tự khai báo, level tạm thời tối đa L2). Chỉ bật khi app.assessment-v2.enabled=true. */
@RestController
@RequestMapping("/api/v1/assessments/initial")
@ConditionalOnProperty(name = "app.assessment-v2.enabled", havingValue = "true")
public class InitialAssessmentV2Controller {
    private final InitialAssessmentV2Service service;

    public InitialAssessmentV2Controller(InitialAssessmentV2Service service) { this.service = service; }

    @PostMapping("/start")
    public StartResponse start(@AuthenticationPrincipal Jwt jwt) { return service.start(uid(jwt)); }

    @GetMapping("/{sessionId}/questions")
    public QuestionsResponse questions(@AuthenticationPrincipal Jwt jwt, @PathVariable long sessionId) { return service.questions(uid(jwt), sessionId); }

    @PutMapping("/{sessionId}/answers")
    public SaveAnswersResponse answers(@AuthenticationPrincipal Jwt jwt, @PathVariable long sessionId, @RequestBody SaveAnswersRequest req) {
        return service.saveAnswers(uid(jwt), sessionId, req.answers());
    }

    @PostMapping("/{sessionId}/complete")
    public InitialResultDto complete(@AuthenticationPrincipal Jwt jwt, @PathVariable long sessionId) { return service.complete(uid(jwt), sessionId); }

    @GetMapping("/{sessionId}/result")
    public InitialResultDto result(@AuthenticationPrincipal Jwt jwt, @PathVariable long sessionId) { return service.result(uid(jwt), sessionId); }

    private static long uid(Jwt jwt) { return Long.parseLong(jwt.getSubject()); }
}
