package com.calishealth.api.service.assessmentv2;

import com.calishealth.api.dto.RuleSetGovernanceDtos.*;
import com.calishealth.api.service.assessmentv2.RuleSetV2Validator.LevelSnap;
import com.calishealth.api.service.assessmentv2.RuleSetV2Validator.ReqSnap;
import com.calishealth.api.service.assessmentv2.RuleSetV2Validator.Snapshot;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.simple.SimpleJdbcInsert;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.*;

/**
 * Coach soạn rule set V2 (ASSESSMENT_FRAMEWORK_V2 §33): Coach clone → sửa bản DRAFT → gửi duyệt; ADMIN duyệt và kích hoạt (không cần Coach thứ hai).
 *  - Chỉ sửa tham số/ngưỡng level/yêu cầu level ĐÃ TỒN TẠI; mọi thay đổi được ghi (cũ → mới) và validator chạy lại trọn bộ khi lưu.
 *  - Gửi duyệt xong bản bất biến; Admin APPROVED ⇒ ghi review theo phạm vi bắt buộc rồi kích hoạt, CHANGES_REQUESTED ⇒ về DRAFT. Admin không tự duyệt bản mình soạn.
 *  - Kích hoạt lưu trữ bản ACTIVE cũ của cùng mã; phiên đánh giá cũ vẫn trỏ về rule set đã dùng (rule_set_id trong phiên).
 */
@Service
public class CoachRuleSetService {
    public static final String CODE = "LEVEL_ENGINE_V2";
    public static final String DRAFT = "DRAFT", PENDING_REVIEW = "PENDING_REVIEW", ACTIVE = "ACTIVE", ARCHIVED = "ARCHIVED";
    static final Set<String> SCOPES = Set.of("LADDER", "WEIGHTS", "LEVEL_REQUIREMENTS", "STICKY_FLAGS", "CLEARANCE_RULES", "SAFETY_POLICIES", "OTHER");

    private final JdbcTemplate jdbc;
    /** Tùy chọn: không có (vd. test dựng tay) thì chỉ không gửi thông báo, nghiệp vụ không đổi. */
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.calishealth.api.service.notification.NotificationService notifications;

    public CoachRuleSetService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    // ------------------------------------------------------------------ đọc

    public List<RuleSetSummary> list() {
        return jdbc.query(SUMMARY_SQL + " WHERE code = ? ORDER BY version DESC", (rs, i) -> summary(rs), CODE);
    }

    public RuleSetDetail detail(long id) {
        RuleSetSummary s = find(id);
        List<ParamView> params = jdbc.query("SELECT param_key, param_value, param_text, source_type, source_reference FROM engine_parameters WHERE rule_set_id = ? ORDER BY param_key",
                (rs, i) -> new ParamView(rs.getString(1), rs.getObject(2) == null ? null : rs.getDouble(2), rs.getString(3), rs.getString(4), rs.getString(5)), id);
        List<LevelView> levels = levels(id);
        List<ReviewView> reviews = jdbc.query("SELECT id, reviewer_id, scope_type, decision, notes, reviewed_at FROM rule_set_reviews WHERE rule_set_id = ? ORDER BY id",
                (rs, i) -> new ReviewView(rs.getLong(1), rs.getLong(2), rs.getString(3), rs.getString(4), rs.getString(5), rs.getTimestamp(6).toInstant()), id);
        List<ChangeView> changes = jdbc.query("SELECT id, actor_id, target_type, target_key, old_value, new_value, created_at FROM rule_set_changes WHERE rule_set_id = ? ORDER BY id",
                (rs, i) -> new ChangeView(rs.getLong(1), rs.getLong(2), rs.getString(3), rs.getString(4), rs.getString(5), rs.getString(6), rs.getTimestamp(7).toInstant()), id);
        return new RuleSetDetail(s, params, levels, reviews, changes, RuleSetV2Validator.validate(snapshot(id)), new ArrayList<>(requiredScopes(id)));
    }

    public List<String> validate(long id) { find(id); return RuleSetV2Validator.validate(snapshot(id)); }

    // ------------------------------------------------------------------ nhân bản

    @Transactional
    public RuleSetDetail clone(long coachId, long sourceId) {
        RuleSetSummary src = find(sourceId);
        int version = jdbc.queryForObject("SELECT MAX(version) FROM rule_sets WHERE code = ?", Integer.class, CODE) + 1;
        String email = jdbc.queryForObject("SELECT email FROM users WHERE id = ?", String.class, coachId);
        jdbc.update("INSERT INTO rule_sets (code, version, status, parent_id, notes, created_by, created_at, author_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                CODE, version, DRAFT, sourceId, "Bản sao từ v" + src.version(), email, Timestamp.from(Instant.now()), coachId);
        long id = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);

        copy("engine_parameters", "rule_set_id", sourceId, Map.of("rule_set_id", id));
        Map<Long, Long> levelMap = copy("fitness_levels", "rule_set_id", sourceId, Map.of("rule_set_id", id));
        levelMap.forEach((oldId, newId) -> copy("level_requirements", "level_id", oldId, Map.of("level_id", newId)));
        Map<Long, Long> ladderMap = copy("progression_ladders", "rule_set_id", sourceId, Map.of("rule_set_id", id));
        Map<Long, Long> stageMap = new HashMap<>();
        ladderMap.forEach((oldId, newId) -> stageMap.putAll(copy("progression_stages", "ladder_id", oldId, Map.of("ladder_id", newId))));
        stageMap.forEach((oldId, newId) -> {
            for (Map<String, Object> row : jdbc.queryForList("SELECT * FROM progression_stage_prerequisites WHERE stage_id = ?", oldId)) {
                row.remove("id");
                row.put("stage_id", newId);
                row.put("prerequisite_stage_id", stageMap.get(((Number) row.get("prerequisite_stage_id")).longValue()));
                new SimpleJdbcInsert(jdbc).withTableName("progression_stage_prerequisites").usingGeneratedKeyColumns("id").execute(row);
            }
        });
        for (String t : List.of("consistency_rules", "safety_flag_defs", "safety_rules", "safety_policies", "safety_clearance_rules"))
            copy(t, "rule_set_id", sourceId, Map.of("rule_set_id", id));
        for (Map<String, Object> row : jdbc.queryForList("SELECT * FROM safety_flag_constraints WHERE rule_set_id = ?", sourceId)) {   // không có cột id
            row.put("rule_set_id", id);
            new SimpleJdbcInsert(jdbc).withTableName("safety_flag_constraints").execute(row);
        }
        return detail(id);
    }

    /** Sao chép các dòng của một bảng (theo cột khoá cha), thay giá trị khoá bằng overrides; trả bản đồ id cũ → id mới. */
    private Map<Long, Long> copy(String table, String parentCol, long parentId, Map<String, Object> overrides) {
        Map<Long, Long> map = new LinkedHashMap<>();
        for (Map<String, Object> row : jdbc.queryForList("SELECT * FROM " + table + " WHERE " + parentCol + " = ? ORDER BY id", parentId)) {
            long oldId = ((Number) row.remove("id")).longValue();
            row.putAll(overrides);
            Number key = new SimpleJdbcInsert(jdbc).withTableName(table).usingGeneratedKeyColumns("id").executeAndReturnKey(row);
            map.put(oldId, key.longValue());
        }
        return map;
    }

    // ------------------------------------------------------------------ sửa (chỉ DRAFT, chỉ tác giả)

    @Transactional
    public RuleSetDetail update(long coachId, long id, UpdateRuleSetRequest req) {
        RuleSetSummary s = requireStatus(id, DRAFT, "RULESET_NOT_DRAFT: chỉ sửa được bản DRAFT - hãy clone để tạo phiên bản mới");
        claimOrCheckAuthor(coachId, s);
        Timestamp now = Timestamp.from(Instant.now());

        for (ParamUpdate u : orEmpty(req.params())) {
            Map<String, Object> row = jdbc.queryForList("SELECT param_value, param_text FROM engine_parameters WHERE rule_set_id = ? AND param_key = ?", id, u.key()).stream().findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Tham số không tồn tại (Coach chỉ sửa tham số engine đã đọc): " + u.key()));
            if (u.value() == null && u.text() == null) throw new IllegalArgumentException("Cần value hoặc text cho tham số " + u.key());
            String oldVal, newVal;
            if (u.value() != null) {
                if (row.get("param_value") == null) throw new IllegalArgumentException(u.key() + " là tham số dạng chữ: dùng text");
                oldVal = String.valueOf(((Number) row.get("param_value")).doubleValue()); newVal = String.valueOf(u.value());
                jdbc.update("UPDATE engine_parameters SET param_value = ? WHERE rule_set_id = ? AND param_key = ?", u.value(), id, u.key());
            } else {
                if (row.get("param_text") == null) throw new IllegalArgumentException(u.key() + " là tham số số: dùng value");
                oldVal = (String) row.get("param_text"); newVal = u.text();
                jdbc.update("UPDATE engine_parameters SET param_text = ? WHERE rule_set_id = ? AND param_key = ?", u.text(), id, u.key());
            }
            if (u.sourceType() != null) jdbc.update("UPDATE engine_parameters SET source_type = ? WHERE rule_set_id = ? AND param_key = ?", u.sourceType(), id, u.key());
            if (u.sourceReference() != null) jdbc.update("UPDATE engine_parameters SET source_reference = ? WHERE rule_set_id = ? AND param_key = ?", u.sourceReference(), id, u.key());
            log(id, coachId, "PARAM", u.key(), oldVal, newVal, now);
        }

        for (LevelUpdate u : orEmpty(req.levels())) {
            Map<String, Object> row = jdbc.queryForList("SELECT id, overall_promote_min, overall_regress_below, min_competency_confidence FROM fitness_levels WHERE rule_set_id = ? AND code = ?", id, u.code()).stream().findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Không có level " + u.code()));
            long levelId = ((Number) row.get("id")).longValue();
            if (u.promoteMin() != null) { logLevel(id, coachId, u.code(), "promote_min", row.get("overall_promote_min"), u.promoteMin(), now); jdbc.update("UPDATE fitness_levels SET overall_promote_min = ? WHERE id = ?", u.promoteMin(), levelId); }
            if (u.regressBelow() != null) { logLevel(id, coachId, u.code(), "regress_below", row.get("overall_regress_below"), u.regressBelow(), now); jdbc.update("UPDATE fitness_levels SET overall_regress_below = ? WHERE id = ?", u.regressBelow(), levelId); }
            if (u.minCompetencyConfidence() != null) { logLevel(id, coachId, u.code(), "min_competency_confidence", row.get("min_competency_confidence"), u.minCompetencyConfidence(), now); jdbc.update("UPDATE fitness_levels SET min_competency_confidence = ? WHERE id = ?", u.minCompetencyConfidence(), levelId); }
        }

        for (RequirementUpdate u : orEmpty(req.requirements())) {
            Map<String, Object> row = jdbc.queryForList("""
                    SELECT r.value, f.code, r.gate, r.competency_code FROM level_requirements r JOIN fitness_levels f ON f.id = r.level_id
                    WHERE r.id = ? AND f.rule_set_id = ?""", u.id(), id).stream().findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Yêu cầu level " + u.id() + " không thuộc rule set này"));
            if (u.value() == null) throw new IllegalArgumentException("Cần value cho yêu cầu " + u.id());
            log(id, coachId, "REQUIREMENT", row.get("code") + "." + row.get("gate") + "." + row.get("competency_code") + "#" + u.id(), String.valueOf(((Number) row.get("value")).doubleValue()), String.valueOf(u.value()), now);
            jdbc.update("UPDATE level_requirements SET value = ? WHERE id = ?", u.value(), u.id());
        }
        if (req.notes() != null) jdbc.update("UPDATE rule_sets SET notes = ? WHERE id = ?", req.notes(), id);
        if (req.displayName() != null) {
            String name = req.displayName().trim();
            if (name.length() > 120) throw new IllegalArgumentException("Tên hiển thị tối đa 120 ký tự");
            jdbc.update("UPDATE rule_sets SET display_name = ? WHERE id = ?", name.isEmpty() ? null : name, id);
        }

        List<String> errors = RuleSetV2Validator.validate(snapshot(id));
        if (!errors.isEmpty()) throw new IllegalArgumentException("RULESET_INVALID: " + String.join("; ", errors));   // hoàn tác toàn bộ yêu cầu
        return detail(id);
    }

    // ------------------------------------------------------------------ gửi duyệt (Coach) và phê duyệt + kích hoạt (Admin)

    /** Coach tác giả gửi duyệt: DRAFT → PENDING_REVIEW (bất biến cho tới khi Admin quyết định). Rule set do hệ thống tạo (author NULL): người gửi trở thành tác giả. */
    @Transactional
    public RuleSetDetail submit(long coachId, long id) {
        RuleSetSummary s = requireStatus(id, DRAFT, "RULESET_NOT_DRAFT: chỉ gửi duyệt được bản DRAFT");
        claimOrCheckAuthor(coachId, s);
        List<String> errors = RuleSetV2Validator.validate(snapshot(id));
        if (!errors.isEmpty()) throw new IllegalArgumentException("RULESET_INVALID: " + String.join("; ", errors));
        jdbc.update("UPDATE rule_sets SET status = ?, submitted_at = ? WHERE id = ?", PENDING_REVIEW, Timestamp.from(Instant.now()), id);
        if (notifications != null) notifications.notifyRole("ADMIN", "RULESET_V2_SUBMITTED", label(s) + " chờ duyệt",
                "Coach đã gửi bộ quy tắc đánh giá V2 phiên bản " + s.version() + " để duyệt và kích hoạt.", "RULESET_V2", id);
        return detail(id);
    }

    /**
     * Admin quyết định bản đang chờ duyệt. APPROVED: ghi review APPROVED cho từng phạm vi bắt buộc rồi kích hoạt ngay (bản ACTIVE cũ → ARCHIVED).
     * CHANGES_REQUESTED: bắt buộc có notes, trả về DRAFT để Coach sửa. Admin không được duyệt bản do chính mình soạn.
     */
    @Transactional
    public RuleSetDetail decide(long adminId, long id, DecisionRequest req) {
        RuleSetSummary s = requireStatus(id, PENDING_REVIEW, "RULESET_NOT_PENDING_REVIEW: rule set chưa được Coach gửi duyệt");
        String decision = req == null || req.decision() == null ? "" : req.decision().trim().toUpperCase(Locale.ROOT);
        if (!Set.of("APPROVED", "CHANGES_REQUESTED").contains(decision)) throw new IllegalArgumentException("decision phải là APPROVED | CHANGES_REQUESTED");
        if (s.authorId() != null && s.authorId() == adminId) throw new AccessDeniedException("Không được tự duyệt rule set do chính mình soạn");
        String notes = req.notes();
        Timestamp now = Timestamp.from(Instant.now());

        if ("CHANGES_REQUESTED".equals(decision)) {
            if (notes == null || notes.isBlank()) throw new IllegalArgumentException("NOTES_REQUIRED: cần ghi rõ Coach phải sửa gì");
            jdbc.update("INSERT INTO rule_set_reviews (rule_set_id, reviewer_id, scope_type, decision, notes, reviewed_at) VALUES (?, ?, 'OTHER', 'CHANGES_REQUESTED', ?, ?)", id, adminId, notes, now);
            jdbc.update("UPDATE rule_sets SET status = ?, submitted_at = NULL WHERE id = ?", DRAFT, id);
            if (notifications != null && s.authorId() != null) notifications.notifyUsers(List.of(s.authorId()), "RULESET_V2_CHANGES_REQUESTED",
                    label(s) + " cần chỉnh sửa", notes.trim(), "RULESET_V2", id);
            return detail(id);
        }
        List<String> errors = RuleSetV2Validator.validate(snapshot(id));
        if (!errors.isEmpty()) throw new IllegalArgumentException("RULESET_INVALID: " + String.join("; ", errors));
        for (String scope : requiredScopes(id))
            jdbc.update("INSERT INTO rule_set_reviews (rule_set_id, reviewer_id, scope_type, decision, notes, reviewed_at) VALUES (?, ?, ?, 'APPROVED', ?, ?)", id, adminId, scope, notes, now);
        jdbc.update("UPDATE rule_sets SET status = ? WHERE code = ? AND status = ? AND id <> ?", ARCHIVED, CODE, ACTIVE, id);
        jdbc.update("UPDATE rule_sets SET status = ?, activated_at = ? WHERE id = ?", ACTIVE, now, id);
        if (notifications != null && s.authorId() != null) notifications.notifyUsers(List.of(s.authorId()), "RULESET_V2_ACTIVATED",
                label(s) + " đã được áp dụng", "Admin đã duyệt và kích hoạt bộ quy tắc đánh giá V2 phiên bản " + s.version() + ".", "RULESET_V2", id);
        return detail(id);
    }

    public List<RuleSetSummary> listByStatus(String status) {
        return jdbc.query(SUMMARY_SQL + " WHERE code = ? AND status = ? ORDER BY submitted_at, version", (rs, i) -> summary(rs), CODE, status);
    }

    // ------------------------------------------------------------------ nội bộ

    /** Phạm vi Admin phê duyệt: lần kích hoạt ĐẦU của dòng rule set ⇒ tất cả (chưa từng có ai duyệt, nhất là phần an toàn); các lần sau ⇒ suy ra từ nhật ký thay đổi, không có thay đổi thì OTHER. */
    Set<String> requiredScopes(long id) {
        Integer activated = jdbc.queryForObject("SELECT COUNT(*) FROM rule_sets WHERE code = ? AND activated_at IS NOT NULL", Integer.class, CODE);
        if (activated == null || activated == 0) return new TreeSet<>(SCOPES);
        Set<String> scopes = new TreeSet<>();
        for (Map<String, Object> c : jdbc.queryForList("SELECT target_type, target_key FROM rule_set_changes WHERE rule_set_id = ?", id)) {
            String type = (String) c.get("target_type");
            scopes.add("PARAM".equals(type) ? RuleSetV2Validator.scopeOfParam((String) c.get("target_key")) : "LEVEL_REQUIREMENTS");
        }
        if (scopes.isEmpty()) scopes.add("OTHER");
        return scopes;
    }


    /** Rule set do hệ thống tạo (author NULL): Coach đầu tiên sửa trở thành tác giả; sau đó chỉ tác giả được sửa. */
    private void claimOrCheckAuthor(long coachId, RuleSetSummary s) {
        if (s.authorId() == null) jdbc.update("UPDATE rule_sets SET author_id = ? WHERE id = ?", coachId, s.id());
        else if (s.authorId() != coachId) throw new AccessDeniedException("Chỉ tác giả được sửa bản DRAFT này - hãy clone để soạn bản riêng");
    }

    private RuleSetSummary requireStatus(long id, String status, String message) {
        RuleSetSummary s = find(id);
        if (!status.equals(s.status())) throw new IllegalStateException(message + " (đang " + s.status() + ")");
        return s;
    }

    private void log(long ruleSetId, long actor, String type, String key, String oldVal, String newVal, Timestamp at) {
        jdbc.update("INSERT INTO rule_set_changes (rule_set_id, actor_id, target_type, target_key, old_value, new_value, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                ruleSetId, actor, type, key, oldVal, newVal, at);
    }

    private void logLevel(long ruleSetId, long actor, String level, String field, Object oldVal, double newVal, Timestamp at) {
        log(ruleSetId, actor, "LEVEL", level + "." + field, oldVal == null ? null : String.valueOf(((Number) oldVal).doubleValue()), String.valueOf(newVal), at);
    }

    /** Tên dùng trong thông báo: tên Coach đặt nếu có, kèm số phiên bản. */
    private static String label(RuleSetSummary s) {
        return s.displayName() == null || s.displayName().isBlank() ? "Bộ quy tắc V2 phiên bản " + s.version()
                : "Bộ quy tắc V2 “" + s.displayName() + "” (v" + s.version() + ")";
    }

    private static <T> List<T> orEmpty(List<T> l) { return l == null ? List.of() : l; }

    private static final String SUMMARY_SQL = "SELECT id, code, version, status, author_id, created_by, parent_id, created_at, submitted_at, activated_at, notes, display_name FROM rule_sets";

    private static RuleSetSummary summary(java.sql.ResultSet rs) throws java.sql.SQLException {
        Timestamp submitted = rs.getTimestamp(9), activated = rs.getTimestamp(10);
        return new RuleSetSummary(rs.getLong(1), rs.getString(2), rs.getInt(3), rs.getString(4), nullableLong(rs, 5), rs.getString(6), nullableLong(rs, 7),
                rs.getTimestamp(8).toInstant(), submitted == null ? null : submitted.toInstant(), activated == null ? null : activated.toInstant(), rs.getString(11), rs.getString(12));
    }

    private static Long nullableLong(java.sql.ResultSet rs, int col) throws java.sql.SQLException {
        Object o = rs.getObject(col);   // BIGINT UNSIGNED trả BigInteger
        return o == null ? null : ((Number) o).longValue();
    }

    private RuleSetSummary find(long id) {
        return jdbc.query(SUMMARY_SQL + " WHERE id = ? AND code = ?", (rs, i) -> summary(rs), id, CODE).stream().findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy rule set " + CODE + " #" + id));
    }

    private List<LevelView> levels(long id) {
        List<LevelView> out = new ArrayList<>();
        for (Map<String, Object> l : jdbc.queryForList("SELECT id, code, rank_no, name, overall_promote_min, overall_regress_below, min_competency_confidence FROM fitness_levels WHERE rule_set_id = ? ORDER BY rank_no", id)) {
            long levelId = ((Number) l.get("id")).longValue();
            List<RequirementView> reqs = jdbc.query("""
                    SELECT r.id, r.gate, r.competency_code, e.code, r.metric, r.operator, r.value, r.mandatory, r.source_type
                    FROM level_requirements r LEFT JOIN exercises e ON e.id = r.exercise_id WHERE r.level_id = ? ORDER BY r.id""",
                    (rs, i) -> new RequirementView(rs.getLong(1), rs.getString(2), rs.getString(3), rs.getString(4), rs.getString(5), rs.getString(6), rs.getDouble(7), rs.getBoolean(8), rs.getString(9)), levelId);
            out.add(new LevelView(levelId, (String) l.get("code"), ((Number) l.get("rank_no")).intValue(), (String) l.get("name"), ((Number) l.get("overall_promote_min")).doubleValue(),
                    ((Number) l.get("overall_regress_below")).doubleValue(), ((Number) l.get("min_competency_confidence")).doubleValue(), reqs));
        }
        return out;
    }

    private Snapshot snapshot(long id) {
        Map<String, Double> params = new HashMap<>();
        Map<String, String> text = new HashMap<>();
        jdbc.query("SELECT param_key, param_value, param_text FROM engine_parameters WHERE rule_set_id = ?", rch -> {
            if (rch.getObject(2) != null) params.put(rch.getString(1), rch.getDouble(2));
            if (rch.getString(3) != null) text.put(rch.getString(1), rch.getString(3));
        }, id);
        Set<String> required = new HashSet<>(jdbc.queryForList("SELECT param_key FROM engine_parameters WHERE rule_set_id = (SELECT id FROM rule_sets WHERE code = ? ORDER BY version LIMIT 1)", String.class, CODE));
        List<LevelSnap> levels = new ArrayList<>();
        for (LevelView l : levels(id))
            levels.add(new LevelSnap(l.code(), l.rank(), l.promoteMin(), l.regressBelow(),
                    l.requirements().stream().map(r -> new ReqSnap(r.gate(), r.competency(), r.metric(), r.value())).toList()));
        return new Snapshot(params, text, levels, required);
    }
}
