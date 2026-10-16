package com.calishealth.api.controller;

import com.calishealth.api.dto.UserTraineeDtos.FitnessProfileResponse;
import com.calishealth.api.service.AssessmentService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/fitness-profiles")
public class FitnessProfileController {
    private final AssessmentService assessmentService;

    public FitnessProfileController(AssessmentService assessmentService) {
        this.assessmentService = assessmentService;
    }

    @GetMapping("/latest")
    public FitnessProfileResponse getLatestFitnessProfile(@AuthenticationPrincipal Jwt jwt) {
        return assessmentService.getLatestFitnessProfile(Long.valueOf(jwt.getSubject()));
    }
}
