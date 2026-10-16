package com.calishealth.api.service.assessmentv2;

import com.calishealth.api.service.assessmentv2.TemplateMeta.OptionMeta;
import com.calishealth.api.service.assessmentv2.TemplateMeta.QuestionMeta;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Component;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.*;

/**
 * Truy cập dữ liệu dùng chung của khung assessment_* cho mọi loại phiên (INITIAL, SAFETY_SCREENING...):
 * không có bảng/chỗ riêng theo loại (Quyết định 3).
 */
@Component
public class AssessmentSessionStore {
    public record SessionRow(long id, long userId, String typeCode, String status, long templateId, int templateVersion, Long ruleSetId) {}

    private final JdbcTemplate jdbc;
    private final ObjectMapper json;
    private final AssessmentV2Settings settings;

    public AssessmentSessionStore(JdbcTemplate jdbc, ObjectMapper json, AssessmentV2Settings settings) {
        this.jdbc = jdbc; this.json = json; this.settings = settings;
    }

    // ---------------- template ----------------

    public TemplateMeta loadTemplate(String code) {
        Map<String, Object> t = jdbc.queryForMap("SELECT id, version, status, type FROM assessment_templates WHERE code = ?", code);
        String status = (String) t.get("status");
        if (!"PUBLISHED".equals(status) && !settings.allowDraft())
            throw new IllegalStateException("TEMPLATE_NOT_PUBLISHED: " + code + " đang " + status);
        long id = ((Number) t.get("id")).longValue();

        Map<Long, List<OptionMeta>> options = new HashMap<>();
        jdbc.query("""
                SELECT o.question_id, o.id, o.option_code, o.option_label, o.score, o.numeric_value, o.sort_order
                FROM assessment_question_options o JOIN assessment_template_questions tq ON tq.question_id = o.question_id
                WHERE tq.template_id = ? AND o.active = TRUE ORDER BY o.sort_order""", rch -> {
            options.computeIfAbsent(rch.getLong(1), k -> new ArrayList<>()).add(new OptionMeta(rch.getLong(2), rch.getString(3), rch.getString(4),
                    nd(rch.getBigDecimal(5)), nd(rch.getBigDecimal(6)), rch.getInt(7)));
        }, id);

        List<QuestionMeta> questions = new ArrayList<>();
        jdbc.query("""
                SELECT q.id, q.question_code, q.question_text, q.instruction, q.question_type, q.input_type, q.category, tq.required,
                       q.min_value, q.max_value, q.plausible_max, q.evidence_role, q.answer_kind, q.reliability_class, pl.code AS ladder_code,
                       q.config_json, tq.visibility_json, s.code AS section_code, COALESCE(s.title, tq.section_title), tq.sort_order
                FROM assessment_template_questions tq JOIN assessment_questions q ON q.id = tq.question_id
                LEFT JOIN assessment_sections s ON s.id = tq.section_id
                LEFT JOIN progression_ladders pl ON pl.id = q.ladder_id
                WHERE tq.template_id = ? ORDER BY tq.sort_order""", rch -> {
            long qid = rch.getLong(1);
            questions.add(new QuestionMeta(qid, rch.getString(2), rch.getString(3), rch.getString(4), rch.getString(5), rch.getString(6), rch.getString(7),
                    rch.getBoolean(8), nd(rch.getBigDecimal(9)), nd(rch.getBigDecimal(10)), nd(rch.getBigDecimal(11)), rch.getString(12), rch.getString(13),
                    rch.getString(14), rch.getString(15), tree(rch.getString(16)), tree(rch.getString(17)), rch.getString(18), rch.getString(19), rch.getInt(20),
                    options.getOrDefault(qid, List.of())));
        }, id);
        return new TemplateMeta(id, code, ((Number) t.get("version")).intValue(), status, (String) t.get("type"), questions);
    }

    // ---------------- session ----------------

    public long createSession(long userId, String typeCode, TemplateMeta template, Long ruleSetId, String purpose, String algorithmVersion, Instant expiresAt) {
        return createSession(userId, typeCode, template, ruleSetId, purpose, algorithmVersion, expiresAt, "SELF_REPORTED");
    }

    public long createSession(long userId, String typeCode, TemplateMeta template, Long ruleSetId, String purpose, String algorithmVersion, Instant expiresAt, String source) {
        GeneratedKeyHolder keys = new GeneratedKeyHolder();
        jdbc.update(con -> {
            PreparedStatement ps = con.prepareStatement("""
                    INSERT INTO assessment_sessions (user_id, assessment_type_id, started_at, status, version, created_at, template_id, template_version,
                        purpose, source, execution_mode, rule_set_id, algorithm_version, expires_at, current_step)
                    SELECT ?, t.id, ?, 'IN_PROGRESS', '2.0', ?, ?, ?, ?, ?, t.execution_mode, ?, ?, ?, 0
                    FROM assessment_types t WHERE t.code = ?""", Statement.RETURN_GENERATED_KEYS);
            Timestamp now = Timestamp.from(Instant.now());
            ps.setLong(1, userId); ps.setTimestamp(2, now); ps.setTimestamp(3, now); ps.setLong(4, template.id()); ps.setInt(5, template.version());
            ps.setString(6, purpose); ps.setString(7, source); if (ruleSetId == null) ps.setNull(8, java.sql.Types.BIGINT); else ps.setLong(8, ruleSetId);
            ps.setString(9, algorithmVersion); ps.setTimestamp(10, expiresAt == null ? null : Timestamp.from(expiresAt)); ps.setString(11, typeCode);
            return ps;
        }, keys);
        if (keys.getKey() == null) throw new IllegalStateException("Loại đánh giá chưa được seed: " + typeCode);
        return keys.getKey().longValue();
    }

    public Optional<SessionRow> find(long sessionId) {
        List<SessionRow> rows = jdbc.query("""
                SELECT s.id, s.user_id, t.code, s.status, s.template_id, s.template_version, s.rule_set_id
                FROM assessment_sessions s JOIN assessment_types t ON t.id = s.assessment_type_id WHERE s.id = ?""",
                (rs, i) -> new SessionRow(rs.getLong(1), rs.getLong(2), rs.getString(3), rs.getString(4), rs.getLong(5), rs.getInt(6),
                        rs.getObject(7) == null ? null : rs.getLong(7)), sessionId);
        return rows.stream().findFirst();
    }

    public Optional<Long> findInProgress(long userId, String typeCode, long templateId) {
        return jdbc.queryForList("""
                SELECT s.id FROM assessment_sessions s JOIN assessment_types t ON t.id = s.assessment_type_id
                WHERE s.user_id = ? AND t.code = ? AND s.template_id = ? AND s.status = 'IN_PROGRESS'
                  AND (s.expires_at IS NULL OR s.expires_at > ?) ORDER BY s.id DESC LIMIT 1""",
                Long.class, userId, typeCode, templateId, Timestamp.from(Instant.now())).stream().findFirst();
    }

    public void setStatus(long sessionId, String status) {
        jdbc.update("UPDATE assessment_sessions SET status = ? WHERE id = ?", status, sessionId);
    }

    // ---------------- answers ----------------

    /** Đáp án hiện có: lựa chọn đơn = String (mã option), số = Double, chọn nhiều = List<String>. */
    public Map<String, Object> loadAnswers(long sessionId) {
        Map<String, Object> out = new LinkedHashMap<>();
        jdbc.query("""
                SELECT q.question_code, q.question_type, r.answer_text, r.answer_number, r.answer_json
                FROM assessment_responses r JOIN assessment_questions q ON q.id = r.question_id WHERE r.assessment_session_id = ?""", rch -> {
            String type = rch.getString(2);
            switch (type) {
                case "NUMBER", "SCALE" -> { if (rch.getBigDecimal(4) != null) out.put(rch.getString(1), rch.getBigDecimal(4).doubleValue()); }
                case "MULTI_CHOICE" -> {
                    JsonNode n = tree(rch.getString(5));
                    List<String> list = new ArrayList<>();
                    if (n != null) n.forEach(x -> list.add(x.asString()));
                    out.put(rch.getString(1), list);
                }
                default -> { if (rch.getString(3) != null) out.put(rch.getString(1), rch.getString(3)); }
            }
        }, sessionId);
        return out;
    }

    public void upsertAnswer(long sessionId, QuestionMeta q, Object value) {
        Long optionId = null; String text = null; Double number = null; String arr = null;
        switch (q.questionType()) {
            case "NUMBER", "SCALE" -> number = ((Number) value).doubleValue();
            case "MULTI_CHOICE" -> arr = toJson(value);
            default -> { text = (String) value; optionId = q.option(text).map(OptionMeta::id).orElse(null); }
        }
        jdbc.update("""
                INSERT INTO assessment_responses (assessment_session_id, question_id, option_id, answer_text, answer_number, answer_json, created_at, evidence_role)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?) AS n
                ON DUPLICATE KEY UPDATE option_id = n.option_id, answer_text = n.answer_text, answer_number = n.answer_number,
                                        answer_json = n.answer_json, evidence_role = n.evidence_role""",
                sessionId, q.id(), optionId, text, number, arr, Timestamp.from(Instant.now()), q.evidenceRole());
    }

    public void deleteAnswers(long sessionId, Collection<Long> questionIds) {
        for (Long qid : questionIds) jdbc.update("DELETE FROM assessment_responses WHERE assessment_session_id = ? AND question_id = ?", sessionId, qid);
    }

    // ---------------- helpers ----------------

    private JsonNode tree(String s) {
        try { return s == null ? null : json.readTree(s); } catch (Exception e) { throw new IllegalStateException("JSON không hợp lệ trong cấu hình template", e); }
    }

    String toJson(Object o) {
        try { return json.writeValueAsString(o); } catch (Exception e) { throw new IllegalStateException(e); }
    }

    private static Double nd(java.math.BigDecimal d) { return d == null ? null : d.doubleValue(); }
}
