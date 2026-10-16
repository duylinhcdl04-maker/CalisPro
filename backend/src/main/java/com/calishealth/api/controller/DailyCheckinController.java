package com.calishealth.api.controller;

import com.calishealth.api.dto.GoalAndTrackingDtos.DailyCheckinRequest;
import com.calishealth.api.dto.GoalAndTrackingDtos.DailyCheckinResponse;
import com.calishealth.api.service.DailyCheckinService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/daily-checkins")
public class DailyCheckinController {
    private final DailyCheckinService service;

    public DailyCheckinController(DailyCheckinService service) {
        this.service = service;
    }

    @GetMapping
    public List<DailyCheckinResponse> list(@AuthenticationPrincipal Jwt jwt) {
        Long userId = Long.valueOf(jwt.getSubject());
        return service.listUserCheckins(userId);
    }

    @GetMapping("/{id}")
    public DailyCheckinResponse getById(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        Long userId = Long.valueOf(jwt.getSubject());
        return service.getCheckin(userId, id);
    }

    @PostMapping
    public DailyCheckinResponse createOrUpdate(@AuthenticationPrincipal Jwt jwt, @RequestBody DailyCheckinRequest req) {
        Long userId = Long.valueOf(jwt.getSubject());
        return service.createOrUpdateCheckin(userId, req);
    }

    @PutMapping("/{id}")
    public DailyCheckinResponse update(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id, @RequestBody DailyCheckinRequest req) {
        Long userId = Long.valueOf(jwt.getSubject());
        return service.updateCheckin(userId, id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        Long userId = Long.valueOf(jwt.getSubject());
        service.deleteCheckin(userId, id);
    }
}
