package com.calishealth.api.controller;

import com.calishealth.api.dto.WorkoutDtos.WorkoutSessionRequest;
import com.calishealth.api.dto.WorkoutDtos.WorkoutSessionResponse;
import com.calishealth.api.service.WorkoutSessionService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/workout-sessions")
public class WorkoutSessionController {
    private final WorkoutSessionService service;

    public WorkoutSessionController(WorkoutSessionService service) {
        this.service = service;
    }

    @GetMapping
    public List<WorkoutSessionResponse> list(@AuthenticationPrincipal Jwt jwt) {
        Long userId = Long.valueOf(jwt.getSubject());
        return service.listUserSessions(userId);
    }

    @GetMapping("/{id}")
    public WorkoutSessionResponse getById(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        Long userId = Long.valueOf(jwt.getSubject());
        return service.getSession(userId, id);
    }

    @GetMapping("/{id}/report")
    public com.calishealth.api.dto.UserTraineeDtos.WorkoutPerformanceReport getReport(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        Long userId = Long.valueOf(jwt.getSubject());
        return service.getSessionReport(userId, id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public WorkoutSessionResponse create(@AuthenticationPrincipal Jwt jwt, @RequestBody WorkoutSessionRequest req) {
        Long userId = Long.valueOf(jwt.getSubject());
        return service.createSession(userId, req);
    }

    @PutMapping("/{id}")
    public WorkoutSessionResponse update(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id, @RequestBody WorkoutSessionRequest req) {
        Long userId = Long.valueOf(jwt.getSubject());
        return service.updateSession(userId, id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        Long userId = Long.valueOf(jwt.getSubject());
        service.deleteSession(userId, id);
    }
}
