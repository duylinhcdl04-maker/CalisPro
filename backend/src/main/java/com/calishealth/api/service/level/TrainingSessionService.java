package com.calishealth.api.service.level;

import com.calishealth.api.dto.TrainingSessionDtos.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.*;

/**
 * Buổi tập hôm nay lấy từ giáo án học viên đang tập (giáo án hệ thống hoặc danh sách tự tạo) và việc ghi lại kết quả buổi tập.
 * Buổi tập chỉ được tính là COMPLETED khi làm đủ COMPLETE_RATIO số hiệp theo kế hoạch; buổi COMPLETED của giáo án hệ thống là bằng chứng cho
 * chu kỳ và đánh giá định kỳ. Rep/giây do AI đo (movementSessionId) được gắn vào buổi tập để điểm form được tính vào Skill Tree.
 */
@Service
public class TrainingSessionService {
    public static final double COMPLETE_RATIO = 0.6;

    private final JdbcTemplate jdbc;
    private final PlanChoiceService planChoice;
    private final TrainingLogService trainingLog;
    private final AiReadinessService aiReadiness;

    /** Tùy chọn: buổi tập hoàn thành của giáo án hệ thống cộng EXP chuyên cần (khi rule set bật EXP). */
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.calishealth.api.service.exp.ExpService exp;

    public TrainingSessionService(JdbcTemplate jdbc, PlanChoiceService planChoice, TrainingLogService trainingLog, AiReadinessService aiReadiness) {
        this.jdbc = jdbc; this.planChoice = planChoice; this.trainingLog = trainingLog; this.aiReadiness = aiReadiness;
    }

    // ------------------------------------------------------------------ hôm nay tập gì

    @Transactional(readOnly = true)
    public TodayWorkout today(Long userId) {
        String mode = planChoice.effectiveMode(userId);
        if (mode == null) return empty("NO_PLAN", "Bạn chưa chọn cách tập. Hãy chọn tập theo giáo án của hệ thống hoặc tự tạo danh sách bài tập.");
        boolean self = PlanChoiceService.SELF.equals(mode);
        String levelCode = planChoice.status(userId).levelCode();
        List<Object[]> plans = jdbc.query("SELECT id, name, cycle_number FROM workout_plans WHERE user_id = ? AND status = 'ACTIVE' AND "
                + (self ? "generation_reason = 'USER_SELF_BUILT'" : "(generation_reason IS NULL OR generation_reason <> 'USER_SELF_BUILT')")
                + " ORDER BY start_date DESC, id DESC LIMIT 1", (rs, i) -> new Object[]{rs.getLong(1), rs.getString(2), (Integer) rs.getObject(3)}, userId);
        if (plans.isEmpty()) return empty("NO_PLAN", self ? "Danh sách bài tập của bạn đang trống." : "Chưa có chu kỳ tập nào. Hãy tạo chu kỳ theo level của bạn.");
        long planId = (Long) plans.get(0)[0];
        String planName = (String) plans.get(0)[1];
        Integer cycleNumber = (Integer) plans.get(0)[2];
        String source = self ? PlanChoiceService.SELF : PlanChoiceService.SYSTEM;

        List<Object[]> days = jdbc.query("SELECT id, day_number, week_number, name, focus, estimated_duration_min FROM workout_plan_days WHERE workout_plan_id = ? AND rest_day = 0 ORDER BY day_number",
                (rs, i) -> new Object[]{rs.getLong(1), rs.getInt(2), (Integer) rs.getObject(3), rs.getString(4), rs.getString(5), (Integer) rs.getObject(6)}, planId);
        Set<Long> done = new HashSet<>(jdbc.queryForList("SELECT DISTINCT workout_plan_day_id FROM workout_sessions WHERE user_id = ? AND workout_plan_id = ? AND status = 'COMPLETED' AND workout_plan_day_id IS NOT NULL",
                Long.class, userId, planId));
        int planned = days.size();
        int doneCount = (int) days.stream().filter(d -> done.contains((Long) d[0])).count();
        Object[] next = self ? (days.isEmpty() ? null : days.get(0)) : days.stream().filter(d -> !done.contains((Long) d[0])).findFirst().orElse(null);
        if (next == null) {
            return new TodayWorkout(days.isEmpty() ? "NO_PLAN" : "CYCLE_DONE", days.isEmpty() ? "Giáo án chưa có buổi tập nào." : "Bạn đã tập hết các buổi của chu kỳ này. Hãy làm đánh giá định kỳ để xét lên level.",
                    planId, planName, source, levelCode, cycleNumber, null, null, null, null, null, null, doneCount, planned, null, List.of());
        }
        long dayId = (Long) next[0];
        List<Long> active = jdbc.queryForList("SELECT id FROM workout_sessions WHERE user_id = ? AND workout_plan_id = ? AND workout_plan_day_id = ? AND status = 'IN_PROGRESS' ORDER BY id DESC LIMIT 1",
                Long.class, userId, planId, dayId);
        List<TodayExercise> exercises = exercisesOf(dayId, !self);
        return new TodayWorkout("READY", null, planId, planName, source, levelCode, cycleNumber, dayId, (Integer) next[1], (Integer) next[2], (String) next[3], (String) next[4],
                (Integer) next[5], doneCount, planned, active.isEmpty() ? null : active.get(0), exercises);
    }

    private static TodayWorkout empty(String state, String message) {
        return new TodayWorkout(state, message, null, null, null, null, null, null, null, null, null, null, null, 0, 0, null, List.of());
    }

    private List<TodayExercise> exercisesOf(long dayId, boolean recommended) {
        List<Object[]> rows = jdbc.query("""
                SELECT x.exercise_id, e.code, e.name, e.thumbnail_url, e.video_url, x.section_type, x.sequence_no, x.sets, x.target_reps_min, x.target_reps_max,
                       x.target_duration_sec, x.rest_seconds, x.target_rpe, x.tempo, x.notes, COALESCE(e.execution_instructions, e.instructions)
                FROM workout_plan_exercises x JOIN exercises e ON e.id = x.exercise_id WHERE x.workout_plan_day_id = ? ORDER BY x.sequence_no""",
                (rs, i) -> new Object[]{rs.getLong(1), rs.getString(2), rs.getString(3), rs.getString(4), rs.getString(5), rs.getString(6), rs.getInt(7), (Integer) rs.getObject(8),
                        (Integer) rs.getObject(9), (Integer) rs.getObject(10), (Integer) rs.getObject(11), (Integer) rs.getObject(12), rs.getBigDecimal(13), rs.getString(14),
                        rs.getString(15), rs.getString(16)}, dayId);
        Map<Long, AiInfo> ai = aiReadiness.infoFor(rows.stream().map(r -> (Long) r[0]).distinct().toList());
        List<TodayExercise> out = new ArrayList<>();
        for (Object[] r : rows) {
            long exId = (Long) r[0];
            out.add(new TodayExercise(exId, (String) r[1], (String) r[2], (String) r[3], (String) r[4], (String) r[5], (Integer) r[6],
                    r[7] == null ? 1 : (Integer) r[7], (Integer) r[8], (Integer) r[9], (Integer) r[10], (Integer) r[11],
                    r[12] == null ? null : ((java.math.BigDecimal) r[12]).doubleValue(), (String) r[13], (String) r[14], (String) r[15], recommended,
                    ai.getOrDefault(exId, new AiInfo(false, false, null, null, null, null, List.of(), AiReadinessService.NOT_READY, false, false))));
        }
        return out;
    }

    // ------------------------------------------------------------------ bắt đầu / kết thúc buổi tập

    @Transactional
    public StartSessionResponse start(Long userId, StartSessionRequest req) {
        if (req == null || req.planId() == null || req.dayId() == null) throw new IllegalArgumentException("Cần planId và dayId của buổi tập.");
        Integer ok = jdbc.queryForObject("SELECT COUNT(*) FROM workout_plans p JOIN workout_plan_days d ON d.workout_plan_id = p.id WHERE p.id = ? AND p.user_id = ? AND d.id = ?",
                Integer.class, req.planId(), userId, req.dayId());
        if (ok == null || ok == 0) throw new IllegalArgumentException("Không tìm thấy buổi tập trong giáo án của bạn.");
        List<Long> open = jdbc.queryForList("SELECT id FROM workout_sessions WHERE user_id = ? AND workout_plan_id = ? AND workout_plan_day_id = ? AND status = 'IN_PROGRESS' ORDER BY id DESC LIMIT 1",
                Long.class, userId, req.planId(), req.dayId());
        if (!open.isEmpty()) return new StartSessionResponse(open.get(0), true);
        KeyHolder keys = new GeneratedKeyHolder();
        jdbc.update(con -> {
            PreparedStatement ps = con.prepareStatement("INSERT INTO workout_sessions (user_id, workout_plan_id, workout_plan_day_id, started_at, status) VALUES (?, ?, ?, ?, 'IN_PROGRESS')", Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, userId); ps.setLong(2, req.planId()); ps.setLong(3, req.dayId()); ps.setTimestamp(4, Timestamp.from(Instant.now()));
            return ps;
        }, keys);
        return new StartSessionResponse(keys.getKey().longValue(), false);
    }

    @Transactional
    public FinishSessionResponse finish(Long userId, long sessionId, FinishSessionRequest req) {
        List<Object[]> rows = jdbc.query("SELECT status, workout_plan_day_id FROM workout_sessions WHERE id = ? AND user_id = ?",
                (rs, i) -> new Object[]{rs.getString(1), rs.getObject(2) == null ? null : rs.getLong(2)}, sessionId, userId);
        if (rows.isEmpty()) throw new IllegalArgumentException("Không tìm thấy buổi tập.");
        if (!"IN_PROGRESS".equals(rows.get(0)[0])) throw new IllegalStateException("SESSION_CLOSED: Buổi tập này đã kết thúc.");
        Long dayId = (Long) rows.get(0)[1];
        List<ExerciseInput> inputs = req == null || req.exercises() == null ? List.of() : req.exercises();

        int seq = 0, completedSets = 0, plannedFromInput = 0, aiSets = 0;
        for (ExerciseInput ex : inputs) {
            if (ex.exerciseId() == null) continue;
            Integer exists = jdbc.queryForObject("SELECT COUNT(*) FROM exercises WHERE id = ?", Integer.class, ex.exerciseId());
            if (exists == null || exists == 0) throw new IllegalArgumentException("Không tìm thấy bài tập " + ex.exerciseId() + ".");
            List<SetInput> sets = ex.sets() == null ? List.of() : ex.sets().stream().filter(s -> s.reps() != null || s.durationSeconds() != null).toList();
            int plannedSets = ex.plannedSets() == null ? sets.size() : ex.plannedSets();
            plannedFromInput += plannedSets;
            KeyHolder keys = new GeneratedKeyHolder();
            final int sequenceNo = ++seq;
            jdbc.update(con -> {
                PreparedStatement ps = con.prepareStatement("INSERT INTO workout_session_exercises (workout_session_id, exercise_id, planned_sets, completed_sets, sequence_no, started_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?)", Statement.RETURN_GENERATED_KEYS);
                ps.setLong(1, sessionId); ps.setLong(2, ex.exerciseId()); ps.setInt(3, plannedSets); ps.setInt(4, sets.size()); ps.setInt(5, sequenceNo);
                ps.setTimestamp(6, Timestamp.from(Instant.now())); ps.setTimestamp(7, sets.isEmpty() ? null : Timestamp.from(Instant.now()));
                return ps;
            }, keys);
            long sessionExerciseId = keys.getKey().longValue();
            int n = 0;
            for (SetInput s : sets) {
                n++;
                jdbc.update("INSERT INTO exercise_sets (workout_session_exercise_id, set_number, reps, duration_seconds, rest_seconds, completed, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)",
                        sessionExerciseId, s.setNumber() != null ? s.setNumber() : n, s.reps(), s.durationSeconds(), s.restSeconds(), Timestamp.from(Instant.now()));
                completedSets++;
                if ("AI".equals(s.source())) aiSets++;
                if (s.movementSessionId() != null)
                    jdbc.update("UPDATE movement_sessions SET workout_session_id = ? WHERE id = ? AND user_id = ?", sessionId, s.movementSessionId(), userId);
            }
        }

        int planned = dayId == null ? plannedFromInput : jdbc.queryForObject("SELECT COALESCE(SUM(COALESCE(sets, 1)), 0) FROM workout_plan_exercises WHERE workout_plan_day_id = ?", Integer.class, dayId);
        if (planned <= 0) planned = plannedFromInput;
        double ratio = planned <= 0 ? 0 : Math.min(1.0, completedSets / (double) planned);
        boolean wantsComplete = req == null || req.status() == null || "COMPLETED".equalsIgnoreCase(req.status());
        String status = wantsComplete && ratio >= COMPLETE_RATIO ? "COMPLETED" : "ABANDONED";
        jdbc.update("UPDATE workout_sessions SET status = ?, completed_at = ?, duration_seconds = ?, difficulty_rating = ?, energy_level = ?, notes = ? WHERE id = ?",
                status, Timestamp.from(Instant.now()), req == null ? null : req.durationSeconds(), req == null ? null : req.difficultyRating(),
                req == null ? null : req.energyLevel(), req == null ? null : req.notes(), sessionId);
        if ("COMPLETED".equals(status)) {
            trainingLog.onWorkoutCompleted(userId, sessionId);
            if (exp != null) exp.onSessionCompleted(userId, sessionId, completedSets, aiSets);
        }
        return new FinishSessionResponse(sessionId, status, Math.round(ratio * 100) / 100.0, completedSets, planned, aiSets);
    }
}
