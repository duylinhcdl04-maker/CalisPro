package com.calishealth.api.controller;

import com.calishealth.api.service.ExerciseRevisionService;
import com.calishealth.api.service.ExerciseRevisionService.Revision;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Chỉnh sửa động tác của Coach chờ duyệt. Admin thấy tất cả và duyệt/từ chối; Coach chỉ xem được bản của mình (không tự duyệt được).
 * Quyền theo đường dẫn nằm ở SecurityConfig.
 */
@RestController
@RequestMapping("/api/v1/exercise-revisions")
public class ExerciseRevisionController {
    private final ExerciseRevisionService service;

    public ExerciseRevisionController(ExerciseRevisionService service) { this.service = service; }

    @GetMapping
    public List<Revision> pending(@RequestParam(required = false) Long exerciseId, Authentication auth) {
        return service.pending(isAdmin(auth), Long.parseLong(auth.getName()), exerciseId);
    }

    @PostMapping("/{id}/approve")
    public Map<String, Object> approve(@PathVariable Long id, Authentication auth) {
        service.approve(Long.parseLong(auth.getName()), id);
        return Map.of("status", ExerciseRevisionService.APPROVED);
    }

    public record RejectRequest(String notes) {}

    @PostMapping("/{id}/reject")
    public Map<String, Object> reject(@PathVariable Long id, @RequestBody RejectRequest req, Authentication auth) {
        service.reject(Long.parseLong(auth.getName()), id, req == null ? null : req.notes());
        return Map.of("status", ExerciseRevisionService.REJECTED);
    }

    private static boolean isAdmin(Authentication auth) {
        for (GrantedAuthority a : auth.getAuthorities()) if ("ROLE_ADMIN".equals(a.getAuthority())) return true;
        return false;
    }
}
