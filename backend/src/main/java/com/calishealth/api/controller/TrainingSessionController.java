package com.calishealth.api.controller;

import com.calishealth.api.dto.TrainingSessionDtos.*;
import com.calishealth.api.service.level.TrainingSessionService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

/** Trang luyện tập của học viên: buổi tập hôm nay theo giáo án, bắt đầu và kết thúc buổi (kèm kết quả tập thủ công hoặc do AI đo). */
@RestController
@RequestMapping("/api/v1/me")
public class TrainingSessionController {
    private final TrainingSessionService service;

    public TrainingSessionController(TrainingSessionService service) { this.service = service; }

    @GetMapping("/today-workout")
    public TodayWorkout today(@AuthenticationPrincipal Jwt jwt) { return service.today(uid(jwt)); }

    @PostMapping("/training-sessions")
    @ResponseStatus(HttpStatus.CREATED)
    public StartSessionResponse start(@AuthenticationPrincipal Jwt jwt, @RequestBody StartSessionRequest req) { return service.start(uid(jwt), req); }

    @PutMapping("/training-sessions/{id}/finish")
    public FinishSessionResponse finish(@AuthenticationPrincipal Jwt jwt, @PathVariable long id, @RequestBody FinishSessionRequest req) {
        return service.finish(uid(jwt), id, req);
    }

    private static Long uid(Jwt jwt) { return Long.valueOf(jwt.getSubject()); }
}
