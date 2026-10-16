package com.calishealth.api.controller;

import com.calishealth.api.dto.UserTraineeDtos.UserGoalRequest;
import com.calishealth.api.dto.UserTraineeDtos.UserGoalResponse;
import com.calishealth.api.service.UserGoalService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/user-goals")
public class UserGoalController {
    private final UserGoalService service;

    public UserGoalController(UserGoalService service) {
        this.service = service;
    }

    @GetMapping
    public List<UserGoalResponse> listUserGoals(@AuthenticationPrincipal Jwt jwt) {
        return service.listUserGoals(Long.valueOf(jwt.getSubject()));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserGoalResponse addUserGoal(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody UserGoalRequest request
    ) {
        return service.addUserGoal(Long.valueOf(jwt.getSubject()), request);
    }

    @PutMapping("/{id}")
    public UserGoalResponse updateUserGoal(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long id,
            @RequestBody UserGoalRequest request
    ) {
        return service.updateUserGoal(Long.valueOf(jwt.getSubject()), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUserGoal(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long id
    ) {
        service.deleteUserGoal(Long.valueOf(jwt.getSubject()), id);
    }
}
