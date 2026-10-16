package com.calishealth.api.controller;

import com.calishealth.api.dto.WorkoutDtos.WorkoutPlanRequest;
import com.calishealth.api.dto.WorkoutDtos.WorkoutPlanResponse;
import com.calishealth.api.service.WorkoutPlanService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/workout-plans")
public class WorkoutPlanController {
    private final WorkoutPlanService service;

    public WorkoutPlanController(WorkoutPlanService service) {
        this.service = service;
    }

    @GetMapping
    public List<WorkoutPlanResponse> list(@AuthenticationPrincipal Jwt jwt) {
        Long userId = Long.valueOf(jwt.getSubject());
        return service.listUserPlans(userId);
    }

    @GetMapping("/{id}")
    public WorkoutPlanResponse getById(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        Long userId = Long.valueOf(jwt.getSubject());
        return service.getPlan(userId, id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public WorkoutPlanResponse create(@AuthenticationPrincipal Jwt jwt, @RequestBody WorkoutPlanRequest req) {
        Long userId = Long.valueOf(jwt.getSubject());
        return service.createPlan(userId, req);
    }

    @PostMapping("/generate")
    @ResponseStatus(HttpStatus.CREATED)
    public WorkoutPlanResponse generate(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody(required = false) com.calishealth.api.dto.UserTraineeDtos.GeneratePlanRequest req
    ) {
        Long userId = Long.valueOf(jwt.getSubject());
        return service.generatePersonalizedPlan(userId, req);
    }

    @PutMapping("/{id}")
    public WorkoutPlanResponse update(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id, @RequestBody WorkoutPlanRequest req) {
        Long userId = Long.valueOf(jwt.getSubject());
        return service.updatePlan(userId, id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        Long userId = Long.valueOf(jwt.getSubject());
        service.deletePlan(userId, id);
    }
}
