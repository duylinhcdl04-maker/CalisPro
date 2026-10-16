package com.calishealth.api.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpMethod;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Token có claim `mcp` (đăng nhập bằng mật khẩu tạm) chỉ được gọi: đổi mật khẩu, đọc hồ sơ của chính mình (để giao diện biết mình là ai) và /auth/**.
 * Mọi API khác trả 403 PASSWORD_CHANGE_REQUIRED cho tới khi đổi mật khẩu (token mới không còn claim).
 */
public class PasswordChangeRequiredFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth instanceof JwtAuthenticationToken jwt && Boolean.TRUE.equals(jwt.getToken().getClaim("mcp")) && !allowed(request)) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.getWriter().write("{\"status\":403,\"error\":\"Forbidden\",\"code\":\"PASSWORD_CHANGE_REQUIRED\",\"message\":\"Bạn cần đổi mật khẩu tạm trước khi tiếp tục.\"}");
            return;
        }
        chain.doFilter(request, response);
    }

    static boolean allowed(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (HttpMethod.OPTIONS.matches(request.getMethod()) || path.startsWith("/api/v1/auth/")) return true;
        if ("/api/v1/profile".equals(path)) return HttpMethod.GET.matches(request.getMethod());
        return "/api/v1/account/change-password".equals(path) && HttpMethod.POST.matches(request.getMethod());
    }
}
