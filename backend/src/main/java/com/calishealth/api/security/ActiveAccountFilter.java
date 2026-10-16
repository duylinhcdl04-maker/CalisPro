package com.calishealth.api.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * JWT là stateless nên một tài khoản bị vô hiệu hoá (SUSPENDED/INACTIVE/DELETED) vẫn dùng được token cũ tới khi hết hạn.
 * Bộ lọc này kiểm tra trạng thái hiện tại trong DB cho mỗi request có token (đệm `cacheSeconds` giây để không truy vấn mỗi lần;
 * 0 = không đệm) và trả 401 ACCOUNT_DISABLED; giao diện coi 401 có token là phiên hết hiệu lực và đăng xuất.
 * Lỗi truy vấn ⇒ cho đi tiếp (DB lỗi thì các API khác cũng lỗi; không để bộ lọc này tự gây ngừng dịch vụ).
 */
public class ActiveAccountFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(ActiveAccountFilter.class);
    private record Entry(boolean active, long expiresAtMillis) {}

    private final JdbcTemplate jdbc;
    private final long cacheMillis;
    private final Map<Long, Entry> cache = new ConcurrentHashMap<>();

    public ActiveAccountFilter(JdbcTemplate jdbc, int cacheSeconds) {
        this.jdbc = jdbc;
        this.cacheMillis = Math.max(0, cacheSeconds) * 1000L;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth instanceof JwtAuthenticationToken jwt && !isActive(jwt.getToken().getSubject())) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.getWriter().write("{\"status\":401,\"error\":\"Unauthorized\",\"code\":\"ACCOUNT_DISABLED\",\"message\":\"Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.\"}");
            return;
        }
        chain.doFilter(request, response);
    }

    boolean isActive(String subject) {
        long id;
        try { id = Long.parseLong(subject); } catch (NumberFormatException e) { return true; }
        long now = System.currentTimeMillis();
        Entry cached = cache.get(id);
        if (cached != null && cached.expiresAtMillis() > now) return cached.active();
        try {
            boolean active = !jdbc.queryForList("SELECT 1 FROM users WHERE id = ? AND status = 'ACTIVE' AND deleted_at IS NULL", Integer.class, id).isEmpty();
            if (cacheMillis > 0) cache.put(id, new Entry(active, now + cacheMillis));
            return active;
        } catch (RuntimeException e) {
            log.warn("Không kiểm tra được trạng thái tài khoản {}: {}", id, e.getMessage());
            return true;
        }
    }
}
