package com.calishealth.api.controller;

import com.calishealth.api.dto.LevelEngineDtos.*;
import com.calishealth.api.service.level.FitnessStateService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Trạng thái thể lực của học viên: level, 6 năng lực, lịch sử xét level, skill tree, chu kỳ tập, ràng buộc. */
@RestController
@RequestMapping("/api/v1/me")
public class FitnessStateController {
    private final FitnessStateService service;

    public FitnessStateController(FitnessStateService service) {
        this.service = service;
    }

    @GetMapping("/fitness-state")
    public FitnessStateDto state(@AuthenticationPrincipal Jwt jwt) {
        return service.state(uid(jwt));
    }

    @GetMapping("/level-history")
    public List<EvaluationDto> history(@AuthenticationPrincipal Jwt jwt) {
        return service.history(uid(jwt));
    }

    @GetMapping("/skills")
    public SkillTreeDto skills(@AuthenticationPrincipal Jwt jwt) {
        return service.skillTree(uid(jwt));
    }

    @GetMapping("/training-cycle")
    public CycleDto activeCycle(@AuthenticationPrincipal Jwt jwt) {
        return service.activeCycle(uid(jwt));
    }

    @GetMapping("/training-cycles/{planId}")
    public CycleDto cycle(@AuthenticationPrincipal Jwt jwt, @PathVariable Long planId) {
        return service.cycle(uid(jwt), planId);
    }

    @PostMapping("/training-cycle/regenerate")
    public CycleDto regenerate(@AuthenticationPrincipal Jwt jwt, @RequestBody(required = false) RegenerateRequest req) {
        return service.regenerate(uid(jwt), req == null ? null : req.reason());
    }

    @GetMapping("/training-constraints")
    public ConstraintsDto constraints(@AuthenticationPrincipal Jwt jwt) {
        return service.constraints(uid(jwt));
    }

    @PutMapping("/training-constraints")
    public ConstraintsDto updateConstraints(@AuthenticationPrincipal Jwt jwt, @RequestBody UpdateConstraintsRequest req) {
        return service.updateConstraints(uid(jwt), req);
    }

    private static Long uid(Jwt jwt) { return Long.valueOf(jwt.getSubject()); }
}
