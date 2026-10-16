package com.calishealth.api.service.notification;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Hàng chờ việc của Admin: mọi thứ đang chờ Admin duyệt hoặc xử lý, tính TRỰC TIẾP từ trạng thái hiện tại trong database.
 * Thông báo realtime chỉ là sự kiện (có thể bị lỡ hoặc đến trước khi tính năng này có), còn hàng chờ luôn đúng với thực tế
 * và mất đi khi mục đã được xử lý.
 *
 * Nguồn dữ liệu:
 *  - Level Engine, bộ quy tắc V2, rule chấm form: trạng thái PENDING_REVIEW (Coach đã bấm gửi duyệt).
 *  - Giáo án mẫu, bài test đánh giá: bản nháp (DRAFT) chưa xuất bản, vì Admin là người duy nhất xuất bản.
 *  - Hồ sơ ứng tuyển Coach: PENDING hoặc UNDER_REVIEW.
 */
@Service
public class AdminWorkQueueService {
    /** Chờ từ ngày này trở lên thì đánh dấu gấp. */
    static final Duration URGENT_AFTER = Duration.ofDays(2);
    static final int ITEMS_PER_GROUP = 6;

    public record Item(String id, String title, String subtitle, Instant since, boolean urgent, String href) {}
    public record Group(String key, String label, String hint, int count, int urgentCount, Instant oldest, List<Item> items) {}
    public record WorkQueue(int total, int urgent, List<Group> groups) {}

    private final JdbcTemplate jdbc;

    public AdminWorkQueueService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public WorkQueue queue() {
        List<Group> groups = new ArrayList<>();
        add(groups, "LEVEL_ENGINE", "Level Engine chờ duyệt", "Coach đã gửi bản mới, chọn duyệt hoặc yêu cầu chỉnh sửa.", jdbc.query("""
                SELECT id, version, submitted_at, created_at, created_by FROM rule_sets WHERE code = 'LEVEL_ENGINE' AND status = 'PENDING_REVIEW' ORDER BY submitted_at, id""",
                (r, i) -> item("le" + r.getLong(1), "Level Engine phiên bản " + r.getInt(2), by(r.getString(5)), when(r.getTimestamp(3), r.getTimestamp(4)), "/admin/level-engine")));
        add(groups, "RULESET_V2", "Bộ quy tắc đánh giá V2 chờ duyệt", "Cần duyệt từng phạm vi trước khi kích hoạt.", jdbc.query("""
                SELECT id, version, submitted_at, created_at, created_by FROM rule_sets WHERE code = 'LEVEL_ENGINE_V2' AND status = 'PENDING_REVIEW' ORDER BY submitted_at, id""",
                (r, i) -> item("v2" + r.getLong(1), "Bộ quy tắc V2 phiên bản " + r.getInt(2), by(r.getString(5)), when(r.getTimestamp(3), r.getTimestamp(4)), "/admin/assessment-rule-sets/" + r.getLong(1))));
        add(groups, "MOTION_RULE", "Rule chấm form chờ duyệt", "Rule chạy thật khi học viên tập sau khi bạn xuất bản.", jdbc.query("""
                SELECT r.id, e.name, r.rule_name, r.rule_code, r.rule_version, r.submitted_by, r.submitted_at, r.created_at
                FROM ai_motion_rules r JOIN exercise_ai_profiles p ON p.id = r.ai_profile_id JOIN exercises e ON e.id = p.exercise_id
                WHERE r.status = 'PENDING_REVIEW' ORDER BY r.submitted_at, r.id""",
                (r, i) -> item("mr" + r.getLong(1), r.getString(2) + ": " + (r.getString(3) != null ? r.getString(3) : r.getString(4)) + " v" + r.getInt(5),
                        by(r.getString(6)), when(r.getTimestamp(7), r.getTimestamp(8)), "/admin/ai")));
        add(groups, "EXERCISE_REVISION", "Chỉnh sửa động tác chờ duyệt", "Coach sửa động tác đã xuất bản; thay đổi chỉ áp dụng khi bạn duyệt.", jdbc.query("""
                SELECT r.id, e.name, r.created_at, u.email FROM exercise_revisions r JOIN exercises e ON e.id = r.exercise_id JOIN users u ON u.id = r.author_id
                WHERE r.status = 'PENDING' ORDER BY r.created_at, r.id""",
                (r, i) -> item("xr" + r.getLong(1), r.getString(2), by(r.getString(4)), when(r.getTimestamp(3), null), "/admin/exercises?revision=" + r.getLong(1))));
        add(groups, "EXERCISE_DRAFT", "Động tác nháp chờ xuất bản", "Coach đã soạn xong; học viên chưa thấy cho tới khi bạn xuất bản.", jdbc.query("""
                SELECT e.id, e.name, e.submitted_at, e.created_at, u.email FROM exercises e JOIN users u ON u.id = e.author_id
                WHERE e.active = 0 AND e.author_id IS NOT NULL ORDER BY e.submitted_at, e.id""",
                (r, i) -> item("xd" + r.getLong(1), r.getString(2), by(r.getString(5)), when(r.getTimestamp(3), r.getTimestamp(4)), "/admin/exercises/" + r.getLong(1) + "/edit")));
        add(groups, "PROGRAM_TEMPLATE", "Giáo án mẫu chờ xuất bản", "Bản nháp chưa có hiệu lực với học viên cho tới khi bạn xuất bản.", jdbc.query("""
                SELECT id, name, created_by, updated_at, created_at FROM program_templates WHERE status = 'DRAFT' ORDER BY updated_at, id""",
                (r, i) -> item("pt" + r.getLong(1), r.getString(2), by(r.getString(3)), when(r.getTimestamp(4), r.getTimestamp(5)), "/admin/workout-plans/" + r.getLong(1))));
        add(groups, "ASSESSMENT_TEMPLATE", "Bài test đánh giá chờ phát hành", "Bản nháp chưa có hiệu lực với học viên cho tới khi bạn phát hành.", jdbc.query("""
                SELECT id, name, updated_at, created_at FROM assessment_templates WHERE status = 'DRAFT' ORDER BY updated_at, id""",
                (r, i) -> item("at" + r.getLong(1), r.getString(2), "Bản nháp", when(r.getTimestamp(3), r.getTimestamp(4)), "/admin/assessments/" + r.getLong(1) + "/edit")));
        add(groups, "COACH_APPLICATION", "Hồ sơ ứng tuyển Coach", "Hồ sơ mới cần xem xét và phản hồi.", jdbc.query("""
                SELECT id, full_name, primary_specialty, created_at FROM coach_applications WHERE status IN ('PENDING', 'UNDER_REVIEW') ORDER BY created_at, id""",
                (r, i) -> item("ca" + r.getLong(1), r.getString(2), r.getString(3) == null ? "Hồ sơ ứng tuyển" : r.getString(3), when(r.getTimestamp(4), null), "/admin/coaches")));

        // Nhóm có việc gấp lên trước, rồi nhóm đã chờ lâu nhất
        groups.sort(Comparator.comparingInt(Group::urgentCount).reversed().thenComparing(Group::oldest, Comparator.nullsLast(Comparator.naturalOrder())));
        return new WorkQueue(groups.stream().mapToInt(Group::count).sum(), groups.stream().mapToInt(Group::urgentCount).sum(), groups);
    }

    private static void add(List<Group> groups, String key, String label, String hint, List<Item> items) {
        if (items.isEmpty()) return;
        List<Item> shown = items.size() > ITEMS_PER_GROUP ? items.subList(0, ITEMS_PER_GROUP) : items;
        int urgent = (int) items.stream().filter(Item::urgent).count();
        groups.add(new Group(key, label, hint, items.size(), urgent, items.get(0).since(), List.copyOf(shown)));
    }

    private static Item item(String id, String title, String subtitle, Instant since, String href) {
        boolean urgent = since != null && Duration.between(since, Instant.now()).compareTo(URGENT_AFTER) >= 0;
        return new Item(id, title, subtitle, since, urgent, href);
    }

    private static Instant when(Timestamp primary, Timestamp fallback) {
        Timestamp t = primary != null ? primary : fallback;
        return t == null ? null : t.toInstant();
    }

    private static String by(String creator) { return creator == null || creator.isBlank() ? "Chưa rõ người soạn" : "Người soạn: " + creator; }
}
