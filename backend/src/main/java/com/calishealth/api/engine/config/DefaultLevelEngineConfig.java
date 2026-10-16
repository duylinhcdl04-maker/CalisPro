package com.calishealth.api.engine.config;

import java.util.*;

/**
 * Cấu hình mặc định của Level Engine (rule set LEVEL_ENGINE v1) - nguồn duy nhất cho seeder và bộ test.
 *
 * QUAN TRỌNG: thang L0-L4 và mọi ngưỡng số ở đây là PRODUCT_RULE / COACHING_BENCHMARK của CalisHealth,
 * KHÔNG phải chuẩn do ACSM/NSCA công bố. Khung khoa học tham chiếu được ghi ở source_reference;
 * coach dự án cần duyệt và có thể chỉnh trong Admin (clone rule set -> sửa -> mô phỏng -> kích hoạt).
 */
public final class DefaultLevelEngineConfig {
    private DefaultLevelEngineConfig() {}

    public static final String RULE_SET_CODE = "LEVEL_ENGINE";
    public static final String PERIODIC_TEMPLATE_CODE = "CALISHEALTH_PERIODIC_V1";
    public static final String INITIAL_TEMPLATE_CODE = "CALISHEALTH_INITIAL_V2";

    public static final String SCIENTIFIC = "SCIENTIFIC_EVIDENCE", COACHING = "COACHING_BENCHMARK", PRODUCT = "PRODUCT_RULE";
    private static final String ACSM_2009 = "ACSM Position Stand 2009 - Progression models in resistance training (Med Sci Sports Exerc 41(3):687-708)";
    private static final String SCHOENFELD_2017 = "Schoenfeld, Ogborn & Krieger 2017 - weekly volume dose-response (J Sports Sci 35(11):1073-1082)";
    private static final String HOPKINS_2000 = "Hopkins 2000 - Measures of reliability in sports medicine and science (Sports Med 30(1):1-15)";
    private static final String PRINCE_2008 = "Prince et al. 2008 - direct vs self-report measures (Int J Behav Nutr Phys Act 5:56)";

    public record Param(String key, double value, String sourceType, String reference) {}
    public record CompetencySeed(String code, String name, boolean primary, String aggregation, int order, String description) {}
    public record ExerciseSeed(String code, String name, String category, String pattern, String difficulty, String equipment, String description) {}
    public record LadderSeed(String competency, String exerciseCode, int order, String metric, double base, double span, double target, double entry) {}
    public record LevelSeed(String code, int rank, String name, double promoteMin, double regressBelow, String color, String description) {}
    public record RequirementSeed(String level, String gate, String competency, String exerciseCode, String metric, String op, double value, String sourceType) {}
    public record ProgressionSeed(String prerequisite, String exercise, Integer minReps, Integer minHoldSec, Double minForm, boolean mandatory, double weight) {}
    public record ConsistencySeed(String code, String conditionJson, String severity, List<String> affected, String message) {}
    public record TestItemSeed(String exerciseCode, String competency, String metric, String levelMin, String levelMax, boolean mandatory, int order, String instruction) {}
    public record GoalSeed(String code, String name, String category, String targetExerciseCode, String emphasisJson, String description) {}

    // ============================== Tham số ==============================

    public static final List<Param> PARAMS = List.of(
            new Param("overall.weight.PUSH", 0.20, PRODUCT, "Đẩy/Kéo/Core là nền tảng của hầu hết kỹ năng calisthenics"),
            new Param("overall.weight.PULL", 0.20, PRODUCT, null),
            new Param("overall.weight.LEGS", 0.15, PRODUCT, null),
            new Param("overall.weight.CORE", 0.20, PRODUCT, null),
            new Param("overall.weight.MOBILITY", 0.10, PRODUCT, "Đo linh hoạt kém chính xác hơn và ít quyết định level"),
            new Param("overall.weight.SKILL", 0.15, PRODUCT, null),
            new Param("reliability.SELF_REPORTED", 0.50, PRODUCT, PRINCE_2008),
            new Param("reliability.AI_BASE", 0.90, PRODUCT, null),
            new Param("reliability.COACH_VERIFIED", 0.95, PRODUCT, null),
            new Param("reliability.ai.poseRef", 0.80, PRODUCT, null),
            new Param("reliability.ai.visibilityRef", 0.80, PRODUCT, null),
            new Param("quality.HIGH", 1.0, PRODUCT, null),
            new Param("quality.MEDIUM", 0.8, PRODUCT, null),
            new Param("quality.LOW", 0.6, PRODUCT, null),
            new Param("quality.CONFLICTED", 0.3, PRODUCT, null),
            new Param("quality.coverage.high", 0.9, PRODUCT, null),
            new Param("quality.coverage.medium", 0.7, PRODUCT, null),
            new Param("observation.ladderWeight", 3, PRODUCT, null),
            new Param("blend.halfLifeDays", 42, PRODUCT, null),
            new Param("blend.selfReportDamp", 0.1, PRODUCT, "Dữ liệu đo ưu tiên hơn dữ liệu tự khai báo"),
            new Param("blend.measuredMinReliability", 0.7, PRODUCT, null),
            new Param("ewma.alpha", 0.5, PRODUCT, null),
            new Param("trend.delta", 3, PRODUCT, HOPKINS_2000),
            new Param("band.BEGINNER", 25, PRODUCT, null),
            new Param("band.INTERMEDIATE", 50, PRODUCT, null),
            new Param("band.ADVANCED", 70, PRODUCT, null),
            new Param("band.ELITE", 85, PRODUCT, null),
            new Param("band.margin", 5, PRODUCT, null),
            new Param("provisional.maxRank", 2, PRODUCT, PRINCE_2008),
            new Param("provisional.screeningMaxRank", 1, PRODUCT, "Sàng lọc kiểu PAR-Q+ (Warburton et al. 2011) - không chẩn đoán"),
            new Param("gate.reliability.minPose", 0.60, PRODUCT, "MediaPipe/BlazePose landmark confidence (Bazarevsky et al. 2020)"),
            new Param("gate.reliability.minVisibility", 0.50, PRODUCT, null),
            new Param("gate.reliability.minTracked", 0.80, PRODUCT, null),
            new Param("regression.confirmations", 2, PRODUCT, null),
            new Param("regression.competencyMargin", 10, PRODUCT, null),
            new Param("stability.prevWindowWeeks", 10, PRODUCT, null),
            new Param("stability.logWindowDays", 21, PRODUCT, null),
            new Param("stability.logLastN", 4, PRODUCT, null),
            new Param("stability.logMinPass", 3, PRODUCT, null),
            new Param("fastTrack.margin", 10, PRODUCT, null),
            new Param("fastTrack.minReliability", 0.85, PRODUCT, null),
            new Param("level.L4.requiresCoachVerified", 1, PRODUCT, null),
            new Param("assessment.minIntervalDays", 14, PRODUCT, null),
            new Param("assessment.baselineDueDays", 14, PRODUCT, null),
            new Param("returning.inactiveDays", 28, PRODUCT, "Mujika & Padilla 2000 - Detraining Part I (Sports Med 30(2):79-87)"),
            new Param("returning.volumeFactor", 0.65, COACHING, null),
            new Param("deload.volumeFactor", 0.6, COACHING, null),
            new Param("cycle.weeks.L0", 4, PRODUCT, null),
            new Param("cycle.weeks.L1", 4, PRODUCT, null),
            new Param("cycle.weeks.L2", 5, PRODUCT, null),
            new Param("cycle.weeks.L3", 6, PRODUCT, null),
            new Param("cycle.weeks.L4", 6, PRODUCT, null),
            new Param("cycle.deload.minRank", 2, COACHING, "Rhea & Alderman 2004 - periodized vs nonperiodized (Res Q Exerc Sport 75(4):413-422)"),
            new Param("volume.maxSetsPerWeek.L0", 6, PRODUCT, SCHOENFELD_2017),
            new Param("volume.maxSetsPerWeek.L1", 10, PRODUCT, SCHOENFELD_2017),
            new Param("volume.maxSetsPerWeek.L2", 14, PRODUCT, SCHOENFELD_2017),
            new Param("volume.maxSetsPerWeek.L3", 18, PRODUCT, SCHOENFELD_2017),
            new Param("volume.maxSetsPerWeek.L4", 22, PRODUCT, SCHOENFELD_2017),
            new Param("volume.weakBonusSets", 2, PRODUCT, null),
            // Kê liều khung mặc định theo level (khoảng ACSM 2009 chuyển đổi cho calisthenics)
            new Param("dose.sets.L0", 2, PRODUCT, ACSM_2009), new Param("dose.sets.L1", 3, PRODUCT, ACSM_2009),
            new Param("dose.sets.L2", 3, PRODUCT, ACSM_2009), new Param("dose.sets.L3", 4, PRODUCT, ACSM_2009),
            new Param("dose.sets.L4", 4, PRODUCT, ACSM_2009),
            new Param("dose.repMin.L0", 8, PRODUCT, ACSM_2009), new Param("dose.repMax.L0", 12, PRODUCT, ACSM_2009),
            new Param("dose.repMin.L1", 6, PRODUCT, ACSM_2009), new Param("dose.repMax.L1", 12, PRODUCT, ACSM_2009),
            new Param("dose.repMin.L2", 5, PRODUCT, ACSM_2009), new Param("dose.repMax.L2", 10, PRODUCT, ACSM_2009),
            new Param("dose.repMin.L3", 3, PRODUCT, ACSM_2009), new Param("dose.repMax.L3", 8, PRODUCT, ACSM_2009),
            new Param("dose.repMin.L4", 3, PRODUCT, ACSM_2009), new Param("dose.repMax.L4", 6, PRODUCT, ACSM_2009),
            new Param("dose.holdSec.L0", 20, PRODUCT, null), new Param("dose.holdSec.L1", 30, PRODUCT, null),
            new Param("dose.holdSec.L2", 30, PRODUCT, null), new Param("dose.holdSec.L3", 20, PRODUCT, null),
            new Param("dose.holdSec.L4", 15, PRODUCT, null),
            new Param("dose.restSec.L0", 75, PRODUCT, ACSM_2009), new Param("dose.restSec.L1", 105, PRODUCT, ACSM_2009),
            new Param("dose.restSec.L2", 150, PRODUCT, ACSM_2009), new Param("dose.restSec.L3", 150, PRODUCT, ACSM_2009),
            new Param("dose.restSec.L4", 180, PRODUCT, ACSM_2009),
            new Param("dose.rir.L0", 3.5, PRODUCT, "Zourdos et al. 2016 - RIR-based RPE (J Strength Cond Res 30(1):267-275)"),
            new Param("dose.rir.L1", 2.5, PRODUCT, null), new Param("dose.rir.L2", 2, PRODUCT, null),
            new Param("dose.rir.L3", 1.5, PRODUCT, null), new Param("dose.rir.L4", 1, PRODUCT, null),
            new Param("match.w.goal", 0.35, PRODUCT, null),
            new Param("match.w.level", 0.25, PRODUCT, null),
            new Param("match.w.weakness", 0.20, PRODUCT, null),
            new Param("match.w.schedule", 0.10, PRODUCT, null),
            new Param("match.w.variety", 0.10, PRODUCT, null),
            new Param("match.minutesTolerance", 10, PRODUCT, null),
            new Param("rec.w.goal", 0.25, PRODUCT, null),
            new Param("rec.w.skillGap", 0.20, PRODUCT, null),
            new Param("rec.w.prerequisite", 0.15, PRODUCT, null),
            new Param("rec.w.difficulty", 0.15, PRODUCT, null),
            new Param("rec.w.weakness", 0.10, PRODUCT, null),
            new Param("rec.w.equipment", 0.10, PRODUCT, null),
            new Param("rec.w.recent", 0.05, PRODUCT, null),
            new Param("rec.w.overload", 0.10, PRODUCT, null),
            new Param("progression.minForm", 75, COACHING, null),
            new Param("progression.qualifyingSessions", 2, COACHING, null),
            new Param("session.warmupMin", 8, COACHING, null),
            new Param("session.cooldownMin", 5, COACHING, null),
            new Param("session.secPerRep", 3, PRODUCT, null)
    );

    // ============================== Năng lực ==============================

    public static final List<CompetencySeed> COMPETENCIES = List.of(
            new CompetencySeed("PUSH", "Sức mạnh đẩy", true, "MAX", 1, "Push-up, Dip, Pike/HSPU, Pseudo-planche"),
            new CompetencySeed("PULL", "Sức mạnh kéo", true, "MAX", 2, "Dead hang, Australian row, Pull-up, Chest-to-bar, Muscle-up"),
            new CompetencySeed("LEGS", "Chân", true, "MAX", 3, "Squat, Split squat, Shrimp, Pistol"),
            new CompetencySeed("CORE", "Thân giữa", true, "MAX", 4, "Plank, Hollow hold, Hanging leg raise, L-sit"),
            new CompetencySeed("MOBILITY", "Linh hoạt", true, "MEAN", 5, "Góc gập vai, gập hông, squat sâu"),
            new CompetencySeed("SKILL", "Kỹ năng thăng bằng", true, "MAX", 6, "Crow, Handstand"),
            new CompetencySeed("ENDURANCE", "Sức bền", false, "MAX", 7, "Năng lực phụ - chưa tính vào điểm tổng ở v1"),
            new CompetencySeed("BALANCE", "Thăng bằng", false, "MAX", 8, "Năng lực phụ"),
            new CompetencySeed("CONTROL", "Kiểm soát chuyển động", false, "MAX", 9, "Năng lực phụ"),
            new CompetencySeed("POWER", "Sức bật", false, "MAX", 10, "Năng lực phụ")
    );

    // ============================== Bài tập cần có ==============================
    // equipment: NONE | PULL_UP_BAR | PARALLEL_BARS | LOW_BAR (nhiều lựa chọn cách nhau bởi '|')

    public static final List<ExerciseSeed> EXERCISES = List.of(
            new ExerciseSeed("incline-push-up", "Incline Push Up", "PUSH", "Horizontal Push", "Beginner", "NONE", "Chống đẩy tay đặt trên bục/ghế - nấc khởi đầu của chuỗi đẩy."),
            new ExerciseSeed("pseudo-planche-push-up", "Pseudo Planche Push Up", "PUSH", "Horizontal Push", "Advanced", "NONE", "Chống đẩy dồn vai ra trước tay - nền tảng planche."),
            new ExerciseSeed("straight-bar-dip", "Straight Bar Dip", "PUSH", "Vertical Push", "Advanced", "PULL_UP_BAR", "Dip trên xà đơn - pha đẩy của muscle-up."),
            new ExerciseSeed("freestanding-handstand-push-up", "Freestanding Handstand Push Up", "SKILL", "Vertical Push", "Advanced", "NONE", "Chống đẩy trồng chuối tự do (biên độ một phần)."),
            new ExerciseSeed("scapular-pull-up", "Scapular Pull Up", "PULL", "Vertical Pull", "Beginner", "PULL_UP_BAR", "Treo xà, kéo/hạ xương bả vai không gập khuỷu."),
            new ExerciseSeed("negative-pull-up", "Negative Pull Up", "PULL", "Vertical Pull", "Beginner", "PULL_UP_BAR", "Bắt đầu ở đỉnh xà, hạ chậm tối thiểu 3 giây."),
            new ExerciseSeed("chest-to-bar-pull-up", "Chest To Bar Pull Up", "PULL", "Vertical Pull", "Advanced", "PULL_UP_BAR", "Kéo xà tới khi ngực chạm xà."),
            new ExerciseSeed("explosive-pull-up", "Explosive Pull Up", "PULL", "Vertical Pull", "Advanced", "PULL_UP_BAR", "Kéo xà bùng nổ, ngực vượt xà."),
            new ExerciseSeed("assisted-squat", "Assisted Squat", "LEGS", "Squat", "Beginner", "NONE", "Squat có bám tay hỗ trợ."),
            new ExerciseSeed("bulgarian-split-squat", "Bulgarian Split Squat", "LEGS", "Lunge", "Intermediate", "NONE", "Split squat chân sau gác ghế."),
            new ExerciseSeed("shrimp-squat", "Shrimp Squat", "LEGS", "Squat", "Advanced", "NONE", "Squat một chân, chân sau gập ra sau."),
            new ExerciseSeed("wall-pike-hold", "Wall Pike Hold", "SKILL", "Static Hold", "Beginner", "NONE", "Chân gác tường, thân chữ L ngược - chuẩn bị trồng chuối."),
            new ExerciseSeed("crow-pose", "Crow Pose", "SKILL", "Static Hold", "Beginner", "NONE", "Thăng bằng tay với gối tì lên khuỷu."),
            new ExerciseSeed("chest-to-wall-handstand", "Chest To Wall Handstand", "SKILL", "Static Hold", "Intermediate", "NONE", "Trồng chuối áp ngực vào tường."),
            new ExerciseSeed("shoulder-flexion-test", "Shoulder Flexion Test", "MOBILITY", "Mobility Test", "Beginner", "NONE", "Áp lưng tường, giơ thẳng tay qua đầu - đo góc gập vai."),
            new ExerciseSeed("pike-fold-test", "Pike Fold Test", "MOBILITY", "Mobility Test", "Beginner", "NONE", "Ngồi duỗi gối, gập thân về trước - đo độ gập hông."),
            new ExerciseSeed("overhead-squat-test", "Overhead Squat Test", "MOBILITY", "Mobility Test", "Beginner", "NONE", "Squat sâu tay giơ cao - đo góc gối và gót chân.")
    );

    /** Dụng cụ của các bài có sẵn trong DB (nếu chưa có thuộc tính EQUIPMENT). */
    public static final Map<String, String> EXISTING_EQUIPMENT = Map.ofEntries(
            Map.entry("dips", "PARALLEL_BARS"), Map.entry("dead-hang", "PULL_UP_BAR"),
            Map.entry("australian-pull-up", "PULL_UP_BAR|LOW_BAR|RINGS"), Map.entry("pull-up", "PULL_UP_BAR"),
            Map.entry("chin-up", "PULL_UP_BAR"), Map.entry("muscle-up", "PULL_UP_BAR"),
            Map.entry("hanging-leg-raise", "PULL_UP_BAR"), Map.entry("front-lever", "PULL_UP_BAR"));

    // ============================== Thang tiến trình ==============================

    public static final List<LadderSeed> LADDERS = List.of(
            new LadderSeed("PULL", "dead-hang", 1, "HOLD_SEC", 0, 10, 60, 5),
            new LadderSeed("PULL", "scapular-pull-up", 2, "VALID_REPS", 10, 10, 12, 1),
            new LadderSeed("PULL", "australian-pull-up", 3, "VALID_REPS", 20, 15, 20, 1),
            new LadderSeed("PULL", "negative-pull-up", 4, "VALID_REPS", 35, 10, 5, 1),
            new LadderSeed("PULL", "pull-up", 5, "VALID_REPS", 45, 30, 15, 1),
            new LadderSeed("PULL", "chest-to-bar-pull-up", 6, "VALID_REPS", 75, 13, 10, 1),
            new LadderSeed("PULL", "muscle-up", 7, "VALID_REPS", 88, 12, 5, 1),
            new LadderSeed("PUSH", "incline-push-up", 1, "VALID_REPS", 0, 20, 20, 1),
            new LadderSeed("PUSH", "push-up", 2, "VALID_REPS", 20, 30, 30, 1),
            new LadderSeed("PUSH", "dips", 3, "VALID_REPS", 50, 15, 15, 1),
            new LadderSeed("PUSH", "pike-push-up", 4, "VALID_REPS", 60, 12, 15, 1),
            new LadderSeed("PUSH", "pseudo-planche-push-up", 5, "VALID_REPS", 72, 13, 12, 1),
            new LadderSeed("PUSH", "handstand-push-up", 6, "VALID_REPS", 85, 15, 8, 1),
            new LadderSeed("LEGS", "assisted-squat", 1, "VALID_REPS", 0, 20, 20, 1),
            new LadderSeed("LEGS", "bodyweight-squat", 2, "VALID_REPS", 20, 25, 50, 1),
            new LadderSeed("LEGS", "bulgarian-split-squat", 3, "VALID_REPS", 45, 20, 15, 1),
            new LadderSeed("LEGS", "shrimp-squat", 4, "VALID_REPS", 65, 20, 8, 1),
            new LadderSeed("LEGS", "pistol-squat", 5, "VALID_REPS", 85, 15, 8, 1),
            new LadderSeed("CORE", "plank", 1, "HOLD_SEC", 5, 30, 90, 10),
            new LadderSeed("CORE", "hollow-body-hold", 2, "HOLD_SEC", 30, 20, 60, 10),
            new LadderSeed("CORE", "hanging-leg-raise", 3, "VALID_REPS", 50, 15, 15, 1),
            new LadderSeed("CORE", "l-sit", 4, "HOLD_SEC", 65, 20, 30, 3),
            new LadderSeed("CORE", "dragon-flag", 5, "VALID_REPS", 85, 15, 8, 1),
            new LadderSeed("SKILL", "wall-pike-hold", 1, "HOLD_SEC", 0, 20, 30, 5),
            new LadderSeed("SKILL", "crow-pose", 2, "HOLD_SEC", 20, 20, 30, 3),
            new LadderSeed("SKILL", "chest-to-wall-handstand", 3, "HOLD_SEC", 40, 20, 60, 5),
            new LadderSeed("SKILL", "handstand", 4, "HOLD_SEC", 60, 20, 30, 2),
            new LadderSeed("SKILL", "freestanding-handstand-push-up", 5, "VALID_REPS", 80, 20, 5, 1),
            new LadderSeed("MOBILITY", "shoulder-flexion-test", 1, "ANGLE_DEG", 0, 100, 180, 0),
            new LadderSeed("MOBILITY", "pike-fold-test", 2, "ANGLE_DEG", 0, 100, 140, 0),
            new LadderSeed("MOBILITY", "overhead-squat-test", 3, "ANGLE_DEG", 0, 100, 125, 0)
    );

    // ============================== Level ==============================

    public static final List<LevelSeed> LEVELS = List.of(
            new LevelSeed("L0", 0, "FOUNDATION", 0, 0, "slate", "Chưa có nền tảng: chưa chống đẩy chuẩn hoặc chưa treo xà ổn định."),
            new LevelSeed("L1", 1, "BEGINNER", 25, 17, "emerald", "Có nền cơ bản; đang xây push-up, row, squat, plank."),
            new LevelSeed("L2", 2, "INTERMEDIATE", 50, 42, "sky", "Pull-up, dip, push-up chuẩn với số rep có ý nghĩa; bắt đầu kỹ năng."),
            new LevelSeed("L3", 3, "ADVANCED", 72, 64, "violet", "Sức mạnh tương đối cao; luyện kỹ năng tĩnh/động nâng cao."),
            new LevelSeed("L4", 4, "ELITE", 88, 80, "amber", "Kỹ năng nâng cao ổn định; giáo án bắt buộc có coach duyệt.")
    );

    public static final List<RequirementSeed> REQUIREMENTS = List.of(
            // L1
            new RequirementSeed("L1", "COMPETENCY", "PUSH", null, "SCORE", "GTE", 20, PRODUCT),
            new RequirementSeed("L1", "COMPETENCY", "PULL", null, "SCORE", "GTE", 15, PRODUCT),
            new RequirementSeed("L1", "COMPETENCY", "CORE", null, "SCORE", "GTE", 20, PRODUCT),
            new RequirementSeed("L1", "PERFORMANCE", "PUSH", "incline-push-up", "VALID_REPS", "GTE", 5, COACHING),
            new RequirementSeed("L1", "PERFORMANCE", "CORE", "plank", "HOLD_SEC", "GTE", 30, COACHING),
            new RequirementSeed("L1", "QUALITY", null, null, "FORM_SCORE", "GTE", 65, COACHING),
            new RequirementSeed("L1", "QUALITY", null, null, "VALID_RATIO", "GTE", 0.7, COACHING),
            // L2
            new RequirementSeed("L2", "COMPETENCY", "PUSH", null, "SCORE", "GTE", 45, PRODUCT),
            new RequirementSeed("L2", "COMPETENCY", "PULL", null, "SCORE", "GTE", 40, PRODUCT),
            new RequirementSeed("L2", "COMPETENCY", "CORE", null, "SCORE", "GTE", 45, PRODUCT),
            new RequirementSeed("L2", "COMPETENCY", "LEGS", null, "SCORE", "GTE", 40, PRODUCT),
            new RequirementSeed("L2", "PERFORMANCE", "PUSH", "push-up", "VALID_REPS", "GTE", 20, COACHING),
            new RequirementSeed("L2", "PERFORMANCE", "PULL", "pull-up", "VALID_REPS", "GTE", 5, COACHING),
            new RequirementSeed("L2", "PERFORMANCE", "PUSH", "dips", "VALID_REPS", "GTE", 5, COACHING),
            new RequirementSeed("L2", "PERFORMANCE", "LEGS", "bodyweight-squat", "VALID_REPS", "GTE", 30, COACHING),
            new RequirementSeed("L2", "SKILL", "PULL", "pull-up", "NODE_ACHIEVED", "GTE", 1, COACHING),
            new RequirementSeed("L2", "QUALITY", null, null, "FORM_SCORE", "GTE", 75, COACHING),
            new RequirementSeed("L2", "QUALITY", null, null, "VALID_RATIO", "GTE", 0.8, COACHING),
            new RequirementSeed("L2", "QUALITY", null, null, "MAJOR_VIOLATIONS", "LTE", 0, COACHING),
            // L3
            new RequirementSeed("L3", "COMPETENCY", "PUSH", null, "SCORE", "GTE", 65, PRODUCT),
            new RequirementSeed("L3", "COMPETENCY", "PULL", null, "SCORE", "GTE", 65, PRODUCT),
            new RequirementSeed("L3", "COMPETENCY", "CORE", null, "SCORE", "GTE", 65, PRODUCT),
            new RequirementSeed("L3", "COMPETENCY", "LEGS", null, "SCORE", "GTE", 55, PRODUCT),
            new RequirementSeed("L3", "COMPETENCY", "SKILL", null, "SCORE", "GTE", 50, PRODUCT),
            new RequirementSeed("L3", "PERFORMANCE", "PULL", "pull-up", "VALID_REPS", "GTE", 12, COACHING),
            new RequirementSeed("L3", "PERFORMANCE", "PUSH", "dips", "VALID_REPS", "GTE", 15, COACHING),
            new RequirementSeed("L3", "PERFORMANCE", "CORE", "l-sit", "HOLD_SEC", "GTE", 15, COACHING),
            new RequirementSeed("L3", "SKILL", "SKILL", "chest-to-wall-handstand", "NODE_ACHIEVED", "GTE", 1, COACHING),
            new RequirementSeed("L3", "SKILL", "LEGS", "shrimp-squat", "NODE_ACHIEVED", "GTE", 1, COACHING),
            new RequirementSeed("L3", "QUALITY", null, null, "FORM_SCORE", "GTE", 80, COACHING),
            new RequirementSeed("L3", "QUALITY", null, null, "VALID_RATIO", "GTE", 0.85, COACHING),
            new RequirementSeed("L3", "QUALITY", null, null, "MAJOR_VIOLATIONS", "LTE", 0, COACHING),
            // L4
            new RequirementSeed("L4", "COMPETENCY", "PUSH", null, "SCORE", "GTE", 80, PRODUCT),
            new RequirementSeed("L4", "COMPETENCY", "PULL", null, "SCORE", "GTE", 80, PRODUCT),
            new RequirementSeed("L4", "COMPETENCY", "CORE", null, "SCORE", "GTE", 80, PRODUCT),
            new RequirementSeed("L4", "COMPETENCY", "LEGS", null, "SCORE", "GTE", 80, PRODUCT),
            new RequirementSeed("L4", "COMPETENCY", "SKILL", null, "SCORE", "GTE", 75, PRODUCT),
            new RequirementSeed("L4", "COMPETENCY", "MOBILITY", null, "SCORE", "GTE", 60, PRODUCT),
            new RequirementSeed("L4", "PERFORMANCE", "PULL", "muscle-up", "VALID_REPS", "GTE", 3, COACHING),
            new RequirementSeed("L4", "PERFORMANCE", "PUSH", "handstand-push-up", "VALID_REPS", "GTE", 5, COACHING),
            new RequirementSeed("L4", "SKILL", "SKILL", "handstand", "NODE_ACHIEVED", "GTE", 1, COACHING),
            new RequirementSeed("L4", "SKILL", "PULL", "muscle-up", "NODE_ACHIEVED", "GTE", 1, COACHING),
            new RequirementSeed("L4", "QUALITY", null, null, "FORM_SCORE", "GTE", 85, COACHING),
            new RequirementSeed("L4", "QUALITY", null, null, "VALID_RATIO", "GTE", 0.9, COACHING),
            new RequirementSeed("L4", "QUALITY", null, null, "MAJOR_VIOLATIONS", "LTE", 0, COACHING)
    );

    // ============================== Skill Tree (cạnh NEXT: tiên quyết -> bài) ==============================

    public static final List<ProgressionSeed> PROGRESSIONS = List.of(
            // Kéo
            new ProgressionSeed("dead-hang", "scapular-pull-up", null, 30, null, true, 1),
            new ProgressionSeed("scapular-pull-up", "australian-pull-up", 10, null, null, true, 1),
            new ProgressionSeed("australian-pull-up", "negative-pull-up", 15, null, null, true, 1),
            new ProgressionSeed("negative-pull-up", "pull-up", 5, null, null, true, 1),
            new ProgressionSeed("pull-up", "chest-to-bar-pull-up", 5, null, null, true, 1),
            new ProgressionSeed("chest-to-bar-pull-up", "explosive-pull-up", 6, null, null, true, 1),
            new ProgressionSeed("explosive-pull-up", "muscle-up", 5, null, null, true, 1),
            new ProgressionSeed("straight-bar-dip", "muscle-up", 8, null, null, true, 1),
            new ProgressionSeed("hanging-leg-raise", "muscle-up", 10, null, null, false, 0.5),
            new ProgressionSeed("pull-up", "front-lever", 12, null, null, true, 1),
            new ProgressionSeed("dragon-flag", "front-lever", 5, null, null, false, 0.5),
            // Đẩy
            new ProgressionSeed("incline-push-up", "push-up", 15, null, null, true, 1),
            new ProgressionSeed("push-up", "diamond-push-up", 15, null, null, true, 1),
            new ProgressionSeed("push-up", "dips", 15, null, null, true, 1),
            new ProgressionSeed("push-up", "pike-push-up", 15, null, null, true, 1),
            new ProgressionSeed("push-up", "archer-push-up", 20, null, null, true, 1),
            new ProgressionSeed("push-up", "pseudo-planche-push-up", 25, null, null, true, 1),
            new ProgressionSeed("dips", "straight-bar-dip", 10, null, null, true, 1),
            new ProgressionSeed("pike-push-up", "handstand-push-up", 12, null, null, true, 1),
            new ProgressionSeed("chest-to-wall-handstand", "handstand-push-up", null, 30, null, true, 1),
            new ProgressionSeed("pseudo-planche-push-up", "planche", 12, null, null, true, 1),
            // Chân
            new ProgressionSeed("assisted-squat", "bodyweight-squat", 15, null, null, true, 1),
            new ProgressionSeed("bodyweight-squat", "bulgarian-split-squat", 30, null, null, true, 1),
            new ProgressionSeed("bulgarian-split-squat", "shrimp-squat", 12, null, null, true, 1),
            new ProgressionSeed("shrimp-squat", "pistol-squat", 5, null, null, true, 1),
            // Core
            new ProgressionSeed("plank", "hollow-body-hold", null, 60, null, true, 1),
            new ProgressionSeed("hollow-body-hold", "hanging-leg-raise", null, 30, null, true, 1),
            new ProgressionSeed("dead-hang", "hanging-leg-raise", null, 30, null, false, 0.5),
            new ProgressionSeed("hanging-leg-raise", "l-sit", 10, null, null, true, 1),
            new ProgressionSeed("l-sit", "dragon-flag", null, 15, null, true, 1),
            // Kỹ năng
            new ProgressionSeed("wall-pike-hold", "crow-pose", null, 30, null, true, 1),
            new ProgressionSeed("crow-pose", "chest-to-wall-handstand", null, 20, null, true, 1),
            new ProgressionSeed("pike-push-up", "chest-to-wall-handstand", 8, null, null, false, 0.5),
            new ProgressionSeed("chest-to-wall-handstand", "handstand", null, 60, null, true, 1),
            new ProgressionSeed("handstand", "freestanding-handstand-push-up", null, 30, null, true, 1),
            new ProgressionSeed("handstand-push-up", "freestanding-handstand-push-up", 5, null, null, true, 1)
    );

    /** Bài thay thế (ALTERNATIVE): bài -> bài thay được (vd. khi thiếu dụng cụ). */
    public static final List<String[]> ALTERNATIVES = List.of(
            new String[]{"incline-push-up", "knee-push-up"},
            new String[]{"bulgarian-split-squat", "lunges"},
            new String[]{"pull-up", "chin-up"},
            new String[]{"dips", "diamond-push-up"},
            new String[]{"australian-pull-up", "scapular-pull-up"}
    );

    // ============================== Luật nhất quán ==============================

    public static final List<ConsistencySeed> CONSISTENCY = List.of(
            new ConsistencySeed("C01", "{\"all\":[{\"question\":\"CH_EXPERIENCE\",\"op\":\"EQ\",\"value\":\"NONE\"},{\"node\":\"pull-up\",\"op\":\"GTE\",\"value\":10}]}",
                    "CONFLICT", List.of("PULL"), "Chưa từng tập nhưng khai làm được ≥ 10 pull-up chuẩn."),
            new ConsistencySeed("C02", "{\"all\":[{\"question\":\"CH_EXPERIENCE\",\"op\":\"EQ\",\"value\":\"NONE\"},{\"ladderScore\":\"PUSH\",\"op\":\"GTE\",\"value\":60}]}",
                    "CONFLICT", List.of("PUSH"), "Chưa từng tập nhưng khai năng lực đẩy ở mức nâng cao."),
            new ConsistencySeed("C03", "{\"all\":[{\"question\":\"CH_EXPERIENCE\",\"op\":\"EQ\",\"value\":\"NONE\"},{\"ladderScore\":\"SKILL\",\"op\":\"GTE\",\"value\":60}]}",
                    "CONFLICT", List.of("SKILL"), "Chưa từng tập nhưng khai trồng chuối tự do."),
            new ConsistencySeed("C04", "{\"all\":[{\"question\":\"CH_EXPERIENCE\",\"op\":\"IN\",\"value\":[\"NONE\",\"LT_6M\"]},{\"node\":\"muscle-up\",\"op\":\"GTE\",\"value\":1}]}",
                    "CONFLICT", List.of("PULL", "SKILL"), "Tập dưới 6 tháng nhưng khai làm được muscle-up."),
            new ConsistencySeed("C05", "{\"any\":[{\"node\":\"pull-up\",\"op\":\"GTE\",\"value\":25}]}",
                    "WARNING", List.of("PULL"), "Số pull-up khai báo rất cao so với người mới vào ứng dụng."),
            new ConsistencySeed("C06", "{\"any\":[{\"node\":\"push-up\",\"op\":\"GTE\",\"value\":80}]}",
                    "WARNING", List.of("PUSH"), "Số push-up khai báo rất cao so với người mới vào ứng dụng."),
            new ConsistencySeed("C07", "{\"all\":[{\"ladderScore\":\"CORE\",\"op\":\"GTE\",\"value\":65},{\"ladderScore\":\"PUSH\",\"op\":\"LT\",\"value\":20}]}",
                    "WARNING", List.of("CORE", "PUSH"), "Khai giữ L-sit nhưng chưa chống đẩy được - hai năng lực này thường đi cùng nhau.")
    );

    // ============================== Bộ test định kỳ (thứ tự NSCA: kỹ năng -> sức mạnh -> sức bền -> linh hoạt) ==============================

    public static final List<TestItemSeed> TEST_ITEMS = List.of(
            new TestItemSeed("wall-pike-hold", "SKILL", "HOLD_SEC", "L0", "L0", false, 10, "Giữ tối đa, dừng khi mất tư thế."),
            new TestItemSeed("crow-pose", "SKILL", "HOLD_SEC", "L0", "L1", false, 11, "Giữ tối đa."),
            new TestItemSeed("chest-to-wall-handstand", "SKILL", "HOLD_SEC", "L1", "L3", false, 12, "Áp ngực vào tường, thân thẳng."),
            new TestItemSeed("handstand", "SKILL", "HOLD_SEC", "L3", "L4", false, 13, "Trồng chuối tự do."),
            new TestItemSeed("muscle-up", "PULL", "VALID_REPS", "L3", "L4", true, 20, "Tối đa rep hợp lệ, không kipping."),
            new TestItemSeed("handstand-push-up", "PUSH", "VALID_REPS", "L3", "L4", true, 21, "Có tường hỗ trợ, đầu chạm sàn/đệm."),
            new TestItemSeed("pull-up", "PULL", "VALID_REPS", "L1", "L4", true, 22, "Treo thẳng tay, cằm qua xà."),
            new TestItemSeed("chest-to-bar-pull-up", "PULL", "VALID_REPS", "L3", "L4", false, 23, null),
            new TestItemSeed("dips", "PUSH", "VALID_REPS", "L1", "L4", true, 24, "Hạ tới khi vai ngang khuỷu."),
            new TestItemSeed("pseudo-planche-push-up", "PUSH", "VALID_REPS", "L2", "L4", false, 25, null),
            new TestItemSeed("pistol-squat", "LEGS", "VALID_REPS", "L3", "L4", false, 26, "Mỗi chân, lấy chân yếu hơn."),
            new TestItemSeed("shrimp-squat", "LEGS", "VALID_REPS", "L3", "L4", true, 27, "Mỗi chân, lấy chân yếu hơn."),
            new TestItemSeed("bulgarian-split-squat", "LEGS", "VALID_REPS", "L2", "L3", true, 28, "Mỗi chân, lấy chân yếu hơn."),
            new TestItemSeed("australian-pull-up", "PULL", "VALID_REPS", "L0", "L1", true, 30, "Thân thẳng, ngực chạm xà thấp."),
            new TestItemSeed("incline-push-up", "PUSH", "VALID_REPS", "L0", "L0", true, 31, null),
            new TestItemSeed("push-up", "PUSH", "VALID_REPS", "L0", "L2", true, 32, "Ngực gần chạm sàn, thân thẳng."),
            new TestItemSeed("bodyweight-squat", "LEGS", "VALID_REPS", "L0", "L2", true, 33, "Đùi song song sàn, nhịp 2-0-1."),
            new TestItemSeed("hanging-leg-raise", "CORE", "VALID_REPS", "L2", "L4", false, 34, null),
            new TestItemSeed("dead-hang", "PULL", "HOLD_SEC", "L0", "L1", true, 40, "Treo thẳng tay tối đa."),
            new TestItemSeed("plank", "CORE", "HOLD_SEC", "L0", "L1", true, 41, "Giữ tối đa, dừng khi hông võng."),
            new TestItemSeed("hollow-body-hold", "CORE", "HOLD_SEC", "L1", "L2", true, 42, "Lưng dưới áp sàn."),
            new TestItemSeed("l-sit", "CORE", "HOLD_SEC", "L2", "L4", true, 43, "Chân thẳng song song sàn."),
            new TestItemSeed("shoulder-flexion-test", "MOBILITY", "ANGLE_DEG", "L0", "L4", false, 50, "Áp lưng tường, tay thẳng."),
            new TestItemSeed("pike-fold-test", "MOBILITY", "ANGLE_DEG", "L0", "L4", false, 51, "Gối thẳng."),
            new TestItemSeed("overhead-squat-test", "MOBILITY", "ANGLE_DEG", "L0", "L4", false, 52, "Gót không nhấc.")
    );

    // ============================== Mục tiêu ==============================

    public static final List<GoalSeed> GOALS = List.of(
            new GoalSeed("FIRST_PULL_UP", "Pull-up đầu tiên", "SKILL", "pull-up",
                    "{\"PUSH\":0.15,\"PULL\":0.45,\"LEGS\":0.10,\"CORE\":0.20,\"SKILL\":0.10}", "Làm được pull-up chuẩn đầu tiên."),
            new GoalSeed("MUSCLE_UP", "Chinh phục Muscle Up", "SKILL", "muscle-up",
                    "{\"PUSH\":0.25,\"PULL\":0.45,\"CORE\":0.20,\"SKILL\":0.10}", "Thực hiện thành công muscle-up trên xà đơn."),
            new GoalSeed("HANDSTAND", "Làm chủ Handstand", "SKILL", "handstand",
                    "{\"PUSH\":0.30,\"CORE\":0.20,\"MOBILITY\":0.15,\"SKILL\":0.35}", "Trồng chuối tự do tối thiểu 30 giây."),
            new GoalSeed("STRENGTH", "Strength", "STRENGTH", null, "{\"PUSH\":0.25,\"PULL\":0.25,\"LEGS\":0.25,\"CORE\":0.25}", null),
            new GoalSeed("MUSCLE_GAIN", "Muscle Gain", "STRENGTH", null, "{\"PUSH\":0.30,\"PULL\":0.30,\"LEGS\":0.25,\"CORE\":0.15}", null),
            new GoalSeed("WEIGHT_LOSS", "Weight Loss", "FITNESS", null, "{\"PUSH\":0.20,\"PULL\":0.15,\"LEGS\":0.35,\"CORE\":0.30}", null),
            new GoalSeed("ENDURANCE", "Endurance", "FITNESS", null, "{\"PUSH\":0.25,\"PULL\":0.20,\"LEGS\":0.30,\"CORE\":0.25}", null),
            new GoalSeed("FLEXIBILITY", "Flexibility", "MOBILITY", null, "{\"CORE\":0.20,\"MOBILITY\":0.60,\"SKILL\":0.20}", null),
            new GoalSeed("SKILL", "Skill", "SKILL", null, "{\"PUSH\":0.25,\"PULL\":0.25,\"CORE\":0.20,\"SKILL\":0.30}", null),
            new GoalSeed("GENERAL_FITNESS", "General Fitness", "FITNESS", null, "{\"PUSH\":0.20,\"PULL\":0.20,\"LEGS\":0.20,\"CORE\":0.20,\"MOBILITY\":0.10,\"SKILL\":0.10}", null),
            new GoalSeed("POSTURE", "Posture", "MOBILITY", null, "{\"PULL\":0.35,\"CORE\":0.30,\"MOBILITY\":0.35}", null)
    );
}
