package com.calishealth.api.service.assessmentv2;

import com.calishealth.api.dto.AssessmentV2Dtos.*;
import com.calishealth.api.engine.v2.competency.CompetencyScoringEngine.CompetencyScore;
import com.calishealth.api.engine.v2.consistency.ConsistencyChecker;
import com.calishealth.api.engine.v2.level.LevelModelsV2.InitialResult;
import com.calishealth.api.engine.v2.progression.ProgressionModels.LadderResult;
import com.calishealth.api.service.assessmentv2.AssessmentSessionStore.SessionRow;
import com.calishealth.api.service.assessmentv2.InitialPipeline.InitialComputation;
import com.calishealth.api.service.assessmentv2.TemplateMeta.QuestionMeta;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

/**
 * Initial Assessment V2: bảng câu hỏi tự khai báo → level TẠM THỜI (tối đa L2). Dùng khung assessment_* chung.
 * Kết quả (kể cả quyết định level) lưu ở assessment_results/evidence/...; CHƯA ghi level_evaluations/user_level_state/user_competency_scores
 * của Level Engine v1 - việc nối vào đó thuộc bước kích hoạt V2 (tránh làm v1 thấy dữ liệu V2).
 */
@Service
public class InitialAssessmentV2Service {
    /** Có khi V2 chạy thật (V2LevelBridge); test dựng tay thì null. */
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private V2LevelBridge bridge;

    static final String TYPE = "INITIAL", PURPOSE = "INITIAL_V2", ALGORITHM = "INITIAL_V2/LEVEL_ENGINE_V2";

    private final AssessmentSessionStore store;
    private final AnswerSupport answers;
    private final SafetyStatusService safety;
    private final RuleSetV2Loader ruleSets;
    private final AssessmentV2Settings settings;
    private final JdbcTemplate jdbc;
    private final ObjectMapper json;
    private final InitialPipeline pipeline = new InitialPipeline();
    private final VisibilityEvaluator visibility = new VisibilityEvaluator();

    public InitialAssessmentV2Service(AssessmentSessionStore store, AnswerSupport answers, SafetyStatusService safety, RuleSetV2Loader ruleSets,
                                      AssessmentV2Settings settings, JdbcTemplate jdbc, ObjectMapper json) {
        this.store = store; this.answers = answers; this.safety = safety; this.ruleSets = ruleSets; this.settings = settings; this.jdbc = jdbc; this.json = json;
    }

    // ------------------------------------------------------------------ start / questions / answers

    public StartResponse start(long userId) {
        RuleSetV2 rs = ruleSets.loadConfigured();
        safety.requireForInitial(userId);
        List<String> verified = jdbc.queryForList("SELECT status FROM user_level_state WHERE user_id = ? AND status = 'VERIFIED'", String.class, userId);
        if (!verified.isEmpty()) throw new IllegalStateException("INITIAL_ALREADY_VERIFIED: level đã được xác minh bằng đo thực hành, không làm lại bài tự khai báo");

        // Khảo sát chỉ để PHÂN LOẠI level và chỉ làm một lần: đã có kết quả thì không mở lại. Level được cập nhật bằng bài đo thực hành rồi đo định kỳ.
        Boolean done = jdbc.queryForObject("SELECT EXISTS (SELECT 1 FROM assessment_sessions WHERE user_id = ? AND purpose = ? AND status = 'COMPLETED')", Boolean.class, userId, PURPOSE);
        if (Boolean.TRUE.equals(done)) throw new IllegalStateException("INITIAL_ALREADY_DONE: bạn đã làm khảo sát năng lực, bài này chỉ để phân loại level nên không làm lại. Hãy đo thực hành để xác nhận level.");
        TemplateMeta t = store.loadTemplate(settings.initialTemplateCode());
        Optional<Long> open = store.findInProgress(userId, TYPE, t.id());
        if (open.isPresent()) return new StartResponse(open.get(), t.code(), t.version(), true);
        long id = store.createSession(userId, TYPE, t, rs.id(), PURPOSE, ALGORITHM, Instant.now().plus(Duration.ofDays(settings.sessionExpiryDays())));
        return new StartResponse(id, t.code(), t.version(), false);
    }

    public QuestionsResponse questions(long userId, long sessionId) {
        SessionRow s = own(userId, sessionId);
        RuleSetV2 rs = ruleSets.load(s.ruleSetId());
        TemplateMeta t = store.loadTemplate(settings.initialTemplateCode());
        Map<String, Object> a = store.loadAnswers(s.id());
        return new QuestionsResponse(s.id(), visibility.visibleQuestions(t, a, rs).stream().map(InitialAssessmentV2Service::toDto).toList(), a);
    }

    public SaveAnswersResponse saveAnswers(long userId, long sessionId, List<AnswerDto> incoming) {
        SessionRow s = own(userId, sessionId);
        RuleSetV2 rs = ruleSets.load(s.ruleSetId());
        TemplateMeta t = store.loadTemplate(settings.initialTemplateCode());
        Map<String, Object> map = new LinkedHashMap<>();
        incoming.forEach(a -> map.put(a.questionCode(), a.value()));
        AnswerSupport.SaveResult r = answers.save(s, t, rs, map);
        return new SaveAnswersResponse(r.visible(), r.removed(), r.answered(), r.requiredRemaining());
    }

    // ------------------------------------------------------------------ complete

    @Transactional
    public InitialResultDto complete(long userId, long sessionId) {
        SessionRow s = own(userId, sessionId);
        if ("COMPLETED".equals(s.status())) return storedResult(s.id());                       // idempotent
        if (!"IN_PROGRESS".equals(s.status())) throw new IllegalStateException("Phiên không ở trạng thái hoàn tất được: " + s.status());

        RuleSetV2 rs = ruleSets.load(s.ruleSetId());
        TemplateMeta t = store.loadTemplate(settings.initialTemplateCode());
        Map<String, Object> given = store.loadAnswers(s.id());
        List<String> missing = answers.missingRequired(t, rs, given);
        if (!missing.isEmpty()) throw new IllegalArgumentException("ASSESSMENT_INCOMPLETE: thiếu câu bắt buộc " + missing);

        InitialComputation c = pipeline.compute(rs, t, given);
        SafetyStatusDto safetyDto = safety.current(userId).map(SafetyScreeningService::toDto).orElse(null);   // chỉ để hiển thị, không tham gia tính
        InitialResultDto dto = toResult(s.id(), rs, t, c, given, safetyDto);

        persist(s, rs, t, c, dto);
        if (bridge != null) bridge.onInitial(userId, s.id());   // V2 chạy thật: sao chép sang v1 sau khi commit
        return dto;
    }

    private void persist(SessionRow s, RuleSetV2 rs, TemplateMeta t, InitialComputation c, InitialResultDto dto) {
        Timestamp now = Timestamp.from(Instant.now());
        InitialResult lv = c.level();

        for (LadderResult lr : c.ladders()) {
            for (var st : lr.stages()) {
                jdbc.update("""
                        INSERT INTO assessment_evidence (session_id, ladder_id, stage_id, exercise_id, evidence_role, status, origin, performance_value, unit,
                            reason_code, assessment_template_version, created_at)
                        SELECT ?, l.id, s.id, s.exercise_id, 'PERFORMANCE_LADDER', ?, ?, ?, IF(s.metric = 'HOLD_SEC', 'sec', 'reps'), ?, ?, ?
                        FROM progression_stages s JOIN progression_ladders l ON l.id = s.ladder_id
                        WHERE l.rule_set_id = ? AND l.code = ? AND s.code = ?""",
                        s.id(), st.status().name(), st.origin(), st.value(), st.reasonCode(), t.version(), now, rs.id(), lr.ladder(), st.stage());
            }
            jdbc.update("""
                    INSERT INTO assessment_ladder_results (session_id, ladder_id, highest_achieved_stage_id, stage_performance_ratio, ladder_score, evidence_state, verification_status)
                    SELECT ?, l.id, (SELECT s.id FROM progression_stages s WHERE s.ladder_id = l.id AND s.code = ?), ?, ?, ?, 'NOT_VERIFIED'
                    FROM progression_ladders l WHERE l.rule_set_id = ? AND l.code = ?""",
                    s.id(), lr.highestStage(), lr.stagePerformanceRatio(), lr.score(), lr.state().name(), rs.id(), lr.ladder());
        }

        jdbc.update("""
                INSERT INTO assessment_results (session_id, overall_score, answer_confidence, data_quality, level_evaluation_id, snapshot_json, created_at)
                VALUES (?, ?, ?, ?, NULL, ?, ?)""", s.id(), c.overall(), c.answerConfidence(), c.dataQuality(), toJson(dto), now);
        long resultId = jdbc.queryForObject("SELECT id FROM assessment_results WHERE session_id = ?", Long.class, s.id());

        double rBase = rs.params().require("reliability.SELF_REPORTED");
        for (var e : c.competencies().entrySet()) {
            String q = c.dataQualityByCompetency().get(e.getKey());
            CompetencyScore cs = e.getValue();
            jdbc.update("""
                    INSERT INTO assessment_result_competencies (result_id, competency_code, score, coverage, answer_confidence, merge_weight, data_quality, needs_verification)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)""", resultId, e.getKey(), cs.score(), cs.coverage(), cs.answerConfidence(),
                    rBase * rs.params().require("quality." + q), q, "CONFLICTED".equals(q));
            jdbc.update("INSERT INTO assessment_reliability (session_id, scope, subject_code, factor_code, factor_value) VALUES (?, 'COMPETENCY', ?, 'COVERAGE', ?)",
                    s.id(), e.getKey(), cs.coverage());
            jdbc.update("INSERT INTO assessment_reliability (session_id, scope, subject_code, factor_code, factor_value) VALUES (?, 'COMPETENCY', ?, 'DATA_QUALITY', ?)",
                    s.id(), e.getKey(), rs.params().require("quality." + q));
            Double lr = c.ladderReliability().get(e.getKey());
            if (lr != null) jdbc.update("INSERT INTO assessment_reliability (session_id, scope, subject_code, factor_code, factor_value) VALUES (?, 'COMPETENCY', ?, 'ITEM_RELIABILITY', ?)",
                    s.id(), e.getKey(), lr);
        }
        for (ConsistencyChecker.Flag f : c.flags())
            jdbc.update("INSERT INTO assessment_consistency_flags (session_id, rule_code, severity, affected_json, detail_json) VALUES (?, ?, ?, ?, ?)",
                    s.id(), f.code(), f.severity(), toJson(f.affected()), toJson(Map.of("message", f.message())));

        // điểm chuẩn hoá + độ tin cậy của từng câu trả lời góp vào năng lực
        for (QuestionMeta q : t.questions()) {
            if (!c.visibleQuestions().contains(q.code())) continue;
            if (q.ladderCode() != null && ("LADDER_NODE".equals(q.answerKind()) || "LADDER_VALUE".equals(q.answerKind()))) {
                String comp = rs.ladderByCode(q.ladderCode()).orElseThrow().competency();
                LadderResult lr = c.ladders().stream().filter(x -> x.ladder().equals(q.ladderCode())).findFirst().orElse(null);
                if (lr != null) jdbc.update("UPDATE assessment_responses SET normalized_score = ?, reliability = ? WHERE assessment_session_id = ? AND question_id = ?",
                        lr.score(), c.ladderReliability().get(comp), s.id(), q.id());
            }
        }

        jdbc.update("""
                UPDATE assessment_sessions x JOIN assessment_types t ON t.id = x.assessment_type_id
                SET x.status = 'SUPERSEDED' WHERE x.user_id = ? AND t.code = ? AND x.purpose = ? AND x.status = 'COMPLETED' AND x.id <> ?""",
                s.userId(), TYPE, PURPOSE, s.id());
        jdbc.update("""
                UPDATE assessment_sessions SET status = 'COMPLETED', completed_at = ?, overall_score = ?, level_code = ?, data_quality_status = ?, confidence = ?,
                    rule_set_id = ?, algorithm_version = ? WHERE id = ?""",
                now, c.overall(), lv.finalLevel(), c.dataQuality(), c.answerConfidence(), rs.id(), ALGORITHM, s.id());
    }

    // ------------------------------------------------------------------ result mapping

    public InitialResultDto result(long userId, long sessionId) {
        SessionRow s = own(userId, sessionId);
        if (!"COMPLETED".equals(s.status())) throw new IllegalStateException("Phiên chưa hoàn tất");
        return storedResult(s.id());
    }

    private InitialResultDto storedResult(long sessionId) {
        String snap = jdbc.queryForObject("SELECT snapshot_json FROM assessment_results WHERE session_id = ?", String.class, sessionId);
        return json.readValue(snap, InitialResultDto.class);
    }

    private InitialResultDto toResult(long sessionId, RuleSetV2 rs, TemplateMeta t, InitialComputation c, Map<String, Object> given, SafetyStatusDto safetyDto) {
        InitialResult lv = c.level();
        Map<String, String> gates = new LinkedHashMap<>();
        lv.gates().forEach((k, v) -> gates.put(k, v.name()));
        LevelDto level = new LevelDto(lv.candidateLevel(), lv.gatedLevel(), lv.adjustedLevel(), lv.finalLevel(), lv.levelCap(), lv.capApplied(),
                lv.levelStatus(), lv.verificationStatus(), lv.source(), gates);

        List<CompetencyDto> comps = c.competencies().entrySet().stream().map(e -> new CompetencyDto(e.getKey(), e.getValue().score(), e.getValue().coverage(),
                e.getValue().answerConfidence(), c.dataQualityByCompetency().get(e.getKey()), "CONFLICTED".equals(c.dataQualityByCompetency().get(e.getKey())))).toList();
        List<LadderDto> ladders = c.ladders().stream().map(l -> new LadderDto(l.ladder(), rs.ladderByCode(l.ladder()).orElseThrow().competency(), l.highestStage(),
                l.stagePerformanceRatio(), l.score(), l.state().name(),
                l.stages().stream().map(st -> new StageDto(st.stage(), st.rank(), st.status().name(), st.origin(), st.value(), st.reasonCode())).toList())).toList();
        List<FlagDto> flags = c.flags().stream().map(f -> new FlagDto(f.code(), f.severity(), f.affected(), f.message())).toList();
        List<ReasonDto> reasons = lv.reasons().stream().map(r -> new ReasonDto(r.code(), r.gate(), r.subject(), r.required(), r.actual(), r.message())).toList();

        List<AnswerEchoDto> contributing = new ArrayList<>(), contextual = new ArrayList<>();
        for (QuestionMeta q : t.questions()) {
            Object v = given.get(q.code());
            if (v == null) continue;
            switch (q.evidenceRole()) {
                case "PERFORMANCE_LADDER", "PERFORMANCE_SUPPORT", "SELF_RATING_CHOICE", "QUALITY_MEASURED" ->
                        contributing.add(new AnswerEchoDto(q.code(), q.evidenceRole(), v, List.of("SCORE")));
                case "RELIABILITY_MODIFIER" -> contextual.add(new AnswerEchoDto(q.code(), q.evidenceRole(), v, List.of("RELIABILITY")));
                case "CONTEXT_EXPERIENCE" -> contextual.add(new AnswerEchoDto(q.code(), q.evidenceRole(), v, List.of("CONSISTENCY", "PROGRESSION_SPEED")));
                case "GOAL" -> contextual.add(new AnswerEchoDto(q.code(), q.evidenceRole(), v, List.of("GOAL")));
                case "CONSTRAINT" -> contextual.add(new AnswerEchoDto(q.code(), q.evidenceRole(), v, List.of("CONSTRAINT")));
                case "PROFILE" -> contextual.add(new AnswerEchoDto(q.code(), q.evidenceRole(), v, List.of("PROFILE")));
                default -> { }
            }
        }
        return new InitialResultDto(sessionId, rs.id(), rs.code(), rs.version(), ALGORITHM, level, c.overall(), c.answerConfidence(), c.dataQuality(),
                comps, ladders, flags, reasons, contributing, contextual, c.effectiveGroupWeights(), safetyDto);
    }

    // ------------------------------------------------------------------ helpers

    private SessionRow own(long userId, long sessionId) {
        SessionRow s = store.find(sessionId).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phiên " + sessionId));
        if (s.userId() != userId || !TYPE.equals(s.typeCode())) throw new IllegalArgumentException("Không tìm thấy phiên " + sessionId);
        return s;
    }

    static QuestionDto toDto(QuestionMeta q) {
        return new QuestionDto(q.code(), q.text(), q.instruction(), q.questionType(), q.inputType(), q.sectionTitle(), q.required(), q.minValue(), q.maxValue(),
                q.options().stream().map(o -> new OptionDto(o.code(), o.label())).toList());
    }

    private String toJson(Object o) { return json.writeValueAsString(o); }
}
