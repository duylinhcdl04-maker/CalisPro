package com.calishealth.api.controller;

import com.calishealth.api.service.notification.NotificationService;
import com.calishealth.api.service.notification.NotificationService.NotificationDto;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Thông báo của chính người đăng nhập (mọi vai trò). Tin mới đến realtime qua WebSocket /ws/notifications; các API này dùng để tải danh sách và đánh dấu đã đọc. */
@RestController
@RequestMapping("/api/v1/me/notifications")
public class NotificationController {
    private final NotificationService service;

    public NotificationController(NotificationService service) { this.service = service; }

    @GetMapping
    public List<NotificationDto> list(@AuthenticationPrincipal Jwt jwt, @RequestParam(defaultValue = "false") boolean unreadOnly, @RequestParam(defaultValue = "30") int limit) {
        return service.list(uid(jwt), unreadOnly, limit);
    }

    @GetMapping("/unread-count")
    public Map<String, Integer> unreadCount(@AuthenticationPrincipal Jwt jwt) { return Map.of("count", service.unreadCount(uid(jwt))); }

    @PostMapping("/{id}/read")
    public Map<String, Object> read(@AuthenticationPrincipal Jwt jwt, @PathVariable long id) {
        boolean changed = service.markRead(uid(jwt), id);
        return Map.of("changed", changed, "unreadCount", service.unreadCount(uid(jwt)));
    }

    @PostMapping("/read-all")
    public Map<String, Object> readAll(@AuthenticationPrincipal Jwt jwt) {
        int n = service.markAllRead(uid(jwt));
        return Map.of("changed", n, "unreadCount", 0);
    }

    private static long uid(Jwt jwt) { return Long.parseLong(jwt.getSubject()); }
}
