package com.calishealth.api.controller;

import com.calishealth.api.dto.AdminReviewApplicationRequest;
import com.calishealth.api.dto.CoachApplicationResponse;
import com.calishealth.api.entity.CoachApplicationStatus;
import com.calishealth.api.service.CoachApplicationService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/coach-applications")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCoachApplicationController {

    private final CoachApplicationService coachApplicationService;

    public AdminCoachApplicationController(CoachApplicationService coachApplicationService) {
        this.coachApplicationService = coachApplicationService;
    }

    @GetMapping
    public ResponseEntity<Page<CoachApplicationResponse>> getApplications(
            @RequestParam(required = false) CoachApplicationStatus status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<CoachApplicationResponse> result = coachApplicationService.adminGetApplications(status, keyword, pageable);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CoachApplicationResponse> getApplicationById(@PathVariable Long id) {
        CoachApplicationResponse result = coachApplicationService.adminGetApplicationById(id);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{id}/review")
    public ResponseEntity<CoachApplicationResponse> reviewApplication(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody AdminReviewApplicationRequest request) {
        Long adminUserId = Long.valueOf(jwt.getSubject());
        CoachApplicationResponse result = coachApplicationService.adminReviewApplication(id, adminUserId, request);
        return ResponseEntity.ok(result);
    }
}
