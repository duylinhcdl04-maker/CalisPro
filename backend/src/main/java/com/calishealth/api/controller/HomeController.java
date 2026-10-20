package com.calishealth.api.controller;

import com.calishealth.api.dto.HomeDtos.HomeResponse;
import com.calishealth.api.service.home.HomeService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Trang Tổng quan của chính học viên, tính từ dữ liệu thật. */
@RestController
@RequestMapping("/api/v1/me/home")
public class HomeController {
    private final HomeService service;

    public HomeController(HomeService service) { this.service = service; }

    @GetMapping
    public HomeResponse home(@AuthenticationPrincipal Jwt jwt) {
        return service.home(Long.parseLong(jwt.getSubject()));
    }
}
