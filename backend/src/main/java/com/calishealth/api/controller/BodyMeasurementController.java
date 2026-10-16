package com.calishealth.api.controller;

import com.calishealth.api.dto.GoalAndTrackingDtos.BodyMeasurementRequest;
import com.calishealth.api.dto.GoalAndTrackingDtos.BodyMeasurementResponse;
import com.calishealth.api.service.BodyMeasurementService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/body-measurements")
public class BodyMeasurementController {
    private final BodyMeasurementService service;

    public BodyMeasurementController(BodyMeasurementService service) {
        this.service = service;
    }

    @GetMapping
    public List<BodyMeasurementResponse> list(@AuthenticationPrincipal Jwt jwt) {
        Long userId = Long.valueOf(jwt.getSubject());
        return service.listUserMeasurements(userId);
    }

    @GetMapping("/{id}")
    public BodyMeasurementResponse getById(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        Long userId = Long.valueOf(jwt.getSubject());
        return service.getMeasurement(userId, id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BodyMeasurementResponse create(@AuthenticationPrincipal Jwt jwt, @RequestBody BodyMeasurementRequest req) {
        Long userId = Long.valueOf(jwt.getSubject());
        return service.createMeasurement(userId, req);
    }

    @PutMapping("/{id}")
    public BodyMeasurementResponse update(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id, @RequestBody BodyMeasurementRequest req) {
        Long userId = Long.valueOf(jwt.getSubject());
        return service.updateMeasurement(userId, id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        Long userId = Long.valueOf(jwt.getSubject());
        service.deleteMeasurement(userId, id);
    }
}
