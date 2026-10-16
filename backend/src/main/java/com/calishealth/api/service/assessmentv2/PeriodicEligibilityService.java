package com.calishealth.api.service.assessmentv2;

import com.calishealth.api.engine.v2.RuleParams;
import com.calishealth.api.service.assessmentv2.LevelStateV2Service.LevelState;
import com.calishealth.api.service.level.PlanChoiceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

/**
 * Khi nào học viên được làm đánh giá định kỳ (đổi level):
 *  1. Đang RETURNING (nghỉ dài): luôn mở.
 *  2. Chưa đủ assessment.minIntervalDays kể từ lần đo hợp lệ trước: đóng (TOO_SOON).
 *  3. Đang tập theo giáo án HỆ THỐNG mà chu kỳ chưa kết thúc: đóng (CYCLE_IN_PROGRESS). Chu kỳ kết thúc khi làm đủ số buổi đã lên lịch HOẶC đã tới ngày kết thúc, cái nào đến trước.
 *  4. Các trường hợp còn lại: mở.
 * Ngoài ra: bài chỉ ở level cao hơn mà học viên chưa tập đủ buổi thì không đưa vào bộ đo (thiếu bằng chứng, không phải trượt).
 */
@Service
public class PeriodicEligibilityService {
    public static final String OPEN = "OPEN", TOO_SOON = "TOO_SOON", CYCLE_IN_PROGRESS = "CYCLE_IN_PROGRESS";

    public record Gate(String code, Instant earliest, LocalDate cycleEnd, int sessionsDone, int sessionsPlanned) {
        public boolean open() { return OPEN.equals(code); }
    }

    private final JdbcTemplate jdbc;
    private PlanChoiceService planChoice;

    public PeriodicEligibilityService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @Autowired(required = false) void setPlanChoice(PlanChoiceService planChoice) { this.planChoice = planChoice; }

    @Transactional(readOnly = true)
    public Gate check(long userId, LevelState st, RuleParams p) {
        if (LevelStateV2Service.RETURNING.equals(st.status())) return new Gate(OPEN, null, null, 0, 0);
        Instant earliest = st.lastAssessedAt().plus(Duration.ofDays((long) p.require("assessment.minIntervalDays")));
        if (Instant.now().isBefore(earliest)) return new Gate(TOO_SOON, earliest, null, 0, 0);
        return cycleGate(userId, earliest);
    }

    private Gate cycleGate(long userId, Instant earliest) {
        if (planChoice == null || !PlanChoiceService.SYSTEM.equals(planChoice.effectiveMode(userId))) return new Gate(OPEN, earliest, null, 0, 0);
        List<Object[]> plans = jdbc.query("""
                SELECT id, end_date FROM workout_plans WHERE user_id = ? AND status = 'ACTIVE' AND (generation_reason IS NULL OR generation_reason <> 'USER_SELF_BUILT')
                ORDER BY start_date DESC, id DESC LIMIT 1""", (rs, i) -> new Object[]{rs.getLong(1), rs.getDate(2)}, userId);
        if (plans.isEmpty()) return new Gate(OPEN, earliest, null, 0, 0);   // không có chu kỳ để chờ: không chặn vô thời hạn
        long planId = (Long) plans.get(0)[0];
        LocalDate endDate = plans.get(0)[1] == null ? null : ((java.sql.Date) plans.get(0)[1]).toLocalDate();
        int planned = jdbc.queryForObject("SELECT COUNT(*) FROM workout_plan_days WHERE workout_plan_id = ? AND rest_day = 0", Integer.class, planId);
        int done = jdbc.queryForObject("SELECT COUNT(*) FROM workout_sessions WHERE workout_plan_id = ? AND status = 'COMPLETED'", Integer.class, planId);
        boolean ended = (endDate != null && !LocalDate.now().isBefore(endDate)) || (planned > 0 && done >= planned);
        return ended ? new Gate(OPEN, earliest, endDate, done, planned) : new Gate(CYCLE_IN_PROGRESS, earliest, endDate, done, planned);
    }

    // ------------------------------------------------------------------ bài chưa quen

    /** Mã các bài (trong `codes`) mà học viên đã hoàn thành ít nhất `minSessions` buổi tập. */
    public Set<String> familiar(long userId, Collection<String> codes, int minSessions) {
        if (codes.isEmpty()) return Set.of();
        String in = String.join(",", Collections.nCopies(codes.size(), "?"));
        List<Object> args = new ArrayList<>();
        args.add(userId);
        args.addAll(codes);
        args.add(minSessions);
        return new HashSet<>(jdbc.queryForList("""
                SELECT e.code FROM workout_session_exercises x JOIN workout_sessions s ON s.id = x.workout_session_id JOIN exercises e ON e.id = x.exercise_id
                WHERE s.user_id = ? AND s.status = 'COMPLETED' AND e.code IN (""" + in + ") GROUP BY e.code HAVING COUNT(DISTINCT s.id) >= ?", String.class, args.toArray()));
    }
}
