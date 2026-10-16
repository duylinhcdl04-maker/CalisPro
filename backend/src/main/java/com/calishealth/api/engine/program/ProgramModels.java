package com.calishealth.api.engine.program;

import java.util.*;

/** Kiểu dữ liệu của engine chọn giáo án và sinh chu kỳ tập. */
public final class ProgramModels {
    private ProgramModels() {}

    /** Giáo án mẫu đã chuẩn hoá cho việc so khớp. levelMin/Max/primary là rank (L0 = 0). */
    public record TemplateCandidate(Long id, String code, int version, String name, int levelMin, int levelMax, int primaryLevel,
                                    List<String> goalCodes, int daysMin, int daysMax, int sessionMinutes,
                                    Set<String> requiredEquipment, Map<String, Double> emphasis, int priority) {}

    public record MatchProfile(int levelRank, String primaryGoal, String primaryGoalCategory, List<String> secondaryGoals,
                              int daysPerWeek, int sessionMinutes, Set<String> equipment,
                              Map<String, Double> competencyScores, List<String> recentTemplateCodes) {}

    public record MatchScore(TemplateCandidate template, double score, Map<String, Double> breakdown) {}

    public record Rejection(TemplateCandidate template, String reason) {}

    public record MatchResult(List<MatchScore> ranked, List<Rejection> rejected) {
        public Optional<MatchScore> best() { return ranked.isEmpty() ? Optional.empty() : Optional.of(ranked.get(0)); }
    }

    /** Một bài trong buổi tập (từ giáo án mẫu hoặc khung mặc định) - có thể bị engine điều chỉnh. */
    public static final class PlannedExercise {
        public Long exerciseId;
        public Long templateExerciseId;
        public String competency;
        public String section;          // WARMUP | MAIN | SKILL | ACCESSORY | COOLDOWN
        public int sets;
        public Integer repMin, repMax, holdSec, restSec;
        public String tempo;
        public Double rpe;
        public String notes;
        public boolean locked;
        public String selectionReason;

        public PlannedExercise copy() {
            PlannedExercise p = new PlannedExercise();
            p.exerciseId = exerciseId; p.templateExerciseId = templateExerciseId; p.competency = competency; p.section = section;
            p.sets = sets; p.repMin = repMin; p.repMax = repMax; p.holdSec = holdSec; p.restSec = restSec; p.tempo = tempo;
            p.rpe = rpe; p.notes = notes; p.locked = locked; p.selectionReason = selectionReason;
            return p;
        }
    }

    public static final class PlannedDay {
        public int weekNumber;
        public int dayIndex;
        public String name;
        public String focus;
        public boolean restDay;
        public boolean deload;
        public Integer estimatedMinutes;
        public List<PlannedExercise> exercises = new ArrayList<>();
    }
}
