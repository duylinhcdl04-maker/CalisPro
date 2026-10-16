package com.calishealth.api.service.assessmentv2;

import com.calishealth.api.dto.AssessmentV2Dtos.*;
import com.calishealth.api.service.ai.CloudinaryService;
import com.calishealth.api.service.assessmentv2.AssessmentSessionStore.SessionRow;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

/**
 * L4 (ELITE) không do camera tự xác minh (level.L4.requiresCoachVerified): camera đủ mọi cổng => L3 VERIFIED + gói review chờ Coach
 * (ASSESSMENT_FRAMEWORK_V2 §32). Gói THAM CHIẾU attempt/metric gốc, không sao chép và không sửa dữ liệu đo.
 *  - Video chỉ được ghi/lưu khi user đồng ý TRƯỚC; user từ chối vẫn có L3 nhưng không vào hàng chờ L4.
 *  - CONFIRM cần video còn hạn; REJECT / REQUEST_RETEST cần lý do. Không quyết định nào là bằng chứng tiêu cực (không đổi điểm/EWMA/level).
 *  - Mọi quyết định ghi vào coach_overrides (giá trị gốc → giá trị mới, lý do, coach).
 */
@Service
public class L4ReviewService {
    public static final String PENDING = "PENDING", CONFIRMED = "CONFIRMED", REJECTED = "REJECTED", RETEST_REQUESTED = "RETEST_REQUESTED",
            SUPERSEDED = "SUPERSEDED", EXPIRED = "EXPIRED";
    private static final String BASELINE_TYPE = "PERIODIC";

    private final JdbcTemplate jdbc;
    private final ObjectMapper json;
    private final AssessmentSessionStore store;
    private final RuleSetV2Loader ruleSets;
    private final CloudinaryService cloudinary;
    private final String cloudName;
    private final LevelStateV2Service levelState;

    public L4ReviewService(JdbcTemplate jdbc, ObjectMapper json, AssessmentSessionStore store, RuleSetV2Loader ruleSets, CloudinaryService cloudinary,
                           @Value("${app.cloudinary.cloud-name:}") String cloudName, LevelStateV2Service levelState) {
        this.levelState = levelState;
        this.jdbc = jdbc; this.json = json; this.store = store; this.ruleSets = ruleSets; this.cloudinary = cloudinary; this.cloudName = cloudName;
    }

    static String folderOf(long userId) { return "calishealth_l4_review/u" + userId; }

    // ------------------------------------------------------------------ user: đồng ý ghi hình, upload, gắn video

    @Transactional
    public RecordingConsentDto grantConsent(long userId, long sessionId, boolean granted) {
        SessionRow s = ownBaseline(userId, sessionId);
        if (!"IN_PROGRESS".equals(s.status())) throw new IllegalStateException("CONSENT_LOCKED: chỉ đổi lựa chọn ghi hình khi phiên đang diễn ra");
        int retention = retentionDays(s);
        jdbc.update("""
                INSERT INTO assessment_recording_consents (session_id, user_id, granted, retention_days, created_at) VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE granted = VALUES(granted), retention_days = VALUES(retention_days)""",
                sessionId, userId, granted, retention, Timestamp.from(Instant.now()));
        return new RecordingConsentDto(sessionId, granted, retention);
    }

    public boolean consentGranted(long sessionId) {
        return jdbc.queryForList("SELECT granted FROM assessment_recording_consents WHERE session_id = ?", Boolean.class, sessionId).stream().anyMatch(b -> b);
    }

    /** Chữ ký upload trực tiếp lên Cloudinary, giới hạn trong thư mục riêng của user; chỉ cấp khi user đã đồng ý ghi hình. */
    public Map<String, Object> uploadSignature(long userId, long sessionId) {
        SessionRow s = ownBaseline(userId, sessionId);
        requireVideoAllowed(s);
        if (!cloudinary.isConfigured()) throw new IllegalStateException("Cloudinary chưa được cấu hình");
        return cloudinary.createUploadSignature(folderOf(userId));
    }

    @Transactional
    public void attachVideo(long userId, long sessionId, long attemptId, String videoUrl) {
        SessionRow s = ownBaseline(userId, sessionId);
        requireVideoAllowed(s);
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM assessment_attempts WHERE id = ? AND session_id = ?", Integer.class, attemptId, sessionId);
        if (n == null || n == 0) throw new IllegalArgumentException("Không tìm thấy attempt " + attemptId + " trong phiên này");
        validateVideoUrl(userId, videoUrl);
        Instant now = Instant.now();
        jdbc.update("UPDATE assessment_attempts SET video_url = ?, video_uploaded_at = ?, video_expires_at = ? WHERE id = ?",
                videoUrl, Timestamp.from(now), Timestamp.from(now.plus(Duration.ofDays(retentionDays(s)))), attemptId);
    }

    /** Chỉ nhận url do chính Cloudinary của app phát hành trong thư mục riêng của user: chặn link tuỳ ý (lừa đảo/SSRF) hiện cho Coach. */
    void validateVideoUrl(long userId, String url) {
        if (cloudName == null || cloudName.isBlank()) throw new IllegalStateException("Cloudinary chưa được cấu hình");
        String prefix = "https://res.cloudinary.com/" + cloudName + "/video/upload/";
        if (url == null || url.length() > 1000 || !url.startsWith(prefix) || url.chars().anyMatch(Character::isWhitespace)
                || !url.contains("/" + folderOf(userId) + "/") || url.contains("..") || url.contains("?") || url.contains("#"))
            throw new IllegalArgumentException("INVALID_VIDEO_URL: chỉ nhận video đã upload lên thư mục ghi hình của bạn");
    }

    private void requireVideoAllowed(SessionRow s) {
        boolean open = "IN_PROGRESS".equals(s.status());
        boolean pendingPackage = "COMPLETED".equals(s.status()) && Boolean.TRUE.equals(jdbc.queryForObject(
                "SELECT EXISTS (SELECT 1 FROM l4_review_packages WHERE source_session_id = ? AND status = 'PENDING')", Boolean.class, s.id()));
        if (!open && !pendingPackage) throw new IllegalStateException("VIDEO_NOT_ACCEPTED: phiên đã kết thúc và không có yêu cầu xác nhận L4 đang chờ");
        if (!consentGranted(s.id())) throw new IllegalStateException("RECORDING_CONSENT_REQUIRED: cần đồng ý ghi hình trước khi quay/tải video");
    }

    private int retentionDays(SessionRow s) { return (int) ruleSets.load(s.ruleSetId()).params().require("l4.video.retention_days"); }

    // ------------------------------------------------------------------ mở gói (gọi từ BaselineService khi kết thúc phiên)

    /** Trong cùng transaction với việc kết thúc phiên. Gói PENDING cũ của user bị thay thế (SUPERSEDED). */
    public long openPackage(long userId, long sessionId, String sourceType, long ruleSetId, String verifiedLevel, String pendingLevel, Double overall, int expiryDays) {
        jdbc.update("UPDATE l4_review_packages SET status = ? WHERE user_id = ? AND status = ?", SUPERSEDED, userId, PENDING);
        Map<String, Object> evidence = new LinkedHashMap<>();
        evidence.put("overallScore", overall);
        evidence.put("attempts", snapshotAttempts(sessionId));
        Instant now = Instant.now();
        jdbc.update("""
                INSERT INTO l4_review_packages (user_id, source_session_id, source_type, rule_set_id, verified_level_code, pending_level_code, status, evidence_json, created_at, expires_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                userId, sessionId, sourceType, ruleSetId, verifiedLevel, pendingLevel, PENDING, json.writeValueAsString(evidence),
                Timestamp.from(now), Timestamp.from(now.plus(Duration.ofDays(expiryDays))));
        return jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
    }

    private List<Map<String, Object>> snapshotAttempts(long sessionId) {
        Map<Long, Map<String, Double>> metrics = new HashMap<>();
        jdbc.query("SELECT attempt_id, metric_code, value FROM assessment_metrics WHERE session_id = ? AND attempt_id IS NOT NULL",
                rch -> { metrics.computeIfAbsent(rch.getLong(1), k -> new LinkedHashMap<>()).put(rch.getString(2), rch.getDouble(3)); }, sessionId);
        return jdbc.query("""
                SELECT a.id, JSON_UNQUOTE(JSON_EXTRACT(q.config_json, '$.exerciseCode')) ex, a.attempt_no, a.measurement_status, a.reliability, a.movement_session_id
                FROM assessment_attempts a JOIN assessment_questions q ON q.id = a.item_id WHERE a.session_id = ? ORDER BY a.id""", (rs, i) -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("attemptId", rs.getLong(1)); m.put("exerciseCode", rs.getString(2)); m.put("attemptNo", rs.getInt(3));
            m.put("measurementStatus", rs.getString(4)); m.put("reliability", rs.getDouble(5)); m.put("movementSessionId", rs.getLong(6));
            m.put("metrics", metrics.getOrDefault(rs.getLong(1), Map.of()));
            return m;
        }, sessionId);
    }

    // ------------------------------------------------------------------ đọc

    /** Kết quả đo mới không còn đủ điều kiện L4 (hoặc đã đổi level): gói PENDING cũ lỗi thời nên không để Coach xác nhận nữa. */
    public void supersedePending(long userId) {
        jdbc.update("UPDATE l4_review_packages SET status = ? WHERE user_id = ? AND status = ?", SUPERSEDED, userId, PENDING);
    }

    public Optional<L4ReviewSummaryDto> latestFor(long userId) {
        housekeeping();
        return jdbc.query(SUMMARY_SQL + " WHERE user_id = ? ORDER BY id DESC LIMIT 1", (rs, i) -> summary(rs), userId).stream().findFirst();
    }

    public List<L4ReviewSummaryDto> list(String status) {
        housekeeping();
        String st = status == null || status.isBlank() ? PENDING : status.toUpperCase(Locale.ROOT);
        return jdbc.query(SUMMARY_SQL + " WHERE status = ? ORDER BY created_at LIMIT 100", (rs, i) -> summary(rs), st);
    }

    public L4ReviewDetailDto detail(long id) {
        housekeeping();
        L4ReviewSummaryDto sum = find(id);
        JsonNode ev = json.readTree(jdbc.queryForObject("SELECT evidence_json FROM l4_review_packages WHERE id = ?", String.class, id));
        long sessionId = jdbc.queryForObject("SELECT source_session_id FROM l4_review_packages WHERE id = ?", Long.class, id);
        Instant now = Instant.now();
        Map<Long, String[]> videos = new HashMap<>();   // attemptId -> {url, expires}
        jdbc.query("SELECT id, video_url, video_expires_at FROM assessment_attempts WHERE session_id = ? AND video_url IS NOT NULL", rch -> {
            Timestamp exp = rch.getTimestamp(3);
            if (exp != null && exp.toInstant().isAfter(now)) videos.put(rch.getLong(1), new String[]{rch.getString(2), exp.toInstant().toString()});
        }, sessionId);
        List<AttemptEvidenceDto> attempts = new ArrayList<>();
        for (JsonNode a : ev.path("attempts")) {
            long attemptId = a.path("attemptId").asLong();
            long movement = a.path("movementSessionId").asLong();
            Map<String, Double> metrics = new LinkedHashMap<>();
            a.path("metrics").properties().forEach(e -> metrics.put(e.getKey(), e.getValue().asDouble()));
            List<RepEvidenceDto> reps = jdbc.query("SELECT rep_number, valid, quality_score, violation_codes FROM motion_rep_results WHERE movement_session_id = ? ORDER BY rep_number",
                    (rs, i) -> new RepEvidenceDto(rs.getInt(1), rs.getBoolean(2), (Integer) rs.getObject(3), rs.getString(4)), movement);
            String[] v = videos.get(attemptId);
            attempts.add(new AttemptEvidenceDto(attemptId, a.path("exerciseCode").asString(""), a.path("attemptNo").asInt(), a.path("measurementStatus").asString(""),
                    a.path("reliability").asDouble(), movement, metrics, v == null ? null : v[0], v == null ? null : Instant.parse(v[1]), reps));
        }
        Double overall = ev.path("overallScore").isNumber() ? ev.path("overallScore").asDouble() : null;
        return new L4ReviewDetailDto(sum, overall, attempts);
    }

    // ------------------------------------------------------------------ Coach quyết định

    @Transactional
    public L4ReviewSummaryDto decide(long coachId, long id, String decision, String reason) {
        housekeeping();
        String d = decision == null ? "" : decision.trim().toUpperCase(Locale.ROOT);
        String newStatus = switch (d) {
            case "CONFIRM" -> CONFIRMED;
            case "REJECT" -> REJECTED;
            case "REQUEST_RETEST" -> RETEST_REQUESTED;
            default -> throw new IllegalArgumentException("decision phải là CONFIRM | REJECT | REQUEST_RETEST");
        };
        if (!CONFIRMED.equals(newStatus) && (reason == null || reason.isBlank()))
            throw new IllegalArgumentException("REASON_REQUIRED: cần ghi lý do khi từ chối hoặc yêu cầu đo lại");

        Map<String, Object> row = jdbc.queryForMap("SELECT user_id, source_session_id, status, verified_level_code, pending_level_code, rule_set_id FROM l4_review_packages WHERE id = ? FOR UPDATE", id);
        long userId = ((Number) row.get("user_id")).longValue();
        if (userId == coachId) throw new AccessDeniedException("Coach không được tự xác nhận level của chính mình");
        if (!PENDING.equals(row.get("status"))) throw new IllegalStateException("REVIEW_NOT_PENDING: gói đang ở trạng thái " + row.get("status"));
        long sessionId = ((Number) row.get("source_session_id")).longValue();
        String pendingLevel = (String) row.get("pending_level_code");

        if (CONFIRMED.equals(newStatus)) {
            Integer videos = jdbc.queryForObject("SELECT COUNT(*) FROM assessment_attempts WHERE session_id = ? AND video_url IS NOT NULL AND video_expires_at > ?",
                    Integer.class, sessionId, Timestamp.from(Instant.now()));
            if (videos == null || videos == 0) throw new IllegalStateException("VIDEO_EVIDENCE_REQUIRED: không có video còn hạn để xác nhận - hãy yêu cầu đo lại");
            LevelStateV2Service.LevelState st = levelState.state(userId).orElseThrow(() -> new IllegalStateException("STATE_CHANGED: người dùng chưa có level đã xác minh"));
            if (!st.levelCode().equals(row.get("verified_level_code")))
                throw new IllegalStateException("STATE_CHANGED: level hiện tại (" + st.levelCode() + ") đã khác level lúc gửi duyệt (" + row.get("verified_level_code") + ") - gói đã lỗi thời");
        }

        Map<String, Object> before = Map.of("status", PENDING, "level", row.get("verified_level_code"), "pendingLevel", pendingLevel);
        Map<String, Object> after = new LinkedHashMap<>();
        after.put("status", newStatus); after.put("level", CONFIRMED.equals(newStatus) ? pendingLevel : row.get("verified_level_code"));
        after.put("verificationSource", CONFIRMED.equals(newStatus) ? "COACH_VERIFIED" : "AI_MEASURED");
        Timestamp now = Timestamp.from(Instant.now());
        jdbc.update("INSERT INTO coach_overrides (coach_id, user_id, target_type, target_id, original_value_json, new_value_json, reason, created_at) VALUES (?, ?, 'L4_REVIEW', ?, ?, ?, ?, ?)",
                coachId, userId, id, json.writeValueAsString(before), json.writeValueAsString(after), reason, now);
        long overrideId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        jdbc.update("UPDATE l4_review_packages SET status = ?, decided_by_coach_id = ?, decided_at = ?, decision_reason = ?, coach_override_id = ?, confirmed_level_code = ? WHERE id = ?",
                newStatus, coachId, now, reason, overrideId, CONFIRMED.equals(newStatus) ? pendingLevel : null, id);
        if (CONFIRMED.equals(newStatus)) {
            // Coach xác nhận ⇒ level hiệu lực là L4 (nguồn COACH_VERIFIED); EWMA/chuỗi suy giảm giữ nguyên (không phải một lần đo mới)
            RuleSetV2 rs = ruleSets.load(((Number) row.get("rule_set_id")).longValue());
            int rank = rs.levels().stream().filter(l -> l.code().equals(pendingLevel)).mapToInt(l -> l.rank()).findFirst()
                    .orElseThrow(() -> new IllegalStateException("Rule set không có level " + pendingLevel));
            LevelStateV2Service.LevelState st = levelState.state(userId).orElseThrow();
            levelState.upsert(userId, pendingLevel, rank, LevelStateV2Service.VERIFIED, "COACH_VERIFIED", st.ewma(), st.consecutiveBelow(), sessionId, Instant.now());
            levelState.recordDecision(userId, sessionId, "COACH_L4", "DECIDED", "PROMOTED", (String) row.get("verified_level_code"), pendingLevel, rank, null, null, st.ewma(),
                    st.consecutiveBelow(), "COACH_VERIFIED", null);
        }
        return find(id);
    }

    // ------------------------------------------------------------------ nội bộ

    private static final String SUMMARY_SQL = """
            SELECT id, user_id, status, verified_level_code, pending_level_code, created_at, expires_at, decided_at, decision_reason, confirmed_level_code
            FROM l4_review_packages""";

    private static L4ReviewSummaryDto summary(java.sql.ResultSet rs) throws java.sql.SQLException {
        Timestamp decided = rs.getTimestamp(8);
        return new L4ReviewSummaryDto(rs.getLong(1), rs.getLong(2), rs.getString(3), rs.getString(4), rs.getString(5), rs.getTimestamp(6).toInstant(),
                rs.getTimestamp(7).toInstant(), decided == null ? null : decided.toInstant(), rs.getString(9), rs.getString(10));
    }

    private L4ReviewSummaryDto find(long id) {
        return jdbc.query(SUMMARY_SQL + " WHERE id = ?", (rs, i) -> summary(rs), id).stream().findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy gói review " + id));
    }

    /** Gói quá hạn => EXPIRED; video quá hạn lưu => xoá url. (Asset trên Cloudinary chưa bị xoá - cần job riêng có public_id.) */
    void housekeeping() {
        Timestamp now = Timestamp.from(Instant.now());
        jdbc.update("UPDATE l4_review_packages SET status = ? WHERE status = ? AND expires_at < ?", EXPIRED, PENDING, now);
        jdbc.update("UPDATE assessment_attempts SET video_url = NULL WHERE video_url IS NOT NULL AND video_expires_at < ?", now);
    }

    private SessionRow ownBaseline(long userId, long sessionId) {
        SessionRow s = store.find(sessionId).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phiên " + sessionId));
        if (s.userId() != userId || !BASELINE_TYPE.equals(s.typeCode())) throw new IllegalArgumentException("Không tìm thấy phiên " + sessionId);
        return s;
    }
}
