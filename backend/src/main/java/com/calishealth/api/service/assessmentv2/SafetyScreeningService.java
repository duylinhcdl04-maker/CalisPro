package com.calishealth.api.service.assessmentv2;

import com.calishealth.api.dto.AssessmentV2Dtos.*;
import com.calishealth.api.safety.SafetyEvaluator;
import com.calishealth.api.safety.SafetyModels.*;
import com.calishealth.api.service.assessmentv2.AssessmentSessionStore.SessionRow;
import com.calishealth.api.service.assessmentv2.SafetyStatusService.View;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.time.Duration;
import java.time.Instant;
import java.util.*;

/**
 * Phiên SAFETY_SCREENING (dùng chung khung assessment_*) → Safety Status + ràng buộc (miền Safety).
 * KHÔNG tạo điểm, KHÔNG đổi level (I3). Acknowledgement/clearance nằm ở giai đoạn sau.
 */
@Service
public class SafetyScreeningService {
    static final String TYPE = "SAFETY_SCREENING";

    private final AssessmentSessionStore store;
    private final AnswerSupport answers;
    private final SafetyStatusService statusService;
    private final RuleSetV2Loader ruleSets;
    private final AssessmentV2Settings settings;
    private final JdbcTemplate jdbc;
    private final ObjectMapper json;
    private final SafetyEvaluator evaluator = new SafetyEvaluator();

    public SafetyScreeningService(AssessmentSessionStore store, AnswerSupport answers, SafetyStatusService statusService, RuleSetV2Loader ruleSets,
                                  AssessmentV2Settings settings, JdbcTemplate jdbc, ObjectMapper json) {
        this.store = store; this.answers = answers; this.statusService = statusService; this.ruleSets = ruleSets;
        this.settings = settings; this.jdbc = jdbc; this.json = json;
    }

    public StartResponse start(long userId) {
        RuleSetV2 rs = ruleSets.loadConfigured();
        TemplateMeta t = store.loadTemplate(settings.safetyTemplateCode());
        Optional<Long> open = store.findInProgress(userId, TYPE, t.id());
        if (open.isPresent()) return new StartResponse(open.get(), t.code(), t.version(), true);
        long id = store.createSession(userId, TYPE, t, rs.id(), "SAFETY_V2", "SAFETY_ENGINE_V1",
                Instant.now().plus(Duration.ofDays(settings.sessionExpiryDays())));
        return new StartResponse(id, t.code(), t.version(), false);
    }

    public QuestionsResponse questions(long userId, long sessionId) {
        SessionRow s = own(userId, sessionId);
        TemplateMeta t = store.loadTemplate(settings.safetyTemplateCode());
        Map<String, Object> a = store.loadAnswers(s.id());
        return new QuestionsResponse(s.id(), t.questions().stream().map(InitialAssessmentV2Service::toDto).toList(), a);
    }

    public SaveAnswersResponse saveAnswers(long userId, long sessionId, List<AnswerDto> incoming) {
        SessionRow s = own(userId, sessionId);
        TemplateMeta t = store.loadTemplate(settings.safetyTemplateCode());
        Map<String, Object> map = new LinkedHashMap<>();
        incoming.forEach(a -> map.put(a.questionCode(), a.value()));
        AnswerSupport.SaveResult r = answers.save(s, t, null, map);
        return new SaveAnswersResponse(r.visible(), r.removed(), r.answered(), r.requiredRemaining());
    }

    @Transactional
    public SafetyStatusDto complete(long userId, long sessionId) {
        SessionRow s = own(userId, sessionId);
        if ("COMPLETED".equals(s.status())) return toDto(statusService.current(userId).orElseThrow());
        if (!"IN_PROGRESS".equals(s.status())) throw new IllegalStateException("Phiên không ở trạng thái hoàn tất được: " + s.status());

        TemplateMeta t = store.loadTemplate(settings.safetyTemplateCode());
        Map<String, Object> given = store.loadAnswers(s.id());
        List<String> missing = answers.missingRequired(t, null, given);
        if (!missing.isEmpty()) throw new IllegalArgumentException("ASSESSMENT_INCOMPLETE: thiếu " + missing);

        long ruleSetId = s.ruleSetId();
        List<SafetyRule> rules = new ArrayList<>();
        jdbc.query("""
                SELECT q.question_code, r.condition_json, r.flag_code, r.severity FROM safety_rules r
                JOIN assessment_questions q ON q.id = r.question_id WHERE r.rule_set_id = ?""", rch -> {
            JsonNode c = json.readTree(rch.getString(2));
            rules.add(new SafetyRule(rch.getString(1), c.get("op").asString(), c.get("value").asString(), rch.getString(3), Severity.valueOf(rch.getString(4))));
        }, ruleSetId);
        List<FlagDef> defs = jdbc.query("SELECT code, sticky FROM safety_flag_defs WHERE rule_set_id = ?", (rs, i) -> new FlagDef(rs.getString(1), rs.getBoolean(2)), ruleSetId);
        Map<String, Set<String>> flagConstraints = new HashMap<>();
        jdbc.query("SELECT flag_code, constraint_code FROM safety_flag_constraints WHERE rule_set_id = ?",
                rch -> { flagConstraints.computeIfAbsent(rch.getString(1), k -> new TreeSet<>()).add(rch.getString(2)); }, ruleSetId);
        Map<Status, Policy> policies = new EnumMap<>(Status.class);
        Map<Status, Integer> validity = new EnumMap<>(Status.class);
        jdbc.query("SELECT status, requires_clearance_to_leave, validity_days FROM safety_policies WHERE rule_set_id = ?", rch -> {
            Status st = Status.valueOf(rch.getString(1));
            policies.put(st, new Policy(st, rch.getBoolean(2)));
            validity.put(st, rch.getInt(3));
        }, ruleSetId);

        Map<String, Set<String>> answerSets = new HashMap<>();
        given.forEach((k, v) -> {
            if (v instanceof String str) answerSets.put(k, Set.of(str));
            else if (v instanceof Collection<?> c) answerSets.put(k, new HashSet<>(c.stream().map(String::valueOf).toList()));
        });

        Optional<View> prev = statusService.current(userId);
        // Ràng buộc "giữ lại" bởi một clearance trước đó (không do cờ nào sinh ra) phải sống qua lần sàng lọc lại
        PreviousSafety previous = prev.map(v -> {
            Set<String> retained = new TreeSet<>(v.constraints());
            v.activeFlags().forEach(f -> retained.removeAll(flagConstraints.getOrDefault(f.code(), Set.of())));
            return new PreviousSafety(v.status(), v.activeFlags(), retained);
        }).orElse(null);
        Evaluation ev = evaluator.evaluate(rules, defs, flagConstraints, answerSets, previous, policies);

        Integer days = validity.get(ev.status());
        if (days == null) throw new IllegalStateException("safety_policies thiếu status " + ev.status());
        Instant until = Instant.now().plus(Duration.ofDays(days));

        prev.ifPresent(v -> jdbc.update("UPDATE user_safety_status SET is_current = FALSE WHERE id = ?", v.id()));
        jdbc.update("""
                INSERT INTO user_safety_status (user_id, session_id, origin, status, clearance_method, active_flags_json, constraints_json, valid_until,
                    is_current, supersedes_id, rule_set_id, created_at) VALUES (?, ?, 'SCREENING', ?, 'NONE', ?, ?, ?, TRUE, ?, ?, ?)""",
                userId, s.id(), ev.status().name(), flagsJson(ev.activeFlags()), toJson(ev.constraints()), SafetyStatusService.ts(until),
                prev.map(View::id).orElse(null), ruleSetId, SafetyStatusService.ts(Instant.now()));
        long statusId = jdbc.queryForObject("SELECT id FROM user_safety_status WHERE user_id = ? AND is_current = TRUE ORDER BY id DESC LIMIT 1", Long.class, userId);
        for (FlagEvent e : ev.events())
            jdbc.update("INSERT INTO user_safety_flags (user_id, flag_code, event, sticky, safety_status_id, rule_set_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    userId, e.flag(), e.event(), e.sticky(), statusId, ruleSetId, SafetyStatusService.ts(Instant.now()));

        jdbc.update("UPDATE assessment_sessions SET status = 'COMPLETED', completed_at = ?, rule_set_id = ? WHERE id = ?",
                SafetyStatusService.ts(Instant.now()), ruleSetId, s.id());
        jdbc.update("""
                UPDATE assessment_sessions x JOIN assessment_types t ON t.id = x.assessment_type_id
                SET x.status = 'SUPERSEDED' WHERE x.user_id = ? AND t.code = ? AND x.status = 'COMPLETED' AND x.id <> ?""", userId, TYPE, s.id());
        return toDto(statusService.current(userId).orElseThrow());
    }

    private SessionRow own(long userId, long sessionId) {
        SessionRow s = store.find(sessionId).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phiên " + sessionId));
        if (s.userId() != userId || !TYPE.equals(s.typeCode())) throw new IllegalArgumentException("Không tìm thấy phiên " + sessionId);
        return s;
    }

    public static SafetyStatusDto toDto(View v) {
        return new SafetyStatusDto(v.status().name(), v.validUntil(), v.expired(),
                v.activeFlags().stream().map(f -> new ActiveFlagDto(f.code(), f.sticky(), f.severity().name())).toList(), v.constraints(),
                v.clearanceMethod(), v.acknowledged());
    }

    private String flagsJson(List<ActiveFlag> flags) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (ActiveFlag f : flags) out.add(Map.of("code", f.code(), "sticky", f.sticky(), "severity", f.severity().name()));
        return toJson(out);
    }

    private String toJson(Object o) { return json.writeValueAsString(o); }
}
