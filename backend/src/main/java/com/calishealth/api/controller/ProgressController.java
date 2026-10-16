package com.calishealth.api.controller;

import com.calishealth.api.dto.UserTraineeDtos.ProgressOverviewResponse;
import com.calishealth.api.service.ProgressService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/progress")
public class ProgressController {
    private final ProgressService progressService;

    public ProgressController(ProgressService progressService) {
        this.progressService = progressService;
    }

    @GetMapping("/overview")
    public ProgressOverviewResponse getOverview(@AuthenticationPrincipal Jwt jwt) {
        return progressService.getOverview(Long.valueOf(jwt.getSubject()));
    }
}
