package com.calishealth.api.service.assessmentv2;

import com.calishealth.api.dto.AssessmentV2Dtos.RetakeDto;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;

/**
 * Lịch sử Baseline của một người dùng và quy tắc ĐO LẠI LẦN ĐẦU (ASSESSMENT_FRAMEWORK_V2 §46). Chỉ đọc, không ghi.
 *  - Level tạm thời (provisional) = level của khảo sát (tối đa L2, initial.max_level_rank); CHƯA phải level đạt được.
 *  - Kết quả Baseline đầu THẤP HƠN level tạm ⇒ được đo lại trong baseline.retake.windowDays ngày, tối đa baseline.retake.max lần.
 *  - Level cuối = mức CAO NHẤT của các lần đo hợp lệ (quyết định sản phẩm). Lần đo không tin cậy (RETEST_REQUIRED) không tính là đã dùng lượt.
 */
public class BaselineHistory {
    public record Run(long sessionId, String levelCode, int rank, Instant completedAt) {}

    private final JdbcTemplate jdbc;

    public BaselineHistory(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    /** Các phiên Baseline đã hoàn tất với level được xác nhận, theo thứ tự thời gian. */
    public List<Run> completedRuns(long userId, RuleSetV2 rs) {
        return jdbc.query("""
                SELECT id, level_code, completed_at FROM assessment_sessions
                WHERE user_id = ? AND purpose = ? AND status = 'COMPLETED' AND level_code IS NOT NULL ORDER BY id""",
                (r, i) -> new Run(r.getLong(1), r.getString(2), rankOf(rs, r.getString(2)), r.getTimestamp(3).toInstant()), userId, BaselineService.PURPOSE);
    }

    /** Level tạm từ khảo sát gần nhất (null nếu chưa làm khảo sát). */
    public Optional<String> provisionalCode(long userId) {
        return jdbc.queryForList("""
                SELECT level_code FROM assessment_sessions WHERE user_id = ? AND purpose = 'INITIAL_V2' AND status = 'COMPLETED' AND level_code IS NOT NULL
                ORDER BY id DESC LIMIT 1""", String.class, userId).stream().findFirst();
    }

    public int provisionalRank(long userId, RuleSetV2 rs) { return provisionalCode(userId).map(c -> rankOf(rs, c)).orElse(0); }

    static int rankOf(RuleSetV2 rs, String code) {
        return rs.levels().stream().filter(l -> l.code().equals(code)).mapToInt(l -> l.rank()).findFirst().orElse(0);
    }

    /** Có thể bắt đầu một Baseline MỚI (đo lại) không, và thông tin cho giao diện. */
    public RetakeDto retake(long userId, RuleSetV2 rs) {
        List<Run> runs = completedRuns(userId, rs);
        int max = (int) rs.params().require("baseline.retake.max");
        Duration window = Duration.ofDays((long) rs.params().require("baseline.retake.windowDays"));
        if (runs.isEmpty()) return new RetakeDto(false, false, null, null, null, max);
        Run first = runs.get(0);
        boolean lower = first.rank() < provisionalRank(userId, rs);
        Instant until = lower ? first.completedAt().plus(window) : null;
        boolean used = runs.size() > 1;
        boolean eligible = lower && runs.size() < 1 + max && Instant.now().isBefore(until);
        return new RetakeDto(eligible, used, until, first.levelCode(), used ? runs.get(1).levelCode() : null, max);
    }

    public Optional<Instant> deferredUntil(long userId) {
        return jdbc.queryForList("SELECT remind_after FROM baseline_deferrals WHERE user_id = ?", Timestamp.class, userId).stream().findFirst().map(Timestamp::toInstant);
    }

    /** Quyết định Baseline gần nhất có phải "một phần bằng chứng" (đã kết thúc sớm) không. */
    public boolean lastWasPartial(long userId) {
        return jdbc.queryForList("""
                SELECT reason_code FROM level_decisions_v2 WHERE user_id = ? AND kind = 'BASELINE' AND outcome = 'DECIDED' ORDER BY id DESC LIMIT 1""",
                String.class, userId).stream().anyMatch("PARTIAL_EVIDENCE"::equals);
    }
}
