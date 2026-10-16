package com.calishealth.api.controller;

import com.calishealth.api.service.exp.ExpService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** EXP chuyên cần của chính người dùng: tổng EXP, cấp EXP, chuỗi điểm danh, điểm chuyên cần của cửa sổ xét. */
@RestController
@RequestMapping("/api/v1/me/exp")
public class ExpController {
    private final ExpService exp;

    public ExpController(ExpService exp) { this.exp = exp; }

    @GetMapping
    public ExpService.Summary summary(@AuthenticationPrincipal Jwt jwt) {
        return exp.summary(Long.valueOf(jwt.getSubject()));
    }
}
