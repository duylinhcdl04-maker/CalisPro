package com.calishealth.api.controller;

import com.calishealth.api.dto.GoalAndTrackingDtos.GoalRequest;
import com.calishealth.api.dto.GoalAndTrackingDtos.GoalResponse;
import com.calishealth.api.service.GoalService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/goals")
public class GoalController {
    private final GoalService service;

    public GoalController(GoalService service) {
        this.service = service;
    }

    @GetMapping
    public List<GoalResponse> list() {
        return service.list();
    }

    @GetMapping("/{id}")
    public GoalResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GoalResponse create(@RequestBody GoalRequest req) {
        return service.create(req);
    }

    @PutMapping("/{id}")
    public GoalResponse update(@PathVariable Long id, @RequestBody GoalRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
