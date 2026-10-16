package com.calishealth.api.controller;

import com.calishealth.api.dto.AssessmentDtos.AssessmentSessionResponse;
import com.calishealth.api.dto.AssessmentDtos.CreateAssessmentRequest;
import com.calishealth.api.dto.UserTraineeDtos.FitnessProfileResponse;
import com.calishealth.api.service.AssessmentService;
import com.calishealth.api.service.assessment.OnboardingAssessmentService;
import com.calishealth.api.dto.AssessmentTemplateDtos.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/assessments")
public class AssessmentController {
    private final AssessmentService service;
    private final OnboardingAssessmentService onboarding;

    public AssessmentController(AssessmentService service, OnboardingAssessmentService onboarding) {
        this.service = service;
        this.onboarding = onboarding;
    }

    @PostMapping
    public AssessmentSessionResponse create(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody CreateAssessmentRequest r
    ) {
        return service.create(Long.valueOf(jwt.getSubject()), r);
    }

    @GetMapping("/latest-profile")
    public FitnessProfileResponse getLatestProfile(@AuthenticationPrincipal Jwt jwt) {
        return service.getLatestFitnessProfile(Long.valueOf(jwt.getSubject()));
    }

    // ---------- Bài test đầu vào (do admin cấu hình) ----------

    @GetMapping("/onboarding/status")
    public OnboardingStatusDto onboardingStatus(@AuthenticationPrincipal Jwt jwt) {
        return onboarding.status(Long.valueOf(jwt.getSubject()));
    }

    @GetMapping("/onboarding")
    public QuestionnaireDto onboardingQuestionnaire() {
        return onboarding.questionnaire();
    }

    @PostMapping("/onboarding/submit")
    public OnboardingResultDto submitOnboarding(@AuthenticationPrincipal Jwt jwt, @RequestBody SubmitOnboardingRequest req) {
        return onboarding.submit(Long.valueOf(jwt.getSubject()), req);
    }

    @GetMapping("/onboarding/result")
    public OnboardingResultDto onboardingResult(@AuthenticationPrincipal Jwt jwt) {
        return onboarding.latestResult(Long.valueOf(jwt.getSubject()));
    }

    @PostMapping("/onboarding/skip")
    public OnboardingStatusDto skipOnboarding(@AuthenticationPrincipal Jwt jwt) {
        return onboarding.skip(Long.valueOf(jwt.getSubject()));
    }
}
