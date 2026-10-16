package com.calishealth.api.service.assessmentv2;

import com.calishealth.api.engine.v2.progression.ProgressionModels.LadderResult;
import com.calishealth.api.service.assessmentv2.AssessmentSessionStore.SessionRow;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.sql.Timestamp;
import java.time.Instant;

/**
 * Lưu kết quả của một phiên đo bằng camera (Baseline hoặc Periodic): bằng chứng theo stage, kết quả ladder, snapshot kết quả, điểm năng lực,
 * rồi đóng phiên (COMPLETED). Dùng chung để hai luồng ghi dữ liệu giống hệt nhau (ASSESSMENT_FRAMEWORK_V2 §10).
 */
@Component
public class ResultWriter {
    private final JdbcTemplate jdbc;
    private final ObjectMapper json;

    public ResultWriter(JdbcTemplate jdbc, ObjectMapper json) { this.jdbc = jdbc; this.json = json; }

    /** Phiên kết thúc mà không đủ dữ liệu để dựng bằng chứng (vd. đo hỏng ngay bài đầu): chỉ lưu snapshot và đóng phiên, không có level. */
    public void persistWithoutEvidence(SessionRow s, RuleSetV2 rs, Object snapshot, String algorithm) {
        Timestamp now = Timestamp.from(Instant.now());
        jdbc.update("INSERT INTO assessment_results (session_id, overall_score, answer_confidence, data_quality, level_evaluation_id, snapshot_json, created_at) VALUES (?, NULL, NULL, 'LOW', NULL, ?, ?)",
                s.id(), json.writeValueAsString(snapshot), now);
        jdbc.update("UPDATE assessment_sessions SET status = 'COMPLETED', completed_at = ?, overall_score = NULL, level_code = NULL, rule_set_id = ?, algorithm_version = ? WHERE id = ?",
                now, rs.id(), algorithm, s.id());
    }

    /**
     * verified = kết quả có kết luận hợp lệ (đánh dấu ladder MEASURED_VERIFIED); levelCode = null khi không có kết luận (RETEST_REQUIRED, INSUFFICIENT_EVIDENCE).
     * snapshot là DTO trả cho client, lưu để đọc lại sau.
     */
    public void persist(SessionRow s, RuleSetV2 rs, TemplateMeta t, BaselineEvidenceBuilder.Built built, Double overallScore, Object snapshot,
                        boolean verified, String levelCode, String algorithm) {
        Timestamp now = Timestamp.from(Instant.now());
        for (LadderResult lr : built.ladders()) {
            for (var st : lr.stages()) {
                jdbc.update("""
                        INSERT INTO assessment_evidence (session_id, ladder_id, stage_id, exercise_id, evidence_role, status, origin, performance_value, unit, reason_code,
                            assessment_template_version, created_at)
                        SELECT ?, l.id, s.id, s.exercise_id, 'PERFORMANCE_LADDER', ?, ?, ?, IF(s.metric = 'HOLD_SEC', 'sec', 'reps'), ?, ?, ?
                        FROM progression_stages s JOIN progression_ladders l ON l.id = s.ladder_id
                        WHERE l.rule_set_id = ? AND l.code = ? AND s.code = ?""",
                        s.id(), st.status().name(), st.origin(), st.value(), st.reasonCode(), t.version(), now, rs.id(), lr.ladder(), st.stage());
            }
            jdbc.update("""
                    INSERT INTO assessment_ladder_results (session_id, ladder_id, highest_achieved_stage_id, stage_performance_ratio, ladder_score, evidence_state, verification_status)
                    SELECT ?, l.id, (SELECT x.id FROM progression_stages x WHERE x.ladder_id = l.id AND x.code = ?), ?, ?, ?, ?
                    FROM progression_ladders l WHERE l.rule_set_id = ? AND l.code = ?""",
                    s.id(), lr.highestStage(), lr.stagePerformanceRatio(), lr.score(), lr.state().name(), verified ? "MEASURED_VERIFIED" : "NOT_VERIFIED", rs.id(), lr.ladder());
        }
        jdbc.update("INSERT INTO assessment_results (session_id, overall_score, answer_confidence, data_quality, level_evaluation_id, snapshot_json, created_at) VALUES (?, ?, ?, 'HIGH', NULL, ?, ?)",
                s.id(), overallScore, null, json.writeValueAsString(snapshot), now);
        long resultId = jdbc.queryForObject("SELECT id FROM assessment_results WHERE session_id = ?", Long.class, s.id());
        for (var e : built.competencies().entrySet())
            jdbc.update("INSERT INTO assessment_result_competencies (result_id, competency_code, score, coverage, answer_confidence, merge_weight, data_quality, needs_verification) VALUES (?, ?, ?, ?, ?, ?, 'HIGH', FALSE)",
                    resultId, e.getKey(), e.getValue().score(), e.getValue().coverage(), e.getValue().answerConfidence(), rs.params().require("reliability.AI_BASE"));
        jdbc.update("""
                UPDATE assessment_sessions SET status = 'COMPLETED', completed_at = ?, overall_score = ?, level_code = ?, rule_set_id = ?, algorithm_version = ?
                WHERE id = ?""", now, overallScore, levelCode, rs.id(), algorithm, s.id());
    }
}
