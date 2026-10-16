package com.calishealth.api.controller;

import com.calishealth.api.dto.AuthDtos.AuthResponse;
import com.calishealth.api.dto.CoachAccountDtos.ChangePasswordRequest;
import com.calishealth.api.service.AuthService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

/** Thao tác của chính người dùng đang đăng nhập. Đổi mật khẩu trả token mới (không còn hạn chế "chỉ được đổi mật khẩu"). */
@RestController
@RequestMapping("/api/v1/account")
public class AccountController {
    private final AuthService auth;

    public AccountController(AuthService auth) { this.auth = auth; }

    @PostMapping("/change-password")
    public AuthResponse changePassword(@AuthenticationPrincipal Jwt jwt, @RequestBody ChangePasswordRequest req) {
        return auth.changePassword(Long.parseLong(jwt.getSubject()), req.currentPassword(), req.newPassword());
    }
}
