package com.calishealth.api.config;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Vai trò của người đang gọi API, dùng cho quy tắc "Coach soạn, Admin duyệt".
 * Gọi nội bộ không có đăng nhập (test, job) KHÔNG bị coi là Coach: quyền truy cập đã do SecurityConfig chặn ở tầng HTTP.
 */
public final class Actor {
    private Actor() {}

    /** Email của người đang gọi API (claim "email" trong JWT), null nếu gọi nội bộ. */
    public static String email() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        if (a != null && a.getPrincipal() instanceof org.springframework.security.oauth2.jwt.Jwt jwt) return jwt.getClaimAsString("email");
        return null;
    }

    /** Người gọi là Coach và không phải Admin: chỉ được soạn bản nháp, không được xuất bản/kích hoạt/xóa. */
    public static boolean coachOnly() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        if (a == null) return false;
        boolean coach = a.getAuthorities().stream().anyMatch(g -> "ROLE_COACH".equals(g.getAuthority()));
        boolean admin = a.getAuthorities().stream().anyMatch(g -> "ROLE_ADMIN".equals(g.getAuthority()));
        return coach && !admin;
    }
}
