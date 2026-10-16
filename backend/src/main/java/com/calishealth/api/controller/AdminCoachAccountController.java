package com.calishealth.api.controller;

import com.calishealth.api.dto.CoachAccountDtos.CoachAccountDto;
import com.calishealth.api.dto.CoachAccountDtos.CreateCoachRequest;
import com.calishealth.api.service.CoachAccountService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Admin quản lý tài khoản Coach (/api/v1/admin/** chỉ ADMIN). Không có API nào trả mật khẩu. */
@RestController
@RequestMapping("/api/v1/admin/coaches")
public class AdminCoachAccountController {
    private final CoachAccountService service;

    public AdminCoachAccountController(CoachAccountService service) { this.service = service; }

    @GetMapping
    public List<CoachAccountDto> list() { return service.list(); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CoachAccountDto create(@AuthenticationPrincipal Jwt jwt, @RequestBody CreateCoachRequest req) { return service.create(uid(jwt), req); }

    @PostMapping("/{id}/reset-password")
    public CoachAccountDto resetPassword(@AuthenticationPrincipal Jwt jwt, @PathVariable long id) { return service.resetPassword(uid(jwt), id); }

    @PostMapping("/{id}/unlock")
    public CoachAccountDto unlock(@PathVariable long id) { return service.unlock(id); }

    private static long uid(Jwt jwt) { return Long.parseLong(jwt.getSubject()); }
}
