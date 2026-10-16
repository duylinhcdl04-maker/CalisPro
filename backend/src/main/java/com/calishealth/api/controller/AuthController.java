package com.calishealth.api.controller;

import com.calishealth.api.dto.AuthDtos.*;
import com.calishealth.api.service.AuthService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService service;

    public AuthController(AuthService service) {
        this.service = service;
    }

    @PostMapping("/register")
    public RegisterResponse register(@RequestBody RegisterRequest r) {
        return service.register(r);
    }

    @PostMapping("/verify-otp")
    public AuthResponse verifyOtp(@RequestBody VerifyOtpRequest r) {
        return service.verifyOtp(r);
    }

    @PostMapping("/resend-otp")
    public SimpleMessageResponse resendOtp(@RequestBody ResendOtpRequest r) {
        return service.resendOtp(r);
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest r) {
        return service.login(r);
    }
}
