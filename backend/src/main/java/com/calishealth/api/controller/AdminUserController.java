package com.calishealth.api.controller;

import com.calishealth.api.dto.AdminDtos.AdminUserResponse;
import com.calishealth.api.dto.AdminDtos.UpdateUserRoleRequest;
import com.calishealth.api.dto.AdminDtos.UpdateUserStatusRequest;
import com.calishealth.api.entity.Role;
import com.calishealth.api.entity.UserStatus;
import com.calishealth.api.service.AdminUserService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {
    private final AdminUserService service;

    public AdminUserController(AdminUserService service) {
        this.service = service;
    }

    @GetMapping
    public List<AdminUserResponse> list(
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(required = false) String keyword
    ) {
        return service.listUsers(role, status, keyword);
    }

    @GetMapping("/{id}")
    public AdminUserResponse getById(@PathVariable Long id) {
        return service.getUser(id);
    }

    @PutMapping("/{id}/status")
    public AdminUserResponse updateStatus(@PathVariable Long id, @RequestBody UpdateUserStatusRequest req) {
        return service.updateUserStatus(id, req);
    }

    @PutMapping("/{id}/role")
    public AdminUserResponse updateRole(@PathVariable Long id, @RequestBody UpdateUserRoleRequest req) {
        return service.updateUserRole(id, req);
    }
}
