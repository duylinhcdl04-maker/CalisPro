package com.calishealth.api.controller;

import com.calishealth.api.dto.CoachApplicationRequest;
import com.calishealth.api.dto.CoachApplicationResponse;
import com.calishealth.api.service.CoachApplicationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/coach-applications")
public class CoachApplicationController {

    private final CoachApplicationService coachApplicationService;

    public CoachApplicationController(CoachApplicationService coachApplicationService) {
        this.coachApplicationService = coachApplicationService;
    }

    @PostMapping
    public ResponseEntity<CoachApplicationResponse> submitApplication(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CoachApplicationRequest request) {
        Long userId = Long.valueOf(jwt.getSubject());
        CoachApplicationResponse response = coachApplicationService.submitApplication(userId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-application")
    public ResponseEntity<CoachApplicationResponse> getMyApplication(@AuthenticationPrincipal Jwt jwt) {
        Long userId = Long.valueOf(jwt.getSubject());
        CoachApplicationResponse response = coachApplicationService.getMyApplication(userId);
        if (response == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(response);
    }

    @PutMapping("/my-application")
    public ResponseEntity<CoachApplicationResponse> updateMyApplication(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CoachApplicationRequest request) {
        Long userId = Long.valueOf(jwt.getSubject());
        CoachApplicationResponse response = coachApplicationService.updateMyApplication(userId, request);
        return ResponseEntity.ok(response);
    }
}
