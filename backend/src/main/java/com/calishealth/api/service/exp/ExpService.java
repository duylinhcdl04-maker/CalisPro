package com.calishealth.api.service.exp;

import com.calishealth.api.engine.v2.RuleParams;
import com.calishealth.api.engine.v2.level.PeriodicModels.Attendance;
import com.calishealth.api.service.assessmentv2.RuleSetV2Loader;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

/**
 * EXP chuyên cần. Mỗi sự kiện ghi đúng một lần vào exp_events (khóa user + loại + ref_key).
 *   CHECKIN    điểm danh = check-in sức khỏe trong NGÀY hôm nay (không điểm danh bù)
 *   SESSION    hoàn thành một buổi tập của giáo án hệ thống (buổi tự soạn là việc cá nhân, không tính)
 *   GOOD_FORM  buổi có đủ tỷ lệ hiệp do AI đo và form trung bình đạt chuẩn
 *   STREAK7    đủ 7 ngày check-in liên tiếp
 *   ASSESSMENT làm trọn một lần đánh giá định kỳ (thưởng việc đo xong, không thưởng điểm cao)
 * EXP KHÔNG thay điểm bài test hay form. Nó chỉ cho ra điểm chuyên cần dùng làm một cổng và điểm cộng nhỏ trong PeriodicDecisionEngine.
 * Mọi con số nằm trong tham số rule set (exp.*, attendance.*); rule set chưa có đủ tham số ⇒ tính năng tắt, không ghi EXP, không có cổng chuyên cần.
 */
@Service
public class ExpService {
    /** Cấp EXP chỉ để hiển thị, KHÔNG liên quan level thể lực. */
    static final int EXP_PER_LEVEL = 200;
    private static final List<String> REQUIRED = List.of("exp.checkin", "exp.session", "exp.goodForm", "exp.streak7", "exp.assessment", "exp.goodForm.minAiShare",
            "attendance.windowDays", "attendance.targetExp", "attendance.minScore", "attendance.bonusMax", "progression.minForm");

    private final JdbcTemplate jdbc;
    private final RuleSetV2Loader ruleSets;

    public ExpService(JdbcTemplate jdbc, RuleSetV2Loader ruleSets) { this.jdbc = jdbc; this.ruleSets = ruleSets; }

    public record Policy(int checkin, int session, int goodForm, int streak7, int assessment, double goodFormMinAiShare, double minForm,
                         int windowDays, double targetExp, double minScore, double bonusMax) {}

    public record Event(String type, String ref, int points, LocalDate date) {}

    public record Summary(boolean enabled, long totalExp, int expLevel, int expInLevel, int expPerLevel, boolean checkedInToday, int streakDays,
                          Integer windowDays, Integer windowExp, Double targetExp, Double attendanceScore, Double minScore, Boolean gatePassed, Double bonusMax,
                          List<Event> recent) {}

    // ------------------------------------------------------------------ tham số

    /** Tham số EXP của rule set đang áp dụng; null khi tính năng tắt (thiếu rule set hoặc thiếu tham số). */
    public Policy policy() {
        try {
            return policy(loadParams(ruleSets.configuredId()));
        } catch (IllegalStateException e) {
            return null;       // chưa có rule set V2 đang áp dụng
        }
    }

    private RuleParams loadParams(long ruleSetId) {
        Map<String, Double> values = new HashMap<>();
        jdbc.query("SELECT param_key, param_value FROM engine_parameters WHERE rule_set_id = ? AND param_value IS NOT NULL", rch -> { values.put(rch.getString(1), rch.getDouble(2)); }, ruleSetId);
        return new RuleParams(values);
    }

    /** Policy từ tham số của một rule set cụ thể (dùng khi đang đánh giá với đúng rule set đã chọn). */
    public Policy policy(RuleParams p) {
        if (p.find("exp.enabled").orElse(0) < 1) return null;
        for (String k : REQUIRED) if (p.find(k).isEmpty()) return null;
        if (p.require("attendance.windowDays") < 1 || p.require("attendance.targetExp") <= 0) return null;
        return new Policy((int) p.require("exp.checkin"), (int) p.require("exp.session"), (int) p.require("exp.goodForm"), (int) p.require("exp.streak7"),
                (int) p.require("exp.assessment"), p.require("exp.goodForm.minAiShare"), p.require("progression.minForm"),
                (int) p.require("attendance.windowDays"), p.require("attendance.targetExp"), p.require("attendance.minScore"), p.require("attendance.bonusMax"));
    }

    // ------------------------------------------------------------------ ghi EXP

    @Transactional
    public void onCheckin(long userId, LocalDate checkinDate) {
        Policy p = policy();
        if (p == null || checkinDate == null) return;
        LocalDate today = LocalDate.now();
        if (!checkinDate.equals(today)) return;                      // chỉ điểm danh trong ngày
        if (!award(userId, "CHECKIN", today.toString(), p.checkin(), today)) return;
        Integer streak = jdbc.queryForObject("SELECT COUNT(DISTINCT event_date) FROM exp_events WHERE user_id = ? AND event_type = 'CHECKIN' AND event_date BETWEEN ? AND ?",
                Integer.class, userId, Date.valueOf(today.minusDays(6)), Date.valueOf(today));
        Integer recentStreakAward = jdbc.queryForObject("SELECT COUNT(*) FROM exp_events WHERE user_id = ? AND event_type = 'STREAK7' AND event_date > ?",
                Integer.class, userId, Date.valueOf(today.minusDays(7)));
        if (streak != null && streak >= 7 && (recentStreakAward == null || recentStreakAward == 0)) award(userId, "STREAK7", today.toString(), p.streak7(), today);
    }

    /** Buổi tập vừa được tính COMPLETED. aiSets/completedSets: số hiệp do AI đo trên tổng số hiệp đã làm. */
    @Transactional
    public void onSessionCompleted(long userId, long workoutSessionId, int completedSets, int aiSets) {
        Policy p = policy();
        if (p == null) return;
        List<String> reasons = jdbc.queryForList("SELECT COALESCE(wp.generation_reason, '') FROM workout_sessions ws LEFT JOIN workout_plans wp ON wp.id = ws.workout_plan_id WHERE ws.id = ? AND ws.user_id = ?",
                String.class, workoutSessionId, userId);
        if (reasons.isEmpty() || "USER_SELF_BUILT".equals(reasons.get(0))) return;     // chỉ giáo án hệ thống là bằng chứng chuyên cần
        LocalDate today = LocalDate.now();
        award(userId, "SESSION", String.valueOf(workoutSessionId), p.session(), today);
        if (completedSets <= 0 || aiSets < p.goodFormMinAiShare() * completedSets) return;
        Double form = jdbc.queryForObject("""
                SELECT AVG(fa.overall_score) FROM form_analysis fa JOIN movement_sessions ms ON ms.id = fa.movement_session_id
                WHERE ms.workout_session_id = ? AND ms.user_id = ? AND fa.overall_score IS NOT NULL""", Double.class, workoutSessionId, userId);
        if (form != null && form >= p.minForm()) award(userId, "GOOD_FORM", String.valueOf(workoutSessionId), p.goodForm(), today);
    }

    @Transactional
    public void onAssessmentFinished(long userId, long assessmentSessionId) {
        Policy p = policy();
        if (p == null) return;
        award(userId, "ASSESSMENT", String.valueOf(assessmentSessionId), p.assessment(), LocalDate.now());
    }

    private boolean award(long userId, String type, String ref, int points, LocalDate date) {
        if (points <= 0) return false;
        return jdbc.update("INSERT IGNORE INTO exp_events (user_id, event_type, ref_key, points, event_date, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                userId, type, ref, points, Date.valueOf(date), Timestamp.from(Instant.now())) > 0;
    }

    // ------------------------------------------------------------------ chuyên cần cho engine level

    /** Chuyên cần của người dùng theo tham số của rule set đang đánh giá; null khi tính năng tắt (engine bỏ qua cổng và điểm cộng). */
    public Attendance attendance(long userId, RuleParams params) {
        Policy p = policy(params);
        if (p == null) return null;
        long[] w = windowTotals(userId, p);
        double score = Math.min(100.0, w[0] * 100.0 / p.targetExp());
        return new Attendance(Math.round(score * 100.0) / 100.0, w[1] > 0, p.minScore(), p.bonusMax());
    }

    /** {tổng EXP trong cửa sổ, số sự kiện}. */
    private long[] windowTotals(long userId, Policy p) {
        LocalDate since = LocalDate.now().minusDays(p.windowDays() - 1L);
        return jdbc.query("SELECT COALESCE(SUM(points), 0), COUNT(*) FROM exp_events WHERE user_id = ? AND event_date >= ?",
                rs -> { rs.next(); return new long[]{rs.getLong(1), rs.getLong(2)}; }, userId, Date.valueOf(since));
    }

    // ------------------------------------------------------------------ hiển thị

    @Transactional(readOnly = true)
    public Summary summary(long userId) {
        Policy p = policy();
        Long total = jdbc.queryForObject("SELECT COALESCE(SUM(points), 0) FROM exp_events WHERE user_id = ?", Long.class, userId);
        long totalExp = total == null ? 0 : total;
        LocalDate today = LocalDate.now();
        Integer checked = jdbc.queryForObject("SELECT COUNT(*) FROM daily_checkins WHERE user_id = ? AND checkin_date = ?", Integer.class, userId, Date.valueOf(today));
        Set<LocalDate> days = new HashSet<>();
        jdbc.query("SELECT event_date FROM exp_events WHERE user_id = ? AND event_type = 'CHECKIN' AND event_date >= ?",
                rch -> { days.add(rch.getDate(1).toLocalDate()); }, userId, Date.valueOf(today.minusDays(120)));
        LocalDate cursor = days.contains(today) ? today : today.minusDays(1);       // chưa điểm danh hôm nay thì chuỗi vẫn còn nếu hôm qua có
        int streak = 0;
        while (days.contains(cursor)) { streak++; cursor = cursor.minusDays(1); }
        List<Event> recent = jdbc.query("SELECT event_type, ref_key, points, event_date FROM exp_events WHERE user_id = ? ORDER BY id DESC LIMIT 8",
                (rs, i) -> new Event(rs.getString(1), rs.getString(2), rs.getInt(3), rs.getDate(4).toLocalDate()), userId);
        int level = (int) (totalExp / EXP_PER_LEVEL) + 1;
        int inLevel = (int) (totalExp % EXP_PER_LEVEL);
        if (p == null) return new Summary(false, totalExp, level, inLevel, EXP_PER_LEVEL, checked != null && checked > 0, streak, null, null, null, null, null, null, null, recent);
        long[] w = windowTotals(userId, p);
        double score = Math.round(Math.min(100.0, w[0] * 100.0 / p.targetExp()) * 100.0) / 100.0;
        return new Summary(true, totalExp, level, inLevel, EXP_PER_LEVEL, checked != null && checked > 0, streak, p.windowDays(), (int) w[0], p.targetExp(), score,
                p.minScore(), score >= p.minScore(), p.bonusMax(), recent);
    }
}
