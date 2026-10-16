package com.calishealth.api.config;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import com.nimbusds.jose.jwk.OctetSequenceKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.JWKSet;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;

import org.springframework.security.config.Customizer;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
    @Value("${app.jwt.secret}")
    private String secret;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecretKey jwtSecretKey() {
        return new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }

    @Bean
    public JwtEncoder jwtEncoder(SecretKey key) {
        var jwk = new OctetSequenceKey.Builder(key.getEncoded())
                .algorithm(com.nimbusds.jose.JWSAlgorithm.HS256)
                .keyID("calishealth")
                .build();
        return new NimbusJwtEncoder(new ImmutableJWKSet<>(new JWKSet(jwk)));
    }

    @Bean
    public JwtDecoder jwtDecoder(SecretKey key) {
        return NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            String role = jwt.getClaimAsString("role");
            if (role == null || role.isBlank()) {
                return Collections.emptyList();
            }
            return List.of(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()));
        });
        return converter;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthenticationConverter jwtAuthConverter, org.springframework.jdbc.core.JdbcTemplate jdbc,
                                                   @org.springframework.beans.factory.annotation.Value("${app.security.status-cache-seconds:30}") int statusCacheSeconds) throws Exception {
        http.cors(Customizer.withDefaults())
                .csrf(c -> c.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(a -> a
                        .requestMatchers("/api/v1/auth/**", "/actuator/health").permitAll()
                        // WebSocket thông báo: JWT đi theo query và được kiểm tra ở bước bắt tay (NotificationWebSocketConfig)
                        .requestMatchers("/ws/**").permitAll()
                        // Media: chỉ cho xem file / trạng thái công khai; upload & cấp chữ ký Cloudinary dành cho Coach/Admin (soạn động tác)
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/media/**").permitAll()
                        .requestMatchers("/api/v1/media/**").hasAnyRole("COACH", "ADMIN")
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/admin/ai/audio/**").permitAll()
                        // Thư viện động tác: Coach SOẠN (tạo bản nháp, sửa, xóa bản nháp); xuất bản và xóa bài đã xuất bản chỉ Admin (ExerciseService kiểm tra theo vai trò)
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/exercises").hasAnyRole("COACH", "ADMIN")
                        .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/v1/exercises/*").hasAnyRole("COACH", "ADMIN")
                        .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/v1/exercises/*").hasAnyRole("COACH", "ADMIN")
                        // Danh mục dùng chung: ai cũng đọc được, chỉ ADMIN được thêm/sửa/xóa
                        .requestMatchers(org.springframework.http.HttpMethod.GET,
                                "/api/v1/exercises", "/api/v1/exercises/**",
                                "/api/v1/exercise-categories", "/api/v1/exercise-categories/**",
                                "/api/v1/goals", "/api/v1/goals/**").permitAll()
                        .requestMatchers(
                                "/api/v1/exercises", "/api/v1/exercises/**",
                                "/api/v1/exercise-categories", "/api/v1/exercise-categories/**",
                                "/api/v1/goals", "/api/v1/goals/**").hasRole("ADMIN")
                        // Rule chấm form (Motion Rule Engine): Coach SOẠN (profile, rule, thử, câu phản hồi, gửi duyệt), Admin DUYỆT.
                        // Xuất bản / trả lại / lưu trữ và tạo giọng đọc (tốn phí TTS) chỉ ADMIN; MotionConfigService chặn tự duyệt bản do chính mình gửi.
                        .requestMatchers(org.springframework.http.HttpMethod.POST,
                                "/api/v1/admin/motion-rules/*/publish", "/api/v1/admin/motion-rules/*/reject", "/api/v1/admin/motion-rules/*/archive",
                                "/api/v1/admin/motion-feedback-templates/*/generate-audio").hasRole("ADMIN")
                        .requestMatchers("/api/v1/admin/motion/**", "/api/v1/admin/motion-profiles", "/api/v1/admin/motion-profiles/**", "/api/v1/admin/motion-rules/**",
                                "/api/v1/admin/exercises/*/motion-profiles").hasAnyRole("COACH", "ADMIN")
                        // Chỉnh sửa động tác của Coach chờ duyệt: Coach xem bản của mình, Admin duyệt/từ chối
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/exercise-revisions").hasAnyRole("COACH", "ADMIN")
                        .requestMatchers("/api/v1/exercise-revisions/**").hasRole("ADMIN")
                        // Trình soạn động tác của Coach dùng AI sinh nội dung động tác và rule góc khớp (chỉ hai chức năng này)
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/admin/ai/generate/exercise", "/api/v1/admin/ai/generate/motion-rules").hasAnyRole("COACH", "ADMIN")
                        // Level Engine v1, giáo án mẫu, bài test đánh giá: Coach SOẠN (tạo/sửa bản nháp, nhân bản, thử mô phỏng, xem);
                        // Admin DUYỆT/kích hoạt/xuất bản/bật-tắt/xóa. Các hành động của Admin đặt TRƯỚC để khớp trước.
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/admin/level-engine/rule-sets/*/activate", "/api/v1/admin/level-engine/rule-sets/*/decision",
                                "/api/v1/admin/assessment-templates/*/publish", "/api/v1/admin/assessment-onboarding/**").hasRole("ADMIN")
                        .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/v1/admin/assessment-onboarding").hasRole("ADMIN")
                        .requestMatchers(org.springframework.http.HttpMethod.PATCH, "/api/v1/admin/program-templates/*/status",
                                "/api/v1/admin/assessment-templates/*/status").hasRole("ADMIN")
                        .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/v1/admin/program-templates/*",
                                "/api/v1/admin/assessment-templates/*", "/api/v1/admin/assessment-questions/*").hasRole("ADMIN")
                        .requestMatchers("/api/v1/admin/level-engine/**", "/api/v1/admin/program-templates", "/api/v1/admin/program-templates/**",
                                "/api/v1/admin/assessment-templates", "/api/v1/admin/assessment-templates/**",
                                "/api/v1/admin/assessment-questions", "/api/v1/admin/assessment-questions/**").hasAnyRole("COACH", "ADMIN")
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/admin/assessment-onboarding").hasAnyRole("COACH", "ADMIN")
                        // Toàn bộ API quản trị (kể cả AI generate) chỉ ADMIN
                        .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                        // Coach xem/xác minh/can thiệp level của học viên (Admin cũng được phép)
                        .requestMatchers("/api/v1/coach/**").hasAnyRole("COACH", "ADMIN")
                        .anyRequest().authenticated())
                .oauth2ResourceServer(o -> o.jwt(j -> j.jwtAuthenticationConverter(jwtAuthConverter)))
                // Tài khoản bị vô hiệu hoá mất quyền ngay (trong ${app.security.status-cache-seconds} giây), không đợi token hết hạn
                .addFilterAfter(new com.calishealth.api.security.ActiveAccountFilter(jdbc, statusCacheSeconds),
                        org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter.class)
                // Token đăng nhập bằng mật khẩu tạm (claim mcp) chỉ được đổi mật khẩu: chặn mọi API khác cho tới khi đổi
                .addFilterAfter(new com.calishealth.api.security.PasswordChangeRequiredFilter(),
                        org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter.class);
        return http.build();
    }
}
