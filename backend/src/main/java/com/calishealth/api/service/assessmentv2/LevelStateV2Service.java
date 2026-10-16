package com.calishealth.api.service.assessmentv2;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Trạng thái level V2 của user và lịch sử mọi quyết định (ASSESSMENT_FRAMEWORK_V2 §34). Bảng riêng của V2:
 * KHÔNG ghi user_level_state/level_evaluations của v1 cho tới khi kích hoạt. Chỉ ghi khi có kết luận hợp lệ;
 * RETEST_REQUIRED / INSUFFICIENT_EVIDENCE chỉ để lại dòng lịch sử, không đổi trạng thái (I19).
 */
@Service
public class LevelStateV2Service {
    public static final String VERIFIED = "VERIFIED", RETURNING = "RETURNING";

    public record LevelState(long userId, String levelCode, int levelRank, String status, String source, Double ewma, int consecutiveBelow,
                             Long lastSessionId, Instant lastAssessedAt) {}

    public record LevelDecision(long id, long sessionId, String kind, String outcome, String decision, String levelBefore, String levelAfter, Integer candidateRank,
                                Set<Integer> competencyPassRanks, Double overall, Double ewma, Integer consecutiveBelow, String reasonCode, Integer pendingCoachRank,
                                Instant createdAt) {}

    private final JdbcTemplate jdbc;
    /** Có khi V2 chạy thật: mỗi quyết định hợp lệ được sao chép sang v1 sau khi giao dịch commit (V2LevelBridge). Test dựng tay thì null. */
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private V2LevelBridge bridge;

    public LevelStateV2Service(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public Optional<LevelState> state(long userId) {
        return jdbc.query("""
                SELECT user_id, level_code, level_rank, status, source, ewma, consecutive_below, last_session_id, last_assessed_at
                FROM user_level_state_v2 WHERE user_id = ?""", (rs, i) -> new LevelState(rs.getLong(1), rs.getString(2), rs.getInt(3), rs.getString(4), rs.getString(5),
                rs.getObject(6) == null ? null : rs.getDouble(6), rs.getInt(7), rs.getObject(8) == null ? null : rs.getLong(8), rs.getTimestamp(9).toInstant()), userId).stream().findFirst();
    }

    /** Ghi (hoặc thay) trạng thái: chỉ gọi khi có kết luận hợp lệ. */
    public void upsert(long userId, String levelCode, int levelRank, String status, String source, Double ewma, int consecutiveBelow, Long sessionId, Instant assessedAt) {
        Timestamp now = Timestamp.from(Instant.now());
        jdbc.update("""
                INSERT INTO user_level_state_v2 (user_id, level_code, level_rank, status, source, ewma, consecutive_below, last_session_id, last_assessed_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE level_code = VALUES(level_code), level_rank = VALUES(level_rank), status = VALUES(status), source = VALUES(source), ewma = VALUES(ewma),
                    consecutive_below = VALUES(consecutive_below), last_session_id = VALUES(last_session_id), last_assessed_at = VALUES(last_assessed_at), updated_at = VALUES(updated_at)""",
                userId, levelCode, levelRank, status, source, ewma, consecutiveBelow, sessionId, Timestamp.from(assessedAt), now);
    }

    public void markReturning(long userId) {
        jdbc.update("UPDATE user_level_state_v2 SET status = ?, updated_at = ? WHERE user_id = ? AND status <> ?", RETURNING, Timestamp.from(Instant.now()), userId, RETURNING);
    }

    public void recordDecision(long userId, long sessionId, String kind, String outcome, String decision, String levelBefore, String levelAfter, Integer candidateRank,
                               Collection<Integer> competencyPassRanks, Double overall, Double ewma, Integer consecutiveBelow, String reasonCode, Integer pendingCoachRank) {
        String passRanks = competencyPassRanks == null || competencyPassRanks.isEmpty() ? null
                : competencyPassRanks.stream().sorted().map(String::valueOf).collect(Collectors.joining(","));
        jdbc.update("""
                INSERT INTO level_decisions_v2 (user_id, session_id, kind, outcome, decision, level_before, level_after, candidate_rank, competency_pass_ranks, overall, ewma,
                    consecutive_below, reason_code, pending_coach_rank, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                userId, sessionId, kind, outcome, decision, levelBefore, levelAfter, candidateRank, passRanks, overall, ewma, consecutiveBelow, reasonCode, pendingCoachRank,
                Timestamp.from(Instant.now()));
        if (bridge != null && "DECIDED".equals(outcome)) bridge.onDecision(userId, sessionId, kind);
    }

    /** Mới nhất trước. */
    public List<LevelDecision> history(long userId, int limit) {
        return jdbc.query("""
                SELECT id, session_id, kind, outcome, decision, level_before, level_after, candidate_rank, competency_pass_ranks, overall, ewma, consecutive_below, reason_code,
                       pending_coach_rank, created_at FROM level_decisions_v2 WHERE user_id = ? ORDER BY id DESC LIMIT ?""", (rs, i) -> {
            String ranks = rs.getString(9);
            Set<Integer> pass = ranks == null || ranks.isBlank() ? Set.of() : Arrays.stream(ranks.split(",")).map(Integer::valueOf).collect(Collectors.toCollection(TreeSet::new));
            return new LevelDecision(rs.getLong(1), rs.getLong(2), rs.getString(3), rs.getString(4), rs.getString(5), rs.getString(6), rs.getString(7),
                    (Integer) rs.getObject(8), pass, rs.getObject(10) == null ? null : rs.getDouble(10), rs.getObject(11) == null ? null : rs.getDouble(11),
                    (Integer) rs.getObject(12), rs.getString(13), (Integer) rs.getObject(14), rs.getTimestamp(15).toInstant());
        }, userId, limit);
    }

    /** Quyết định hợp lệ (DECIDED) gần nhất của Periodic/Baseline trong cửa sổ — căn cứ cho cổng Stability. */
    public Optional<LevelDecision> latestDecidedSince(long userId, Instant since) {
        return history(userId, 20).stream()
                .filter(d -> "DECIDED".equals(d.outcome()) && !"COACH_L4".equals(d.kind()) && d.createdAt().isAfter(since))
                .findFirst();
    }
}
