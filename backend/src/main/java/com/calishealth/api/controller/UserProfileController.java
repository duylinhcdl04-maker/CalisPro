package com.calishealth.api.controller;

import com.calishealth.api.dto.UserTraineeDtos.UpdateProfileRequest;
import com.calishealth.api.dto.UserTraineeDtos.UserProfileResponse;
import com.calishealth.api.service.UserProfileService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/profile")
public class UserProfileController {
    private final UserProfileService service;

    public UserProfileController(UserProfileService service) {
        this.service = service;
    }

    @GetMapping
    public UserProfileResponse getProfile(@AuthenticationPrincipal Jwt jwt) {
        return service.getProfile(Long.valueOf(jwt.getSubject()));
    }

    @PutMapping
    public UserProfileResponse updateProfile(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody UpdateProfileRequest request
    ) {
        return service.updateProfile(Long.valueOf(jwt.getSubject()), request);
    }
}
