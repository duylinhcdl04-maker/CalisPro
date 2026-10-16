package com.calishealth.api.service.notification;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import tools.jackson.databind.ObjectMapper;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;

/**
 * Thông báo trong ứng dụng: lưu vào bảng notifications rồi đẩy realtime qua WebSocket (NotificationHub).
 * Đẩy chỉ xảy ra SAU KHI giao dịch gọi nó commit, để client không nhận tin của một thao tác bị rollback.
 */
@Service
public class NotificationService {
    public record NotificationDto(long id, String type, String title, String message, String referenceType, Long referenceId, boolean read, Instant createdAt) {}

    private final JdbcTemplate jdbc;
    private final NotificationHub hub;
    private final ObjectMapper json;

    public NotificationService(JdbcTemplate jdbc, NotificationHub hub, ObjectMapper json) {
        this.jdbc = jdbc; this.hub = hub; this.json = json;
    }

    /** Gửi cho một nhóm người nhận (bỏ trùng). */
    public void notifyUsers(Collection<Long> userIds, String type, String title, String message, String referenceType, Long referenceId) {
        Map<Long, NotificationDto> created = new LinkedHashMap<>();
        for (Long uid : new LinkedHashSet<>(userIds)) {
            if (uid == null) continue;
            created.put(uid, insert(uid, type, title, message, referenceType, referenceId));
        }
        Runnable push = () -> created.forEach((uid, dto) -> hub.push(uid, frame(dto, unreadCount(uid))));
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void afterCommit() { push.run(); }
            });
        } else {
            push.run();
        }
    }

    /** Gửi cho mọi tài khoản đang hoạt động của một vai trò (ADMIN, COACH...). */
    public void notifyRole(String role, String type, String title, String message, String referenceType, Long referenceId) {
        List<Long> ids = jdbc.queryForList("SELECT id FROM users WHERE role = ? AND status = 'ACTIVE'", Long.class, role);
        notifyUsers(ids, type, title, message, referenceType, referenceId);
    }

    /** Gửi cho một người theo email đăng nhập (không có hoặc không tìm thấy thì bỏ qua). */
    public void notifyEmail(String email, String type, String title, String message, String referenceType, Long referenceId) {
        if (email == null || email.isBlank()) return;
        List<Long> ids = jdbc.queryForList("SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND status = 'ACTIVE'", Long.class, email.trim());
        if (!ids.isEmpty()) notifyUsers(ids, type, title, message, referenceType, referenceId);
    }

    private NotificationDto insert(long userId, String type, String title, String message, String refType, Long refId) {
        Instant now = Instant.now();
        var keys = new org.springframework.jdbc.support.GeneratedKeyHolder();
        jdbc.update(con -> {
            PreparedStatement ps = con.prepareStatement("""
                    INSERT INTO notifications (user_id, type, title, message, reference_type, reference_id, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?)""",
                    Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, userId); ps.setString(2, trim(type, 50)); ps.setString(3, trim(title, 255)); ps.setString(4, message);
            ps.setString(5, refType == null ? null : trim(refType, 50));
            if (refId == null) ps.setNull(6, java.sql.Types.BIGINT); else ps.setLong(6, refId);
            ps.setTimestamp(7, Timestamp.from(now));
            return ps;
        }, keys);
        return new NotificationDto(keys.getKey().longValue(), type, title, message, refType, refId, false, now);
    }

    private static String trim(String s, int max) { return s == null || s.length() <= max ? s : s.substring(0, max); }

    private String frame(NotificationDto dto, int unread) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("event", "notification");
        m.put("notification", dto);
        m.put("unreadCount", unread);
        return json.writeValueAsString(m);
    }

    // ------------------------------------------------------------------ đọc / đánh dấu đã đọc (REST)

    public List<NotificationDto> list(long userId, boolean unreadOnly, int limit) {
        int n = Math.max(1, Math.min(limit, 100));
        String sql = "SELECT id, type, title, message, reference_type, reference_id, is_read, created_at FROM notifications WHERE user_id = ?"
                + (unreadOnly ? " AND is_read = 0" : "") + " ORDER BY created_at DESC, id DESC LIMIT " + n;
        return new ArrayList<>(jdbc.query(sql, (r, i) -> new NotificationDto(r.getLong(1), r.getString(2), r.getString(3), r.getString(4), r.getString(5),
                r.getObject(6) == null ? null : r.getLong(6), r.getBoolean(7), r.getTimestamp(8).toInstant()), userId));
    }

    public int unreadCount(long userId) {
        Integer c = jdbc.queryForObject("SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0", Integer.class, userId);
        return c == null ? 0 : c;
    }

    /** Chỉ đánh dấu được thông báo của chính mình. */
    public boolean markRead(long userId, long id) {
        return jdbc.update("UPDATE notifications SET is_read = 1, read_at = ? WHERE id = ? AND user_id = ? AND is_read = 0", Timestamp.from(Instant.now()), id, userId) > 0;
    }

    public int markAllRead(long userId) {
        return jdbc.update("UPDATE notifications SET is_read = 1, read_at = ? WHERE user_id = ? AND is_read = 0", Timestamp.from(Instant.now()), userId);
    }
}
