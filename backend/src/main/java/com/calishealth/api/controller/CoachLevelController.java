package com.calishealth.api.controller;

import com.calishealth.api.dto.LevelEngineDtos.*;
import com.calishealth.api.service.level.CoachOverrideService;
import com.calishealth.api.service.level.FitnessStateService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Coach (và Admin): xem hồ sơ năng lực/level của học viên, xác minh kết quả test, can thiệp có lưu vết.
 * Lưu ý: hệ thống chưa có mô hình phân công coach–học viên, nên mọi coach đều xem được mọi học viên.
 */
@RestController
@RequestMapping("/api/v1/coach")
public class CoachLevelController {
    private final FitnessStateService fitnessState;
    private final CoachOverrideService overrides;

    public CoachLevelController(FitnessStateService fitnessState, CoachOverrideService overrides) {
        this.fitnessState = fitnessState;
        this.overrides = overrides;
    }

    @GetMapping("/users/{userId}/fitness-state")
    public FitnessStateDto state(@PathVariable Long userId) {
        return fitnessState.state(userId);
    }

    @GetMapping("/users/{userId}/level-history")
    public List<EvaluationDto> history(@PathVariable Long userId) {
        return fitnessState.history(userId);
    }

    @GetMapping("/users/{userId}/skills")
    public SkillTreeDto skills(@PathVariable Long userId) {
        return fitnessState.skillTree(userId);
    }

    @GetMapping("/users/{userId}/training-cycle")
    public CycleDto cycle(@PathVariable Long userId) {
        return fitnessState.activeCycle(userId);
    }

    @GetMapping("/users/{userId}/overrides")
    public List<OverrideDto> overrides(@PathVariable Long userId) {
        return overrides.list(userId);
    }

    @PostMapping("/users/{userId}/overrides")
    public OverrideDto override(@AuthenticationPrincipal Jwt jwt, @PathVariable Long userId, @RequestBody OverrideRequest req) {
        return overrides.override(Long.valueOf(jwt.getSubject()), userId, req);
    }

    @PostMapping("/assessments/{sessionId}/verify")
    public List<TestResultDto> verify(@AuthenticationPrincipal Jwt jwt, @PathVariable Long sessionId,
                                      @RequestBody(required = false) Map<String, String> body) {
        return overrides.verifyAssessment(Long.valueOf(jwt.getSubject()), sessionId, body == null ? null : body.get("reason"));
    }
}
