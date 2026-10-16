package com.calishealth.api.service.assessmentv2;

import com.calishealth.api.safety.SafetyModels.ActiveFlag;
import com.calishealth.api.safety.SafetyModels.Severity;
import com.calishealth.api.safety.SafetyModels.Status;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.*;

/** Đọc Safety Status hiện tại của user (Safety là miền riêng: không đọc năng lực/level, không ghi vào chúng). */
@Service
public class SafetyStatusService {
    public record View(long id, Status status, Instant validUntil, boolean expired, List<ActiveFlag> activeFlags, Set<String> constraints, long ruleSetId,
                       String clearanceMethod, boolean acknowledged) {}

    private final JdbcTemplate jdbc;
    private final ObjectMapper json;

    private final AssessmentV2Settings settings;

    public SafetyStatusService(JdbcTemplate jdbc, ObjectMapper json, AssessmentV2Settings settings) { this.jdbc = jdbc; this.json = json; this.settings = settings; }

    public Optional<View> current(long userId) {
        return jdbc.query("""
                SELECT s.id, s.status, s.valid_until, s.active_flags_json, s.constraints_json, s.rule_set_id, s.clearance_method,
                       EXISTS (SELECT 1 FROM safety_acknowledgements a WHERE a.safety_status_id = s.id AND a.advisory_version = ?)
                FROM user_safety_status s WHERE s.user_id = ? AND s.is_current = TRUE ORDER BY s.id DESC LIMIT 1""", (rs, i) -> {
            Instant until = rs.getTimestamp(3).toInstant();
            List<ActiveFlag> flags = new ArrayList<>();
            Set<String> constraints = new TreeSet<>();
            JsonNode f = json.readTree(rs.getString(4)), c = json.readTree(rs.getString(5));
            f.forEach(n -> flags.add(new ActiveFlag(n.get("code").asString(), n.get("sticky").asBoolean(), Severity.valueOf(n.get("severity").asString()))));
            c.forEach(n -> constraints.add(n.asString()));
            return new View(rs.getLong(1), Status.valueOf(rs.getString(2)), until, until.isBefore(Instant.now()), flags, constraints, rs.getLong(6), rs.getString(7), rs.getBoolean(8));
        }, settings.advisoryVersion(), userId).stream().findFirst();
    }

    /**
     * Điều kiện để bắt đầu Initial: đã có Safety Status còn hiệu lực. CLEARED hết hạn ⇒ phải sàng lọc lại; REVIEW_REQUIRED/RESTRICTED
     * hết hạn vẫn giữ ràng buộc (hạn chế không biến mất theo thời gian). Safety KHÔNG chặn Initial trừ khi policy đã publish liệt kê hành động này.
     */
    public View requireForInitial(long userId) {
        View v = current(userId).orElseThrow(() -> new IllegalStateException("SAFETY_SCREENING_REQUIRED: cần hoàn tất sàng lọc an toàn trước"));
        if (v.status() == Status.CLEARED && v.expired()) throw new IllegalStateException("SAFETY_SCREENING_REQUIRED: kết quả sàng lọc đã hết hạn");
        Boolean blocked = jdbc.queryForObject("""
                SELECT COALESCE(JSON_CONTAINS(blocked_actions, JSON_QUOTE('INITIAL_QUESTIONNAIRE')), 0) FROM safety_policies
                WHERE rule_set_id = ? AND status = ?""", Boolean.class, v.ruleSetId(), v.status().name());
        if (Boolean.TRUE.equals(blocked)) throw new IllegalStateException("ACTION_BLOCKED_BY_SAFETY_POLICY: INITIAL_QUESTIONNAIRE");
        return v;
    }

    static Timestamp ts(Instant i) { return Timestamp.from(i); }
}
