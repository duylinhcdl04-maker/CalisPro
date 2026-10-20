package com.calishealth.api.service.home;

import com.calishealth.api.dto.HomeDtos.*;
import com.calishealth.api.dto.LevelEngineDtos.CompetencyDto;
import com.calishealth.api.dto.LevelEngineDtos.FitnessStateDto;
import com.calishealth.api.dto.TrainingSessionDtos.TodayWorkout;
import com.calishealth.api.service.exp.ExpService;
import com.calishealth.api.service.level.FitnessStateService;
import com.calishealth.api.service.level.TrainingSessionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Tổng hợp trang Tổng quan từ dữ liệu thật: level và năng lực (Level Engine), buổi tập hôm nay (giáo án đang tập), tuần của chu kỳ,
 * chuỗi điểm danh (EXP), check-in sức khỏe gần nhất, kỷ lục cá nhân (các hiệp đã hoàn thành). Không có dữ liệu thì trả null/rỗng chứ không điền số mẫu.
 */
@Service
public class HomeService {
    private static final Logger log = LoggerFactory.getLogger(HomeService.class);
    /** Check-in cũ hơn số ngày này không còn phản ánh trạng thái hôm nay. */
    static final int READINESS_MAX_AGE_DAYS = 3;
    /** Kỷ lục mới trong khoảng này được tính là "vừa cải thiện". */
    static final int RECENT_RECORD_DAYS = 14;
    static final int MAX_RECORDS = 3;
    private static final ZoneId ZONE = ZoneId.systemDefault();

    private final JdbcTemplate jdbc;
    private final FitnessStateService fitnessState;
    private final TrainingSessionService training;
    private final ExpService exp;

    public HomeService(JdbcTemplate jdbc, FitnessStateService fitnessState, TrainingSessionService training, ExpService exp) {
        this.jdbc = jdbc; this.fitnessState = fitnessState; this.training = training; this.exp = exp;
    }

    @Transactional(readOnly = true)
    public HomeResponse home(long userId) {
        FitnessStateDto state = safeState(userId);
        LevelInfo level = state == null || state.level() == null ? null : new LevelInfo(state.level().code(), state.level().status(), state.level().source());
        List<CompetencyScore> competencies = state == null ? List.of()
                : state.competencies().stream().map(c -> new CompetencyScore(c.code(), c.name(), c.score())).toList();

        TodayWorkout today = training.today(userId);
        int exerciseCount = today.exercises() == null ? 0 : today.exercises().size();
        TodayInfo todayInfo = new TodayInfo(today.state(), today.message(), today.planName(), today.planSource(), today.dayName(), today.focus(),
                today.estimatedMinutes(), exerciseCount, today.sessionsDone(), today.sessionsPlanned(), today.activeSessionId());

        CycleInfo cycle = null;
        WeekSummary week = null;
        if (today.planId() != null) {
            List<Map<String, Object>> plan = jdbc.queryForList("SELECT start_date, end_date, cycle_number FROM workout_plans WHERE id = ?", today.planId());
            if (!plan.isEmpty() && plan.get(0).get("start_date") != null && plan.get(0).get("end_date") != null) {
                LocalDate start = ((Date) plan.get(0).get("start_date")).toLocalDate(), end = ((Date) plan.get(0).get("end_date")).toLocalDate();
                // Số tuần lấy từ các buổi của giáo án; thiếu thì suy từ ngày (chu kỳ lưu ngày kết thúc = ngày bắt đầu + số tuần × 7)
                Integer lastWeek = jdbc.queryForObject("SELECT MAX(week_number) FROM workout_plan_days WHERE workout_plan_id = ?", Integer.class, today.planId());
                int weeksTotal = lastWeek != null && lastWeek > 0 ? lastWeek : Math.max(1, (int) Math.ceil(ChronoUnit.DAYS.between(start, end) / 7.0));
                int weekIndex = (int) Math.max(1, Math.min(weeksTotal, ChronoUnit.DAYS.between(start, LocalDate.now()) / 7 + 1));
                cycle = new CycleInfo(today.planName(), today.cycleNumber(), weekIndex, weeksTotal, today.sessionsDone(), today.sessionsPlanned());
                week = weekSummary(userId, today.planId(), start, weekIndex, weeksTotal, today.sessionsPlanned());
            }
        }

        ExpService.Summary expSummary = exp.summary(userId);
        Readiness readiness = readiness(userId);
        List<PersonalRecord> records = records(userId);
        String goal = state == null ? null : goalName(state.primaryGoal());
        return new HomeResponse(level, state == null ? null : state.overallScore(), competencies, state == null ? null : state.weakestCompetency(), goal,
                todayInfo, cycle, week, expSummary.streakDays(), expSummary.checkedInToday(), readiness, records,
                insight(state, today, records));
    }

    private FitnessStateDto safeState(long userId) {
        try {
            return fitnessState.state(userId);
        } catch (RuntimeException e) {
            log.warn("Không đọc được trạng thái thể lực của user {}: {}", userId, e.getMessage());
            return null;       // chưa có Level Engine đang chạy: trang vẫn hiển thị các phần còn lại
        }
    }

    private String goalName(String codeOrName) {
        if (codeOrName == null || codeOrName.isBlank()) return null;
        List<String> names = jdbc.queryForList("SELECT name FROM goals WHERE code = ?", String.class, codeOrName);
        return names.isEmpty() ? codeOrName : names.get(0);
    }

    // ------------------------------------------------------------------ tuần của chu kỳ

    private WeekSummary weekSummary(long userId, long planId, LocalDate start, int weekIndex, int weeksTotal, int sessionsPlanned) {
        LocalDate from = start.plusDays(7L * (weekIndex - 1)), to = from.plusDays(7);
        Integer plannedThisWeek = jdbc.queryForObject("SELECT COUNT(*) FROM workout_plan_days WHERE workout_plan_id = ? AND rest_day = 0 AND week_number = ?", Integer.class, planId, weekIndex);
        int planned = plannedThisWeek != null && plannedThisWeek > 0 ? plannedThisWeek : (int) Math.round(sessionsPlanned / (double) weeksTotal);
        return jdbc.query("""
                SELECT COUNT(*), COALESCE(SUM(COALESCE(duration_seconds, 0)), 0) FROM workout_sessions
                WHERE user_id = ? AND workout_plan_id = ? AND status = 'COMPLETED' AND COALESCE(completed_at, started_at) >= ? AND COALESCE(completed_at, started_at) < ?""",
                rs -> { rs.next(); return new WeekSummary(rs.getInt(1), planned, (int) Math.round(rs.getLong(2) / 60.0)); },
                userId, planId, Timestamp.from(from.atStartOfDay(ZONE).toInstant()), Timestamp.from(to.atStartOfDay(ZONE).toInstant()));
    }

    // ------------------------------------------------------------------ sự sẵn sàng từ check-in

    /** Check-in gần nhất trong READINESS_MAX_AGE_DAYS ngày, hoặc null. */
    Readiness readiness(long userId) {
        LocalDate since = LocalDate.now().minusDays(READINESS_MAX_AGE_DAYS);
        List<Readiness> rows = jdbc.query("""
                SELECT checkin_date, energy_level, sleep_hours, muscle_soreness, stress_level, motivation_level FROM daily_checkins
                WHERE user_id = ? AND checkin_date >= ? ORDER BY checkin_date DESC, id DESC LIMIT 1""", (rs, i) -> {
            LocalDate date = rs.getDate(1).toLocalDate();
            Integer energy = (Integer) rs.getObject(2), soreness = (Integer) rs.getObject(4), stress = (Integer) rs.getObject(5), motivation = (Integer) rs.getObject(6);
            Double sleep = rs.getObject(3) == null ? null : rs.getDouble(3);
            Integer score = readinessScore(energy, sleep, soreness, stress);
            if (score == null) return null;
            return new Readiness(date.toString(), date.equals(LocalDate.now()), energy, sleep, soreness, stress, motivation, score, readinessLevel(score));
        }, userId, Date.valueOf(since));
        return rows.isEmpty() ? null : rows.get(0);
    }

    /**
     * Điểm sẵn sàng 0-100 từ bốn chỉ số của check-in: năng lượng 35%, giấc ngủ 30% (đủ khi từ 8 giờ), đau mỏi cơ 20% (ít thì tốt), căng thẳng 15% (ít thì tốt).
     * Chỉ số nào người dùng bỏ trống thì loại khỏi công thức và chia lại trọng số; không có chỉ số nào thì không có điểm (null), không điền 0.
     */
    static Integer readinessScore(Integer energy, Double sleepHours, Integer soreness, Integer stress) {
        double sum = 0, weight = 0;
        if (energy != null) { sum += 0.35 * norm(energy); weight += 0.35; }
        if (sleepHours != null) { sum += 0.30 * Math.max(0, Math.min(1, sleepHours / 8.0)); weight += 0.30; }
        if (soreness != null) { sum += 0.20 * (1 - norm(soreness)); weight += 0.20; }
        if (stress != null) { sum += 0.15 * (1 - norm(stress)); weight += 0.15; }
        return weight == 0 ? null : (int) Math.round(100 * sum / weight);
    }

    private static double norm(int v) { return (Math.max(1, Math.min(5, v)) - 1) / 4.0; }

    static String readinessLevel(int score) { return score >= 70 ? "GOOD" : score >= 40 ? "MEDIUM" : "LOW"; }

    // ------------------------------------------------------------------ kỷ lục cá nhân

    /**
     * Kỷ lục của mỗi bài = hiệp tốt nhất đã hoàn thành trong các buổi COMPLETED (rep, hoặc giây với bài giữ tư thế). Bài có kỷ lục mới gần đây xếp trước.
     * "vừa cải thiện" khi kỷ lục được lập trong RECENT_RECORD_DAYS ngày và vượt kỷ lục trước đó.
     */
    List<PersonalRecord> records(long userId) {
        record Row(long exerciseId, String name, Instant at, Integer reps, Integer secs) {}
        List<Row> rows = jdbc.query("""
                SELECT e.id, e.name, COALESCE(ws.completed_at, ws.started_at) AS at, MAX(s.reps), MAX(s.duration_seconds)
                FROM exercise_sets s
                JOIN workout_session_exercises wse ON wse.id = s.workout_session_exercise_id
                JOIN workout_sessions ws ON ws.id = wse.workout_session_id
                JOIN exercises e ON e.id = wse.exercise_id
                WHERE ws.user_id = ? AND ws.status = 'COMPLETED' AND s.completed = 1
                GROUP BY e.id, e.name, ws.id, at ORDER BY at""",
                (rs, i) -> new Row(rs.getLong(1), rs.getString(2), rs.getTimestamp(3).toInstant(), (Integer) rs.getObject(4), (Integer) rs.getObject(5)), userId);

        Map<Long, List<Row>> byExercise = new LinkedHashMap<>();
        rows.forEach(r -> byExercise.computeIfAbsent(r.exerciseId(), k -> new ArrayList<>()).add(r));

        record Entry(PersonalRecord record, Instant improvedAt) {}
        List<Entry> entries = new ArrayList<>();
        Instant recentCutoff = Instant.now().minus(RECENT_RECORD_DAYS, ChronoUnit.DAYS);
        for (List<Row> list : byExercise.values()) {
            boolean reps = list.stream().anyMatch(r -> r.reps() != null && r.reps() > 0);
            int best = 0, previousBest = 0;
            Instant improvedAt = null;
            for (Row r : list) {
                int v = reps ? (r.reps() == null ? 0 : r.reps()) : (r.secs() == null ? 0 : r.secs());
                if (v > best) { previousBest = best; best = v; improvedAt = r.at(); }
            }
            if (best <= 0) continue;
            boolean recent = improvedAt != null && improvedAt.isAfter(recentCutoff);
            String label = recent
                    ? (previousBest > 0 ? "+" + format(best - previousBest, reps) + " so với kỷ lục trước" : "Kỷ lục đầu tiên")
                    : "Đạt ngày " + String.format("%02d/%02d", improvedAt.atZone(ZONE).getDayOfMonth(), improvedAt.atZone(ZONE).getMonthValue());
            entries.add(new Entry(new PersonalRecord(list.get(0).name(), format(best, reps), reps ? "reps" : "", recent ? "up" : "flat", label), improvedAt));
        }
        entries.sort(Comparator.comparing(Entry::improvedAt).reversed());
        return entries.stream().limit(MAX_RECORDS).map(Entry::record).toList();
    }

    private static String format(int value, boolean reps) {
        return reps ? String.valueOf(value) : String.format("%d:%02d", value / 60, value % 60);
    }

    // ------------------------------------------------------------------ nhận xét từ dữ liệu

    /**
     * Quy tắc cố định, không dùng AI sinh văn bản: ưu tiên kỷ lục mới, rồi năng lực yếu nhất đã đo. Không có đủ dữ liệu thì không có nhận xét.
     */
    Insight insight(FitnessStateDto state, TodayWorkout today, List<PersonalRecord> records) {
        for (PersonalRecord r : records)
            if ("up".equals(r.trend()) && !"Kỷ lục đầu tiên".equals(r.changeLabel()))
                return new Insight("Bạn vừa lập kỷ lục mới ở " + r.exercise(), "Kỷ lục hiện tại: " + r.value() + (r.unit().isEmpty() ? "" : " " + r.unit()) + " (" + r.changeLabel() + "). Hãy giữ nhịp tập đều để duy trì đà tăng.", "Xem tiến độ");
        if (state == null || state.competencies() == null) return null;
        CompetencyDto weakest = state.competencies().stream().filter(c -> c.score() != null && c.code().equals(state.weakestCompetency())).findFirst().orElse(null);
        if (weakest == null) return null;
        boolean systemPlan = "SYSTEM".equals(today.planSource());
        String score = Math.round(weakest.score()) + "/100";
        return new Insight("Năng lực cần cải thiện nhất: " + weakest.name(),
                weakest.name() + " đang là năng lực thấp nhất của bạn (" + score + ")."
                        + (systemPlan ? " Giáo án hệ thống đã ưu tiên thêm hiệp cho phần này; hãy tập đủ các buổi để thấy tiến bộ ở lần đánh giá tới." : " Hãy thêm các bài cho phần này vào danh sách tập của bạn."),
                "Xem tiến độ");
    }
}
