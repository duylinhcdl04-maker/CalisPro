package com.calishealth.api.service.level;

import com.calishealth.api.engine.config.RuleSetConfig;
import com.calishealth.api.engine.level.LevelModels.TrainingObservation;
import com.calishealth.api.engine.skill.SkillGraph;
import com.calishealth.api.entity.*;
import com.calishealth.api.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Nhật ký tập -> dữ liệu cho Stability Gate và Skill Tree.
 * Thành tích một bài trong buổi = rep (hoặc giây) tốt nhất trong các set hoàn thành; form = điểm FormAnalysis (MediaPipe) nếu có.
 */
@Service
public class TrainingLogService {
    private final WorkoutSessionExerciseRepository sessionExerciseRepo;
    private final ExerciseSetRepository setRepo;
    private final FormAnalysisRepository formRepo;
    private final DailyCheckinRepository checkinRepo;
    private final RuleSetProvider ruleSets;
    private final SkillProgressService skills;

    public TrainingLogService(WorkoutSessionExerciseRepository sessionExerciseRepo, ExerciseSetRepository setRepo,
                              FormAnalysisRepository formRepo, DailyCheckinRepository checkinRepo, RuleSetProvider ruleSets,
                              SkillProgressService skills) {
        this.sessionExerciseRepo = sessionExerciseRepo;
        this.setRepo = setRepo;
        this.formRepo = formRepo;
        this.checkinRepo = checkinRepo;
        this.ruleSets = ruleSets;
        this.skills = skills;
    }

    @Transactional(readOnly = true)
    public List<TrainingObservation> observations(Long userId, int days) {
        List<WorkoutSessionExercise> rows = sessionExerciseRepo.findCompletedSince(userId, Instant.now().minus(days, ChronoUnit.DAYS));
        return toObservations(rows);
    }

    private List<TrainingObservation> toObservations(List<WorkoutSessionExercise> rows) {
        if (rows.isEmpty()) return List.of();
        Map<Long, List<ExerciseSet>> sets = new HashMap<>();
        setRepo.findByWorkoutSessionExerciseIdIn(rows.stream().map(workoutSessionExercise -> workoutSessionExercise.getId()).toList())
                .forEach(s -> sets.computeIfAbsent(s.getWorkoutSessionExercise().getId(), k -> new ArrayList<>()).add(s));
        Map<String, Double> form = new HashMap<>();   // "sessionId:exerciseId" -> form tốt nhất
        formRepo.findByWorkoutSessionIds(rows.stream().map(r -> r.getWorkoutSession().getId()).distinct().toList()).forEach(f -> {
            if (f.getOverallScore() == null) return;
            String key = f.getMovementSession().getWorkoutSession().getId() + ":" + f.getMovementSession().getExercise().getId();
            form.merge(key, f.getOverallScore().doubleValue(), (left, right) -> Math.max(left, right));
        });
        List<TrainingObservation> out = new ArrayList<>();
        for (WorkoutSessionExercise r : rows) {
            double best = 0;
            for (ExerciseSet s : sets.getOrDefault(r.getId(), List.of())) {
                if (!s.isCompleted()) continue;
                if (s.getReps() != null) best = Math.max(best, s.getReps());
                else if (s.getDurationSeconds() != null) best = Math.max(best, s.getDurationSeconds());
            }
            Instant at = r.getWorkoutSession().getCompletedAt() != null ? r.getWorkoutSession().getCompletedAt() : r.getWorkoutSession().getStartedAt();
            out.add(new TrainingObservation(r.getExercise().getId(), at, best,
                    form.get(r.getWorkoutSession().getId() + ":" + r.getExercise().getId())));
        }
        return out;
    }

    /** Check-in 3 ngày gần nhất báo năng lượng rất thấp -> không tính lần đánh giá kém vào xu hướng giảm. */
    @Transactional(readOnly = true)
    public boolean recentIllness(Long userId) {
        LocalDate since = LocalDate.now().minusDays(3);
        return checkinRepo.findByUserIdOrderByCheckinDateDesc(userId).stream()
                .filter(c -> !c.getCheckinDate().isBefore(since))
                .anyMatch(c -> c.getEnergyLevel() != null && c.getEnergyLevel() <= 2);
    }

    /** Buổi tập vừa hoàn thành: bài có form đo bằng AI được tính vào Skill Tree (đủ số buổi đạt -> ACHIEVED). */
    @Transactional
    public void onWorkoutCompleted(Long userId, Long workoutSessionId) {
        RuleSetConfig rs;
        try {
            rs = ruleSets.active();
        } catch (IllegalStateException e) {
            return;  // chưa bật Level Engine
        }
        List<WorkoutSessionExercise> rows = sessionExerciseRepo.findWithExerciseBySessionId(workoutSessionId);
        if (rows.isEmpty()) return;
        SkillGraph graph = skills.graph(rs);
        for (TrainingObservation o : toObservations(rows)) {
            if (o.bestValue() <= 0) continue;
            skills.record(userId, rs, graph, o.exerciseId(), o.bestValue(), o.formScore(),
                    o.formScore() != null ? "AI_MEASURED" : "TRAINING_LOG");
        }
    }
}
