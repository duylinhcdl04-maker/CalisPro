package com.calishealth.api.service.assessmentv2;

import com.calishealth.api.dto.AssessmentV2Dtos.AttemptResultDto;
import com.calishealth.api.dto.AssessmentV2Dtos.SubmitAttemptRequest;
import com.calishealth.api.engine.v2.RuleParams;
import com.calishealth.api.service.assessmentv2.AssessmentSessionStore.SessionRow;
import com.calishealth.api.service.assessmentv2.TemplateMeta.QuestionMeta;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Ghi MỘT attempt đo bằng camera cho Baseline và Periodic (ASSESSMENT_FRAMEWORK_V2 §8, §8.1.2): kiểm tra tính độc lập, phân loại độ tin cậy, lưu attempt + metric.
 *  - Độc lập: không chồng lấn với attempt trước, nghỉ đủ `protocol.restSec` trước attempt kế của cùng bài, mỗi attempt một movementSessionId.
 *  - Phân loại: VALID | INVALID_MEASUREMENT (thiếu dữ liệu, độ tin cậy thấp, góc phi lý) | USER_ABORTED. Không bao giờ suy ra "không đạt" từ đo hỏng (I19).
 * Không quyết định level: bên gọi tự đánh giá sau khi ghi.
 */
@Component
public class AttemptRecorder {
    private final JdbcTemplate jdbc;

    public AttemptRecorder(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    /** reliabilityPrefix: "baseline.reliability" hoặc "gate.reliability" (cùng ba hậu tố minPose, minVisibility, minTracked). */
    public AttemptResultDto record(SessionRow s, RuleSetV2 rs, TemplateMeta t, SubmitAttemptRequest req, String reliabilityPrefix) {
        long sessionId = s.id();
        RuleParams p = rs.params();
        if (req.exerciseCode() == null || req.movementSessionId() == null || req.startedAt() == null || req.endedAt() == null)
            throw new IllegalArgumentException("INVALID_ATTEMPT: thiếu exerciseCode/movementSessionId/startedAt/endedAt");
        QuestionMeta item = t.questions().stream()
                .filter(q -> q.config() != null && req.exerciseCode().equals(q.config().path("exerciseCode").asString("")))
                .findFirst().orElseThrow(() -> new IllegalArgumentException("INVALID_ATTEMPT: bài không thuộc bộ test: " + req.exerciseCode()));
        if (req.endedAt().isBefore(req.startedAt())) throw new IllegalArgumentException("INVALID_ATTEMPT: endedAt < startedAt");

        // độc lập: không chồng lấn, nghỉ đủ trước attempt kế tiếp của CÙNG bài; mỗi attempt một movementSessionId riêng
        long rest = (long) p.require("protocol.restSec");
        Timestamp lastEnd = jdbc.queryForObject("SELECT MAX(ended_at) FROM assessment_attempts WHERE session_id = ?", Timestamp.class, sessionId);
        if (lastEnd != null && req.startedAt().isBefore(lastEnd.toInstant()))
            throw new IllegalStateException("ATTEMPT_NOT_INDEPENDENT: attempt chồng lấn với attempt trước");
        Timestamp lastSame = jdbc.queryForObject("SELECT MAX(ended_at) FROM assessment_attempts WHERE session_id = ? AND item_id = ?", Timestamp.class, sessionId, item.id());
        if (lastSame != null && req.startedAt().isBefore(lastSame.toInstant().plusSeconds(rest)))
            throw new IllegalStateException("ATTEMPT_NOT_INDEPENDENT: chưa nghỉ đủ " + rest + " giây trước attempt kế tiếp của cùng bài");

        String metric = item.config().get("metric").asString();
        Double value = switch (metric) {
            case "HOLD_SEC" -> req.holdSec();
            case "ANGLE_DEG" -> req.angleDeg();
            default -> req.validReps() == null ? null : req.validReps().doubleValue();
        };
        String status; String reason = null; double reliability = 0;
        if (Boolean.TRUE.equals(req.userAborted())) { status = "USER_ABORTED"; reason = "PAIN".equalsIgnoreCase(req.abortReason()) ? "PAIN" : "USER_STOPPED"; }
        else if (value == null || req.poseConfidenceAvg() == null || req.visibilityAvg() == null || req.trackedRatio() == null) { status = "INVALID_MEASUREMENT"; reason = "INCOMPLETE_DATA"; }
        else if ("ANGLE_DEG".equals(metric) && (value < 0 || value > p.require("mobility.capRatio") * p.require("mobility.target." + req.exerciseCode()))) {
            status = "INVALID_MEASUREMENT"; reason = "IMPLAUSIBLE_VALUE";     // góc ngoài khả năng cơ thể = lỗi đo, không phải điểm cao
        }
        else if (req.poseConfidenceAvg() < p.require(reliabilityPrefix + ".minPose")) { status = "INVALID_MEASUREMENT"; reason = "LOW_POSE_CONFIDENCE"; }
        else if (req.visibilityAvg() < p.require(reliabilityPrefix + ".minVisibility")) { status = "INVALID_MEASUREMENT"; reason = "LANDMARKS_NOT_VISIBLE"; }
        else if (req.trackedRatio() < p.require(reliabilityPrefix + ".minTracked")) { status = "INVALID_MEASUREMENT"; reason = "INCOMPLETE_DATA"; }
        else status = "VALID";
        if (req.poseConfidenceAvg() != null && req.visibilityAvg() != null && req.trackedRatio() != null)
            reliability = p.require("reliability.AI_BASE") * Math.min(1, req.poseConfidenceAvg() / p.require("reliability.ai.poseRef"))
                    * Math.min(1, req.visibilityAvg() / p.require("reliability.ai.visibilityRef")) * Math.min(1, req.trackedRatio());

        int attemptNo = jdbc.queryForObject("SELECT COUNT(*) + 1 FROM assessment_attempts WHERE session_id = ? AND item_id = ?", Integer.class, sessionId, item.id());
        try {
            jdbc.update("""
                    INSERT INTO assessment_attempts (session_id, item_id, attempt_no, movement_session_id, started_at, ended_at, rest_before_sec, measurement_status, invalid_reason_code, reliability)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""", sessionId, item.id(), attemptNo, req.movementSessionId(), Timestamp.from(req.startedAt()), Timestamp.from(req.endedAt()),
                    lastSame == null ? null : Duration.between(lastSame.toInstant(), req.startedAt()).getSeconds(), status, reason, reliability);
        } catch (DuplicateKeyException e) {
            throw new IllegalStateException("ATTEMPT_NOT_INDEPENDENT: movementSessionId đã được dùng cho một attempt khác");
        }
        long attemptId = jdbc.queryForObject("SELECT id FROM assessment_attempts WHERE session_id = ? AND item_id = ? AND attempt_no = ?", Long.class, sessionId, item.id(), attemptNo);
        Map<String, Object> metrics = new LinkedHashMap<>();
        metrics.put("TOTAL_REPS", req.totalReps()); metrics.put("VALID_REPS", req.validReps()); metrics.put("HOLD_SEC", req.holdSec()); metrics.put("ANGLE_DEG", req.angleDeg());
        metrics.put("FORM_SCORE", req.formScore()); metrics.put("ROM_SCORE", req.romScore()); metrics.put("MAJOR_VIOLATIONS", req.majorViolations());
        metrics.put("POSE_CONFIDENCE", req.poseConfidenceAvg()); metrics.put("VISIBILITY", req.visibilityAvg()); metrics.put("TRACKED_RATIO", req.trackedRatio());
        for (var m : metrics.entrySet())
            if (m.getValue() != null) jdbc.update("INSERT INTO assessment_metrics (session_id, item_id, attempt_id, metric_code, value, movement_session_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    sessionId, item.id(), attemptId, m.getKey(), ((Number) m.getValue()).doubleValue(), req.movementSessionId(), Timestamp.from(Instant.now()));
        jdbc.update("INSERT INTO assessment_reliability (session_id, scope, subject_code, factor_code, factor_value) VALUES (?, 'ATTEMPT', ?, 'ATTEMPT_RELIABILITY', ?)",
                sessionId, req.exerciseCode() + "#" + attemptNo, reliability);
        return new AttemptResultDto(attemptId, req.exerciseCode(), attemptNo, status, reason, reliability);
    }

    /** Các bài test của template thực hành (mỗi câu PRACTICAL_TEST mang cấu hình bài trong config_json). */
    public java.util.List<BaselineEvidenceBuilder.TestItem> testItems(TemplateMeta t) {
        java.util.List<BaselineEvidenceBuilder.TestItem> items = new java.util.ArrayList<>();
        for (QuestionMeta q : t.questions()) {
            if (q.config() == null || !q.config().has("exerciseCode")) continue;
            items.add(new BaselineEvidenceBuilder.TestItem(q.code(), q.config().get("exerciseCode").asString(), q.config().get("competency").asString(), q.config().get("metric").asString(),
                    q.config().get("levelMin").asInt(), q.config().get("levelMax").asInt(), q.config().get("mandatory").asBoolean(), q.sortOrder()));
        }
        return items;
    }

    /** Attempt đã nộp của phiên, gom theo bài (thứ tự attempt). Metric chất lượng thiếu = null (không đo được ≠ không đạt, I19). */
    public java.util.Map<String, java.util.List<BaselineEvidenceBuilder.AttemptData>> loadAttempts(long sessionId, TemplateMeta t, java.util.List<BaselineEvidenceBuilder.TestItem> items) {
        java.util.Map<Long, String> exerciseByItem = new java.util.HashMap<>();
        for (QuestionMeta q : t.questions()) if (q.config() != null && q.config().has("exerciseCode")) exerciseByItem.put(q.id(), q.config().get("exerciseCode").asString());
        java.util.Map<String, String> metricOf = new java.util.HashMap<>();
        items.forEach(i -> metricOf.put(i.exercise(), i.metric()));

        java.util.Map<String, java.util.List<BaselineEvidenceBuilder.AttemptData>> attempts = new java.util.HashMap<>();
        java.util.Map<Long, java.util.Map<String, Double>> metricsByAttempt = new java.util.HashMap<>();
        jdbc.query("SELECT attempt_id, metric_code, value FROM assessment_metrics WHERE session_id = ? AND attempt_id IS NOT NULL",
                rch -> { metricsByAttempt.computeIfAbsent(rch.getLong(1), k -> new java.util.HashMap<>()).put(rch.getString(2), rch.getDouble(3)); }, sessionId);
        jdbc.query("SELECT id, item_id, measurement_status, reliability FROM assessment_attempts WHERE session_id = ? ORDER BY item_id, attempt_no", rch -> {
            String ex = exerciseByItem.get(rch.getLong(2));
            java.util.Map<String, Double> m = metricsByAttempt.getOrDefault(rch.getLong(1), java.util.Map.of());
            String metric = metricOf.get(ex);
            Double value = "HOLD_SEC".equals(metric) ? m.get("HOLD_SEC") : "ANGLE_DEG".equals(metric) ? m.get("ANGLE_DEG") : m.get("VALID_REPS");
            Double total = m.get("TOTAL_REPS");
            Double ratio = (m.get("VALID_REPS") != null && total != null && total > 0) ? m.get("VALID_REPS") / total : null;
            Integer major = m.get("MAJOR_VIOLATIONS") == null ? null : m.get("MAJOR_VIOLATIONS").intValue();
            attempts.computeIfAbsent(ex, k -> new java.util.ArrayList<>()).add(new BaselineEvidenceBuilder.AttemptData(
                    com.calishealth.api.engine.v2.level.LevelModelsV2.AttemptStatus.valueOf(rch.getString(3)), value, m.get("FORM_SCORE"), ratio, major, rch.getDouble(4)));
        }, sessionId);
        return attempts;
    }
}
