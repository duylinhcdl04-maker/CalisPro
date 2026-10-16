package com.calishealth.api.service;

import com.calishealth.api.dto.ExerciseDtos.ExerciseRequest;
import com.calishealth.api.dto.ExerciseDtos.ExerciseResponse;
import com.calishealth.api.service.notification.NotificationService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.*;

/**
 * Chỉnh sửa của Coach trên động tác ĐÃ XUẤT BẢN không áp ngay: lưu thành một bản chỉnh sửa chờ duyệt, Admin xem phần thay đổi rồi duyệt (áp dụng)
 * hoặc từ chối kèm lý do. Mỗi bài chỉ có một bản chờ duyệt, bản gửi sau thay bản trước. Bản nháp chưa xuất bản thì Coach sửa thẳng, không qua bước này.
 */
@Service
public class ExerciseRevisionService {
    public static final String PENDING = "PENDING", APPROVED = "APPROVED", REJECTED = "REJECTED", SUPERSEDED = "SUPERSEDED";

    public record Change(String field, String label, String before, String after) {}
    public record Revision(long id, long exerciseId, String exerciseCode, String exerciseName, long authorId, String authorName, Instant createdAt,
                           String status, String notes, List<Change> changes) {}

    private static final Map<String, String> TOP = new LinkedHashMap<>();
    private static final Map<String, String> DETAILS = new LinkedHashMap<>();
    static {
        TOP.put("name", "Tên động tác"); TOP.put("description", "Mô tả"); TOP.put("categoryId", "Danh mục"); TOP.put("difficultyLevel", "Độ khó");
        TOP.put("movementPattern", "Kiểu chuyển động"); TOP.put("equipmentRequired", "Cần dụng cụ"); TOP.put("instructions", "Hướng dẫn");
        TOP.put("safetyNotes", "Lưu ý an toàn"); TOP.put("videoUrl", "Video"); TOP.put("thumbnailUrl", "Ảnh đại diện");
        DETAILS.put("displayName", "Tên hiển thị"); DETAILS.put("trainingCategory", "Phân loại tập luyện"); DETAILS.put("sessionRoles", "Dùng ở phần nào của buổi tập");
        DETAILS.put("animationUrl", "Ảnh động"); DETAILS.put("tags", "Thẻ"); DETAILS.put("equipment", "Dụng cụ"); DETAILS.put("setup", "Chuẩn bị");
        DETAILS.put("execution", "Thực hiện"); DETAILS.put("inhaleTiming", "Thời điểm hít vào"); DETAILS.put("exhaleTiming", "Thời điểm thở ra");
        DETAILS.put("tempo", "Nhịp độ"); DETAILS.put("safety", "An toàn"); DETAILS.put("phases", "Các pha chuyển động"); DETAILS.put("muscleTargets", "Nhóm cơ");
        DETAILS.put("coachingCues", "Gợi ý huấn luyện"); DETAILS.put("commonMistakes", "Lỗi thường gặp"); DETAILS.put("anatomyImages", "Ảnh giải phẫu");
        DETAILS.put("aiAnalysisData", "Cấu hình AI"); DETAILS.put("aiEnabled", "Tích hợp AI");
    }

    private final JdbcTemplate jdbc;
    private final ObjectMapper json;
    private final ExerciseService exercises;
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private NotificationService notifications;

    public ExerciseRevisionService(JdbcTemplate jdbc, ObjectMapper json, ExerciseService exercises) {
        this.jdbc = jdbc; this.json = json; this.exercises = exercises;
    }

    /** Coach gửi chỉnh sửa cho bài đã xuất bản. Trả về id bản chờ duyệt, hoặc null nếu nội dung không khác gì bài hiện tại. */
    @Transactional
    public Long submit(long exerciseId, long authorId, ExerciseRequest req) {
        ExerciseResponse current = exercises.getById(exerciseId, true);
        List<Change> changes = diff(req, current);
        if (changes.isEmpty()) return null;
        String payload = json.writeValueAsString(req);
        jdbc.update("UPDATE exercise_revisions SET status = ?, decided_at = ? WHERE exercise_id = ? AND status = ?", SUPERSEDED, Timestamp.from(Instant.now()), exerciseId, PENDING);
        jdbc.update("INSERT INTO exercise_revisions (exercise_id, author_id, payload_json, status, created_at) VALUES (?, ?, ?, ?, ?)",
                exerciseId, authorId, payload, PENDING, Timestamp.from(Instant.now()));
        long id = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        if (notifications != null) {
            String what = String.join(", ", changes.stream().limit(5).map(Change::label).toList()) + (changes.size() > 5 ? " và " + (changes.size() - 5) + " mục khác" : "");
            notifications.notifyRole("ADMIN", "EXERCISE_REVISION_SUBMITTED", "Coach gửi chỉnh sửa động tác chờ duyệt",
                    "Động tác “" + current.name() + "”: " + what + ".", "EXERCISE_REVISION", id);
        }
        return id;
    }

    /** Bản chờ duyệt: Admin thấy tất cả, Coach chỉ thấy của mình. exerciseId lọc theo một bài (tùy chọn). */
    public List<Revision> pending(boolean admin, long userId, Long exerciseId) {
        StringBuilder sql = new StringBuilder("""
                SELECT r.id, r.exercise_id, r.author_id, r.payload_json, r.status, r.notes, r.created_at, u.email
                FROM exercise_revisions r JOIN users u ON u.id = r.author_id WHERE r.status = 'PENDING'""");
        List<Object> args = new ArrayList<>();
        if (!admin) { sql.append(" AND r.author_id = ?"); args.add(userId); }
        if (exerciseId != null) { sql.append(" AND r.exercise_id = ?"); args.add(exerciseId); }
        sql.append(" ORDER BY r.created_at, r.id");
        List<Revision> out = new ArrayList<>();
        jdbc.query(sql.toString(), rch -> {
            long exId = rch.getLong(2);
            ExerciseResponse cur;
            try { cur = exercises.getById(exId, true); } catch (IllegalArgumentException gone) { return; }
            ExerciseRequest req;
            try { req = json.readValue(rch.getString(4), ExerciseRequest.class); } catch (Exception bad) { return; }
            out.add(new Revision(rch.getLong(1), exId, cur.code(), cur.name(), rch.getLong(3), rch.getString(8), rch.getTimestamp(7).toInstant(), rch.getString(5), rch.getString(6), diff(req, cur)));
        }, args.toArray());
        return out;
    }

    /** Admin duyệt: áp dụng đúng nội dung Coach đã gửi (trạng thái xuất bản của bài giữ nguyên). */
    @Transactional
    public void approve(long adminId, long revisionId) {
        Map<String, Object> r = requirePending(revisionId);
        long exerciseId = ((Number) r.get("exercise_id")).longValue(), authorId = ((Number) r.get("author_id")).longValue();
        ExerciseRequest req = json.readValue((String) r.get("payload_json"), ExerciseRequest.class);
        exercises.update(exerciseId, req, false, authorId);
        jdbc.update("UPDATE exercise_revisions SET status = ?, decided_by = ?, decided_at = ? WHERE id = ?", APPROVED, adminId, Timestamp.from(Instant.now()), revisionId);
        if (notifications != null) notifications.notifyUsers(List.of(authorId), "EXERCISE_REVISION_APPROVED", "Chỉnh sửa động tác đã được duyệt",
                "Admin đã duyệt và áp dụng chỉnh sửa động tác “" + exercises.getById(exerciseId, true).name() + "”.", "EXERCISE_REVISION", revisionId);
    }

    /** Admin từ chối: bắt buộc ghi lý do để Coach biết cần sửa gì; bài giữ nguyên nội dung đang xuất bản. */
    @Transactional
    public void reject(long adminId, long revisionId, String notes) {
        if (notes == null || notes.isBlank()) throw new IllegalArgumentException("NOTES_REQUIRED: cần ghi rõ lý do từ chối để Coach biết phải sửa gì");
        Map<String, Object> r = requirePending(revisionId);
        long exerciseId = ((Number) r.get("exercise_id")).longValue(), authorId = ((Number) r.get("author_id")).longValue();
        jdbc.update("UPDATE exercise_revisions SET status = ?, notes = ?, decided_by = ?, decided_at = ? WHERE id = ?", REJECTED, notes.trim(), adminId, Timestamp.from(Instant.now()), revisionId);
        if (notifications != null) notifications.notifyUsers(List.of(authorId), "EXERCISE_REVISION_REJECTED", "Chỉnh sửa động tác bị từ chối",
                "Động tác “" + exercises.getById(exerciseId, true).name() + "”: " + notes.trim(), "EXERCISE_REVISION", revisionId);
    }

    private Map<String, Object> requirePending(long id) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT exercise_id, author_id, payload_json, status FROM exercise_revisions WHERE id = ?", id);
        if (rows.isEmpty()) throw new IllegalArgumentException("Không tìm thấy bản chỉnh sửa.");
        if (!PENDING.equals(rows.get(0).get("status"))) throw new IllegalStateException("REVISION_NOT_PENDING: bản chỉnh sửa này đã được xử lý hoặc đã bị thay bằng bản mới hơn");
        return rows.get(0);
    }

    // ------------------------------------------------------------------ so sánh với nội dung đang xuất bản

    /** Các mục khác nhau giữa chỉnh sửa và bài hiện tại. Mục Coach không gửi (null) nghĩa là giữ nguyên nên không tính. null và chuỗi/danh sách rỗng coi như nhau. */
    List<Change> diff(ExerciseRequest req, ExerciseResponse cur) {
        JsonNode p = json.valueToTree(req), c = json.valueToTree(cur);
        List<Change> out = new ArrayList<>();
        compare(out, TOP, p, c);
        JsonNode pd = p.get("details");
        if (pd != null && pd.isObject()) compare(out, DETAILS, pd, c.get("details"));
        return out;
    }

    private void compare(List<Change> out, Map<String, String> fields, JsonNode proposed, JsonNode current) {
        for (var f : fields.entrySet()) {
            JsonNode a = proposed.get(f.getKey());
            if (a == null || a.isNull()) continue;
            JsonNode b = current == null ? null : current.get(f.getKey());
            if (empty(a) && empty(b)) continue;
            if (a.equals(b)) continue;
            out.add(new Change(f.getKey(), f.getValue(), show(b), show(a)));
        }
    }

    private static boolean empty(JsonNode n) {
        return n == null || n.isNull() || n.isMissingNode() || (n.isString() && n.asString().isBlank()) || (n.isArray() && n.size() == 0);
    }

    private static String show(JsonNode n) {
        if (empty(n)) return "(trống)";
        if (n.isArray()) return n.size() + " mục";
        if (n.isObject()) return "đã thay đổi";
        String s = n.asString();
        return s.length() > 160 ? s.substring(0, 157) + "..." : s;
    }
}
