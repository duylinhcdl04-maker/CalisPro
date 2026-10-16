package com.calishealth.api.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.BadSqlGrammarException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.Optional;

/**
 * Chính sách mật khẩu theo tài khoản (bảng user_password_policy, migration_coach_accounts.sql): mật khẩu tạm do Admin cấp
 * bắt buộc đổi ở lần đăng nhập đầu và có hạn dùng. Bảng chưa có (chưa chạy migration) ⇒ coi như không có ràng buộc, đăng nhập cũ không bị ảnh hưởng.
 */
@Service
public class PasswordPolicyService {
    private static final Logger log = LoggerFactory.getLogger(PasswordPolicyService.class);

    public record Policy(long userId, boolean mustChange, Instant tempExpiresAt, Instant issuedAt, Instant changedAt) {
        public boolean tempExpired(Instant now) { return mustChange && tempExpiresAt != null && now.isAfter(tempExpiresAt); }
    }

    private final JdbcTemplate jdbc;

    public PasswordPolicyService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public Optional<Policy> find(long userId) {
        try {
            return jdbc.query("SELECT user_id, must_change, temp_expires_at, issued_at, changed_at FROM user_password_policy WHERE user_id = ?", (rs, i) -> new Policy(
                    rs.getLong(1), rs.getBoolean(2), instant(rs.getTimestamp(3)), instant(rs.getTimestamp(4)), instant(rs.getTimestamp(5))), userId).stream().findFirst();
        } catch (BadSqlGrammarException e) {
            log.warn("Bảng user_password_policy chưa tồn tại (chưa chạy migration_coach_accounts.sql): bỏ qua ràng buộc đổi mật khẩu tạm");
            return Optional.empty();
        }
    }

    /** Bắt buộc dùng bảng: thiếu bảng là lỗi cấu hình, không được tạo tài khoản mà không có ràng buộc đổi mật khẩu. */
    public void issueTemporary(long userId, long adminId, Instant expiresAt) {
        try {
            jdbc.update("""
                    INSERT INTO user_password_policy (user_id, must_change, temp_expires_at, issued_by, issued_at, changed_at) VALUES (?, 1, ?, ?, ?, NULL)
                    ON DUPLICATE KEY UPDATE must_change = 1, temp_expires_at = VALUES(temp_expires_at), issued_by = VALUES(issued_by), issued_at = VALUES(issued_at)""",
                    userId, Timestamp.from(expiresAt), adminId, Timestamp.from(Instant.now()));
        } catch (DataAccessException e) {
            throw new IllegalStateException("Chưa chạy migration_coach_accounts.sql nên chưa thể cấp mật khẩu tạm: " + e.getMostSpecificCause().getMessage(), e);
        }
    }

    public void markChanged(long userId) {
        try {
            jdbc.update("UPDATE user_password_policy SET must_change = 0, temp_expires_at = NULL, changed_at = ? WHERE user_id = ?", Timestamp.from(Instant.now()), userId);
        } catch (BadSqlGrammarException e) {
            log.warn("Bảng user_password_policy chưa tồn tại: bỏ qua markChanged");
        }
    }

    private static Instant instant(Timestamp t) { return t == null ? null : t.toInstant(); }
}
