package com.calishealth.api.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.BadSqlGrammarException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Khoá tài khoản khi nhập sai mật khẩu nhiều lần (bảng user_login_throttle, migration_login_throttle.sql).
 *  - `max-failures` lần sai trong `window-minutes` phút ⇒ khoá `lock-minutes` phút; đang khoá thì từ chối cả khi mật khẩu đúng (không thành "oracle" để dò).
 *  - Ghi nhận lỗi và xoá bộ đếm chạy trong transaction RIÊNG: đăng nhập thất bại ném ngoại lệ làm hoàn tác transaction của lệnh đăng nhập,
 *    nếu dùng chung thì bộ đếm cũng bị hoàn tác và việc khoá không bao giờ xảy ra.
 *  - Bảng chưa có (chưa chạy migration) ⇒ không khoá, ghi cảnh báo; đăng nhập không bị ảnh hưởng.
 * Chỉ đếm cho tài khoản tồn tại (không có gì để bảo vệ với email không tồn tại).
 */
@Service
public class LoginThrottleService {
    private static final Logger log = LoggerFactory.getLogger(LoginThrottleService.class);

    private final JdbcTemplate jdbc;
    private final int maxFailures;
    private final Duration window, lockFor;

    public LoginThrottleService(JdbcTemplate jdbc,
                                @Value("${app.security.login.max-failures:5}") int maxFailures,
                                @Value("${app.security.login.window-minutes:15}") int windowMinutes,
                                @Value("${app.security.login.lock-minutes:15}") int lockMinutes) {
        if (maxFailures < 1 || windowMinutes < 1 || lockMinutes < 1) throw new IllegalArgumentException("app.security.login.* phải ≥ 1");
        this.jdbc = jdbc;
        this.maxFailures = maxFailures;
        this.window = Duration.ofMinutes(windowMinutes);
        this.lockFor = Duration.ofMinutes(lockMinutes);
    }

    /** Thời điểm hết khoá nếu tài khoản đang bị khoá, ngược lại rỗng. */
    public Optional<Instant> lockedUntil(long userId) {
        try {
            List<Timestamp> rows = jdbc.queryForList("SELECT locked_until FROM user_login_throttle WHERE user_id = ? AND locked_until IS NOT NULL", Timestamp.class, userId);
            return rows.stream().map(Timestamp::toInstant).filter(t -> t.isAfter(Instant.now())).findFirst();
        } catch (BadSqlGrammarException e) {
            warnMissingTable();
            return Optional.empty();
        }
    }

    /** Ghi một lần nhập sai. Trả thời điểm hết khoá nếu lần này làm tài khoản bị khoá, ngược lại null. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Instant recordFailure(long userId) {
        try {
            Instant now = Instant.now();
            record Row(int count, Instant first, Instant locked) {}
            var row = jdbc.query("SELECT failed_count, first_failed_at, locked_until FROM user_login_throttle WHERE user_id = ? FOR UPDATE",
                    (rs, i) -> new Row(rs.getInt(1), rs.getTimestamp(2) == null ? null : rs.getTimestamp(2).toInstant(), rs.getTimestamp(3) == null ? null : rs.getTimestamp(3).toInstant()),
                    userId).stream().findFirst();
            int count = 1;
            Instant first = now;
            if (row.isPresent()) {
                Row r = row.get();
                boolean windowOpen = r.first() != null && r.first().isAfter(now.minus(window));
                boolean lockExpired = r.locked() != null && !r.locked().isAfter(now);
                if (windowOpen && !lockExpired) {
                    count = r.count() + 1;
                    first = r.first();
                }
            }
            Instant lockedUntil = count >= maxFailures ? now.plus(lockFor) : null;
            jdbc.update("""
                    INSERT INTO user_login_throttle (user_id, failed_count, first_failed_at, last_failed_at, locked_until) VALUES (?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE failed_count = VALUES(failed_count), first_failed_at = VALUES(first_failed_at), last_failed_at = VALUES(last_failed_at), locked_until = VALUES(locked_until)""",
                    userId, count, Timestamp.from(first), Timestamp.from(now), lockedUntil == null ? null : Timestamp.from(lockedUntil));
            return lockedUntil;
        } catch (BadSqlGrammarException e) {
            warnMissingTable();
            return null;
        }
    }

    /** Đăng nhập đúng, đổi mật khẩu, Admin mở khoá hoặc cấp lại mật khẩu ⇒ xoá bộ đếm và khoá. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void reset(long userId) {
        try {
            jdbc.update("UPDATE user_login_throttle SET failed_count = 0, first_failed_at = NULL, last_failed_at = NULL, locked_until = NULL WHERE user_id = ? AND (failed_count > 0 OR locked_until IS NOT NULL)", userId);
        } catch (BadSqlGrammarException e) {
            warnMissingTable();
        }
    }

    public int lockMinutes() { return (int) lockFor.toMinutes(); }

    private void warnMissingTable() {
        log.warn("Bảng user_login_throttle chưa tồn tại (chưa chạy migration_login_throttle.sql): KHÔNG có khoá tài khoản khi đăng nhập sai nhiều lần");
    }
}
