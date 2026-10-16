package com.calishealth.api.service.assessmentv2;

import com.calishealth.api.dto.AssessmentV2Dtos.*;
import com.calishealth.api.safety.ClearanceEvaluator;
import com.calishealth.api.safety.SafetyModels.*;
import com.calishealth.api.service.assessmentv2.SafetyConfigLoader.Config;
import com.calishealth.api.service.assessmentv2.SafetyStatusService.View;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

/**
 * Acknowledgement và Clearance - HAI khái niệm tách biệt (ASSESSMENT_FRAMEWORK_V2 §3.5):
 *  - acknowledge: ghi nhận "đã đọc" khuyến nghị; KHÔNG đổi status, cờ, ràng buộc hay clearance_method (I12).
 *  - clearance: chỉ đổi status khi một clearance rule đã publish được thoả (I13); luôn tạo dòng status MỚI (append-only);
 *    cờ sticky chỉ gỡ bằng COACH_VERIFIED (I14). SELF_ATTESTED không có rule ⇒ bị từ chối.
 */
@Service
public class SafetyClearanceService {
    private final JdbcTemplate jdbc;
    private final ObjectMapper json;
    private final SafetyStatusService status;
    private final SafetyConfigLoader configs;
    private final RuleSetV2Loader ruleSets;
    private final AssessmentV2Settings settings;
    private final ClearanceEvaluator evaluator = new ClearanceEvaluator();

    public SafetyClearanceService(JdbcTemplate jdbc, ObjectMapper json, SafetyStatusService status, SafetyConfigLoader configs,
                                  RuleSetV2Loader ruleSets, AssessmentV2Settings settings) {
        this.jdbc = jdbc; this.json = json; this.status = status; this.configs = configs; this.ruleSets = ruleSets; this.settings = settings;
    }

    // ------------------------------------------------------------------ acknowledgement

    @Transactional
    public AcknowledgementDto acknowledge(long userId, String advisoryVersion) {
        View v = status.current(userId).orElseThrow(() -> new IllegalArgumentException("Chưa có kết quả sàng lọc an toàn"));
        if (v.status() == Status.CLEARED) throw new IllegalArgumentException("NOTHING_TO_ACKNOWLEDGE: trạng thái CLEARED không có khuyến nghị cần xác nhận");
        String version = advisoryVersion == null || advisoryVersion.isBlank() ? settings.advisoryVersion() : advisoryVersion;
        if (!version.equals(settings.advisoryVersion())) throw new IllegalArgumentException("Phiên bản khuyến cáo không còn hiệu lực: " + version);
        jdbc.update("INSERT IGNORE INTO safety_acknowledgements (user_id, safety_status_id, advisory_version, acknowledged_at) VALUES (?, ?, ?, ?)",
                userId, v.id(), version, Timestamp.from(Instant.now()));
        Timestamp at = jdbc.queryForObject("SELECT acknowledged_at FROM safety_acknowledgements WHERE safety_status_id = ? AND advisory_version = ?",
                Timestamp.class, v.id(), version);
        // status/ràng buộc/clearance_method giữ NGUYÊN: không có UPDATE nào lên user_safety_status ở đây
        return new AcknowledgementDto(version, at.toInstant(), v.status().name());
    }

    // ------------------------------------------------------------------ yêu cầu clearance của user

    @Transactional
    public ClearanceDto request(long userId, ClearanceRequestDto req) {
        View cur = status.current(userId).orElseThrow(() -> new IllegalArgumentException("Chưa có kết quả sàng lọc an toàn"));
        if (cur.status() == Status.CLEARED) throw new IllegalArgumentException("NOTHING_TO_CLEAR: trạng thái đã là CLEARED");
        ClearanceMethod method = parseMethod(req.method());
        if (method == ClearanceMethod.SELF_ATTESTED && (req.attestationTextVersion() == null || req.attestationTextVersion().isBlank()))
            throw new IllegalArgumentException("SELF_ATTESTED cần phiên bản văn bản cam kết");

        Config cfg = configs.load(ruleSets.configuredId());
        ClearanceDecision d = evaluator.evaluate(cur.status(), cur.activeFlags(), method, cfg.clearanceRules());
        if (!d.granted()) throw new IllegalArgumentException("CLEARANCE_METHOD_NOT_ALLOWED: " + method + " không được phép cho trạng thái " + cur.status());

        if (method == ClearanceMethod.COACH_VERIFIED) {
            List<Long> open = jdbc.queryForList("SELECT id FROM safety_clearances WHERE user_id = ? AND safety_status_id = ? AND method = 'COACH_VERIFIED' AND status IN ('REQUESTED','UNDER_REVIEW')",
                    Long.class, userId, cur.id());
            if (!open.isEmpty()) return get(open.get(0));
            jdbc.update("INSERT INTO safety_clearances (user_id, safety_status_id, method, status, evidence_ref, requested_at) VALUES (?, ?, 'COACH_VERIFIED', 'REQUESTED', ?, ?)",
                    userId, cur.id(), req.evidenceRef(), Timestamp.from(Instant.now()));
            return get(jdbc.queryForObject("SELECT MAX(id) FROM safety_clearances WHERE user_id = ?", Long.class, userId));
        }

        // SELF_ATTESTED + có rule publish khớp: quyết định tức thì bởi SYSTEM_RULE
        jdbc.update("""
                INSERT INTO safety_clearances (user_id, safety_status_id, method, status, rule_id, decided_by_type, attestation_text_version, requested_at, reviewed_at,
                    resulting_status, removed_flags_json) VALUES (?, ?, 'SELF_ATTESTED', 'GRANTED', ?, 'SYSTEM_RULE', ?, ?, ?, ?, ?)""",
                userId, cur.id(), d.ruleId(), req.attestationTextVersion(), Timestamp.from(Instant.now()), Timestamp.from(Instant.now()),
                d.resultingStatus().name(), toJson(d.removedFlags()));
        long id = jdbc.queryForObject("SELECT MAX(id) FROM safety_clearances WHERE user_id = ?", Long.class, userId);
        apply(userId, cur, cfg, id, ClearanceMethod.SELF_ATTESTED, d, Set.of());
        return get(id);
    }

    public List<ClearanceDto> mine(long userId) {
        return jdbc.query(SELECT + " WHERE c.user_id = ? ORDER BY c.id DESC", (rs, i) -> map(rs), userId);
    }

    // ------------------------------------------------------------------ Coach/Admin

    public List<ClearanceDto> queue(String statusFilter) {
        String st = statusFilter == null || statusFilter.isBlank() ? "REQUESTED" : statusFilter;
        return jdbc.query(SELECT + " WHERE c.status = ? ORDER BY c.id", (rs, i) -> map(rs), st);
    }

    /**
     * Chi tiết một yêu cầu cho Coach. Chỉ cho xem khi yêu cầu còn là COACH_VERIFIED; options = kết quả mà clearance rule COACH_VERIFIED cho phép từ status hiện tại
     * (cùng bộ lọc với decide, nên Coach không thể chọn kết quả sẽ bị từ chối). RESTRICTED chỉ Coach (không phải Admin) được quyết định.
     */
    public ClearanceDetailDto detail(boolean reviewerIsCoach, long clearanceId) {
        ClearanceDto c = jdbc.query(SELECT + " WHERE c.id = ?", (rs, i) -> map(rs), clearanceId).stream().findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy yêu cầu clearance " + clearanceId));
        String name = jdbc.queryForList("SELECT TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))) FROM user_profiles WHERE user_id = ?", String.class, c.userId())
                .stream().filter(n -> n != null && !n.isBlank()).findFirst().orElse(null);
        long statusId = jdbc.queryForObject("SELECT safety_status_id FROM safety_clearances WHERE id = ?", Long.class, clearanceId);
        Optional<View> cur = status.current(c.userId());
        if (cur.isEmpty()) return new ClearanceDetailDto(c, name, null, true, null, List.of(), Set.of(), Set.of(), false, false, List.of());
        View v = cur.get();
        boolean stale = v.id() != statusId;
        Config cfg = configs.load(ruleSets.configuredId());
        List<ResultingOptionDto> options = new ArrayList<>();
        for (ClearanceRule r : cfg.clearanceRules()) {
            if (r.method() != ClearanceMethod.COACH_VERIFIED) continue;
            ClearanceDecision d = evaluator.evaluate(v.status(), v.activeFlags(), ClearanceMethod.COACH_VERIFIED, List.of(r));
            if (d.granted() && options.stream().noneMatch(o -> o.resultingStatus().equals(d.resultingStatus().name())))
                options.add(new ResultingOptionDto(d.resultingStatus().name(), r.allowRetainedConstraints()));
        }
        boolean open = List.of("REQUESTED", "UNDER_REVIEW").contains(c.status()) && "COACH_VERIFIED".equals(c.method());
        boolean canDecide = open && !stale && !options.isEmpty() && (v.status() != Status.RESTRICTED || reviewerIsCoach);
        List<ActiveFlagDto> flags = v.activeFlags().stream().map(f -> new ActiveFlagDto(f.code(), f.sticky(), f.severity().name())).toList();
        return new ClearanceDetailDto(c, name, v.status().name(), stale, v.validUntil(), flags, v.constraints(), v.constraints(), v.acknowledged(), canDecide, options);
    }

    @Transactional
    public ClearanceDto decide(long reviewerId, boolean reviewerIsCoach, long clearanceId, ClearanceDecisionRequest req) {
        Map<String, Object> row = jdbc.queryForList("SELECT user_id, safety_status_id, method, status FROM safety_clearances WHERE id = ?", clearanceId).stream().findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy yêu cầu clearance " + clearanceId));
        if (!List.of("REQUESTED", "UNDER_REVIEW").contains(row.get("status"))) throw new IllegalStateException("Yêu cầu đã được xử lý: " + row.get("status"));
        if (!"COACH_VERIFIED".equals(row.get("method"))) throw new IllegalStateException("Chỉ yêu cầu COACH_VERIFIED mới cần người duyệt");
        long userId = ((Number) row.get("user_id")).longValue();

        View cur = status.current(userId).orElseThrow(() -> new IllegalStateException("STALE_REQUEST: không còn trạng thái an toàn hiện hành"));
        if (cur.id() != ((Number) row.get("safety_status_id")).longValue())
            throw new IllegalStateException("STALE_REQUEST: trạng thái an toàn đã thay đổi kể từ khi gửi yêu cầu - cần gửi lại");
        if (cur.status() == Status.RESTRICTED && !reviewerIsCoach) throw new AccessDeniedException("Gỡ RESTRICTED chỉ do Coach xác minh");

        String decision = req.decision() == null ? "" : req.decision().toUpperCase();
        if (decision.equals("REJECTED")) {
            if (req.note() == null || req.note().isBlank()) throw new IllegalArgumentException("Từ chối phải kèm lý do");
            jdbc.update("UPDATE safety_clearances SET status = 'REJECTED', decided_by_type = 'REVIEWER', reviewed_by = ?, reviewed_at = ?, decision_note = ? WHERE id = ?",
                    reviewerId, Timestamp.from(Instant.now()), req.note(), clearanceId);
            return get(clearanceId);                                   // status/ràng buộc giữ nguyên
        }
        if (!decision.equals("GRANTED")) throw new IllegalArgumentException("decision phải là GRANTED hoặc REJECTED");

        Config cfg = configs.load(ruleSets.configuredId());
        Status wanted = req.resultingStatus() == null ? null : Status.valueOf(req.resultingStatus());
        List<ClearanceRule> candidates = cfg.clearanceRules().stream().filter(r -> wanted == null || r.resultingStatus() == wanted).toList();
        ClearanceDecision d = evaluator.evaluate(cur.status(), cur.activeFlags(), ClearanceMethod.COACH_VERIFIED, candidates);
        if (!d.granted()) throw new IllegalArgumentException("CLEARANCE_METHOD_NOT_ALLOWED: không có clearance rule cho " + cur.status() + " → " + wanted);

        Set<String> retained = req.retainedConstraints() == null ? Set.of() : new TreeSet<>(req.retainedConstraints());
        ClearanceRule rule = cfg.clearanceRules().stream().filter(r -> r.id() == d.ruleId()).findFirst().orElseThrow();
        if (!retained.isEmpty() && !rule.allowRetainedConstraints()) throw new IllegalArgumentException("Rule này không cho giữ lại ràng buộc");
        for (String c : retained) if (!cfg.constraintCodes().contains(c)) throw new IllegalArgumentException("Ràng buộc không tồn tại: " + c);

        jdbc.update("""
                UPDATE safety_clearances SET status = 'GRANTED', rule_id = ?, decided_by_type = 'REVIEWER', reviewed_by = ?, reviewed_at = ?, decision_note = ?,
                    resulting_status = ?, removed_flags_json = ?, retained_constraints_json = ? WHERE id = ?""",
                d.ruleId(), reviewerId, Timestamp.from(Instant.now()), req.note(), d.resultingStatus().name(), toJson(d.removedFlags()), toJson(retained), clearanceId);
        apply(userId, cur, cfg, clearanceId, ClearanceMethod.COACH_VERIFIED, d, retained);
        return get(clearanceId);
    }

    // ------------------------------------------------------------------ áp dụng clearance: dòng status MỚI, dòng cũ bất biến

    private void apply(long userId, View cur, Config cfg, long clearanceId, ClearanceMethod method, ClearanceDecision d, Set<String> retained) {
        List<ActiveFlag> remaining = cur.activeFlags().stream().filter(f -> !d.removedFlags().contains(f.code())).toList();

        Set<String> constraints = new TreeSet<>(retained);
        Set<String> previouslyRetained = new TreeSet<>(cur.constraints());                                  // ràng buộc giữ lại từ clearance trước
        cur.activeFlags().forEach(f -> previouslyRetained.removeAll(cfg.flagConstraints().getOrDefault(f.code(), Set.of())));
        constraints.addAll(previouslyRetained);
        remaining.forEach(f -> constraints.addAll(cfg.flagConstraints().getOrDefault(f.code(), Set.of())));

        Integer days = cfg.validityDays().get(d.resultingStatus());
        if (days == null) throw new IllegalStateException("safety_policies thiếu status " + d.resultingStatus());
        Instant now = Instant.now();

        jdbc.update("UPDATE user_safety_status SET is_current = FALSE WHERE id = ?", cur.id());
        jdbc.update("""
                INSERT INTO user_safety_status (user_id, session_id, origin, status, clearance_method, active_flags_json, constraints_json, clearance_id, valid_until,
                    is_current, supersedes_id, rule_set_id, created_at) VALUES (?, NULL, 'CLEARANCE', ?, ?, ?, ?, ?, ?, TRUE, ?, ?, ?)""",
                userId, d.resultingStatus().name(), method.name(), flagsJson(remaining), toJson(constraints), clearanceId,
                Timestamp.from(now.plus(Duration.ofDays(days))), cur.id(), cfg.ruleSetId(), Timestamp.from(now));
        long newId = jdbc.queryForObject("SELECT MAX(id) FROM user_safety_status WHERE user_id = ?", Long.class, userId);
        for (ActiveFlag f : cur.activeFlags())
            if (d.removedFlags().contains(f.code()))
                jdbc.update("INSERT INTO user_safety_flags (user_id, flag_code, event, sticky, safety_status_id, clearance_id, rule_set_id, created_at) VALUES (?, ?, 'DEACTIVATED_BY_CLEARANCE', ?, ?, ?, ?, ?)",
                        userId, f.code(), f.sticky(), newId, clearanceId, cfg.ruleSetId(), Timestamp.from(now));
    }

    // ------------------------------------------------------------------ helpers

    private static final String SELECT = """
            SELECT c.id, c.user_id, c.method, c.status, c.decided_by_type, c.resulting_status, c.requested_at, c.reviewed_at, c.decision_note, c.evidence_ref, c.removed_flags_json
            FROM safety_clearances c""";

    private ClearanceDto get(long id) {
        return jdbc.query(SELECT + " WHERE c.id = ?", (rs, i) -> map(rs), id).stream().findFirst().orElseThrow();
    }

    private ClearanceDto map(java.sql.ResultSet rs) throws java.sql.SQLException {
        Set<String> removed = new TreeSet<>();
        if (rs.getString(11) != null) json.readTree(rs.getString(11)).forEach(n -> removed.add(n.asString()));
        Timestamp rev = rs.getTimestamp(8);
        return new ClearanceDto(rs.getLong(1), rs.getLong(2), rs.getString(3), rs.getString(4), rs.getString(5), rs.getString(6),
                rs.getTimestamp(7).toInstant(), rev == null ? null : rev.toInstant(), rs.getString(9), rs.getString(10), removed);
    }

    private static ClearanceMethod parseMethod(String m) {
        try { return ClearanceMethod.valueOf(m == null ? "" : m.toUpperCase()); }
        catch (IllegalArgumentException e) { throw new IllegalArgumentException("method phải là SELF_ATTESTED hoặc COACH_VERIFIED"); }
    }

    private String flagsJson(List<ActiveFlag> flags) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (ActiveFlag f : flags) out.add(Map.of("code", f.code(), "sticky", f.sticky(), "severity", f.severity().name()));
        return toJson(out);
    }

    private String toJson(Object o) { return json.writeValueAsString(o); }
}
