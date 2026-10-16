package com.calishealth.api.service.level;

import com.calishealth.api.engine.config.RuleSetConfig;
import com.calishealth.api.engine.config.RuleSetConfig.LadderNode;
import com.calishealth.api.engine.level.CompetencyScoringEngine;
import com.calishealth.api.engine.level.CompetencyScoringEngine.CompetencyResult;
import com.calishealth.api.engine.program.ProgramEngine;
import com.calishealth.api.engine.program.ProgramModels.*;
import com.calishealth.api.engine.skill.SkillEngine;
import com.calishealth.api.engine.skill.SkillEngine.Gap;
import com.calishealth.api.engine.skill.SkillEngine.NodeProgress;
import com.calishealth.api.engine.skill.SkillGraph;
import com.calishealth.api.entity.*;
import com.calishealth.api.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Sinh Training Cycle (= một WorkoutPlan) từ TRẠNG THÁI HIỆN TẠI của người dùng:
 * level + năng lực + mục tiêu + ràng buộc -> chọn giáo án mẫu -> điền bài theo nấc tiến trình -> VolumeGuard -> lưu.
 * Mỗi cycle ghi lại assessment / evaluation / giáo án mẫu / rule set đã sinh ra nó.
 */
@Service
public class TrainingCycleService {
    /** generation_reason của giáo án học viên tự chọn: hệ thống không tự đè chu kỳ mới lên giáo án này. */
    public static final String SELF_BUILT = "USER_SELF_BUILT";
    private final RuleSetProvider ruleSets;
    private final LevelDataService levelData;
    private final SkillProgressService skills;
    private final ProgramTemplateRepository templateRepo;
    private final WorkoutPlanRepository planRepo;
    private final WorkoutPlanDayRepository dayRepo;
    private final WorkoutPlanExerciseRepository planExerciseRepo;
    private final UserTrainingConstraintsRepository constraintsRepo;
    private final UserGoalRepository userGoalRepo;
    private final UserRepository userRepo;
    private final ExerciseRepository exerciseRepo;
    private final WorkoutSessionRepository sessionRepo;
    private final ObjectMapper json = new ObjectMapper();

    public TrainingCycleService(RuleSetProvider ruleSets, LevelDataService levelData, SkillProgressService skills,
                                ProgramTemplateRepository templateRepo, WorkoutPlanRepository planRepo, WorkoutPlanDayRepository dayRepo,
                                WorkoutPlanExerciseRepository planExerciseRepo, UserTrainingConstraintsRepository constraintsRepo,
                                UserGoalRepository userGoalRepo, UserRepository userRepo, ExerciseRepository exerciseRepo,
                                WorkoutSessionRepository sessionRepo) {
        this.ruleSets = ruleSets;
        this.levelData = levelData;
        this.skills = skills;
        this.templateRepo = templateRepo;
        this.planRepo = planRepo;
        this.dayRepo = dayRepo;
        this.planExerciseRepo = planExerciseRepo;
        this.constraintsRepo = constraintsRepo;
        this.userGoalRepo = userGoalRepo;
        this.userRepo = userRepo;
        this.exerciseRepo = exerciseRepo;
        this.sessionRepo = sessionRepo;
    }

    public record UserTrainingContext(String levelCode, int levelRank, String levelStatus, Map<String, CompetencyResult> competencies,
                                      Goal primaryGoal, List<String> secondaryGoals, UserTrainingConstraints constraints,
                                      Set<String> equipment, Set<String> limitations, boolean returning) {}

    // ============================== Ràng buộc & ngữ cảnh ==============================

    @Transactional(readOnly = true)
    public UserTrainingConstraints constraints(Long userId) {
        return constraintsRepo.findById(userId).orElseGet(() -> {
            UserTrainingConstraints c = new UserTrainingConstraints();
            c.setUserId(userId);
            return c;
        });
    }

    @Transactional
    public UserTrainingConstraints saveConstraints(UserTrainingConstraints c) {
        return constraintsRepo.save(c);
    }

    @Transactional(readOnly = true)
    public UserTrainingContext context(Long userId, RuleSetConfig rs) {
        Optional<UserLevelState> state = levelData.state(userId);
        String level = state.map(userLevelState -> userLevelState.getLevelCode()).orElse(rs.levelByRank(0).code());
        List<UserGoal> goals = userGoalRepo.findByUserIdOrderByPriorityAsc(userId).stream()
                .filter(g -> g.getStatus() == UserGoalStatus.ACTIVE).toList();
        Goal primary = goals.isEmpty() ? null : goals.get(0).getGoal();
        if (primary != null) primary.getCode(); // nạp lazy trong transaction
        List<String> secondary = goals.stream().skip(1).map(g -> g.getGoal().getCode()).toList();
        UserTrainingConstraints c = constraints(userId);
        boolean returning = state.map(s -> UserLevelState.RETURNING.equals(s.getStatus())).orElse(false) || inactive(userId, rs);
        return new UserTrainingContext(level, rs.level(level).rank(), state.map(userLevelState -> userLevelState.getStatus()).orElse(null),
                levelData.currentCompetencies(userId), primary, secondary, c, readSet(c.getEquipmentJson()),
                readSet(c.getLimitationsJson()), returning);
    }

    /** Không có buổi tập hoàn thành trong N ngày (dù trước đó đã từng tập) -> người quay lại sau thời gian nghỉ. */
    @Transactional(readOnly = true)
    public boolean inactive(Long userId, RuleSetConfig rs) {
        List<WorkoutSession> sessions = sessionRepo.findByUserIdOrderByStartedAtDesc(userId).stream()
                .filter(s -> s.getStatus() == WorkoutSessionStatus.COMPLETED && s.getCompletedAt() != null).toList();
        if (sessions.isEmpty()) return false;
        Instant last = sessions.stream().map(workoutSession -> workoutSession.getCompletedAt()).max(Comparator.naturalOrder()).orElseThrow();
        return ChronoUnit.DAYS.between(last, Instant.now()) >= rs.param("returning.inactiveDays", 28);
    }

    // ============================== Sinh chu kỳ ==============================

    public record CycleResult(WorkoutPlan plan, Map<String, Object> snapshot) {}

    @Transactional
    public CycleResult generate(Long userId, String reason, LevelEvaluation evaluation, Long assessmentSessionId) {
        RuleSetConfig rs = ruleSets.active();
        UserTrainingContext ctx = context(userId, rs);
        SkillGraph graph = skills.graph(rs);
        Map<Long, NodeProgress> progress = skills.progress(userId);

        Optional<WorkoutPlan> current = planRepo.findTopByUserIdAndStatusOrderByStartDateDescIdDesc(userId, WorkoutPlanStatus.ACTIVE);
        Set<Long> inCycle = current.map(p -> exercisesOf(p.getId())).orElse(Set.of());
        Map<Long, String> statuses = SkillEngine.statuses(graph, progress, inCycle);

        Map<String, Double> scores = new LinkedHashMap<>();
        ctx.competencies().forEach((c, r) -> scores.put(c, r.score()));
        String weakest = CompetencyScoringEngine.weakest(rs, ctx.competencies()).orElse(null);
        // Giáo án chỉ theo kết quả đánh giá và level: mục tiêu khai trong khảo sát không dẫn đường chọn bài
        Long target = null;
        List<Gap> gaps = SkillEngine.gaps(rs, graph, target, progress, scores, weakest, 5);

        // ---- Chọn giáo án mẫu ----
        List<ProgramTemplate> published = templateRepo.findByStatus(ProgramTemplate.PUBLISHED);
        Map<Long, ProgramTemplate> byId = new HashMap<>();
        published.forEach(t -> byId.put(t.getId(), t));
        List<TemplateCandidate> candidates = published.stream().map(t -> toCandidate(rs, t)).toList();
        // Chỉ level + điểm năng lực từ đánh giá (+ độ đa dạng); không dùng mục tiêu, số buổi, thời lượng, dụng cụ
        MatchProfile profile = new MatchProfile(ctx.levelRank(), null, null, List.of(), 0, 0, Set.of(), scores, recentTemplateCodes(userId));
        MatchResult match = ProgramEngine.match(rs, candidates, profile);

        // ---- Điền bài ----
        Set<Long> allIds = new HashSet<>();
        graph.nodes().forEach(n -> allIds.add(n.id()));
        Map<Long, Set<String>> equipmentReq = new HashMap<>();
        Set<Long> restricted = skills.restrictedExercises(ctx.limitations(), ctx.constraints().isScreeningFlag());
        Set<Long> goalPath = new HashSet<>();
        if (target != null) { goalPath.add(target); goalPath.addAll(graph.easier(target, 10).keySet()); }
        Map<Long, Double> gapPriority = new HashMap<>();
        gaps.stream().filter(g -> g.exerciseId() != null).forEach(g -> gapPriority.put(g.exerciseId(), g.priority()));

        List<PlannedDay> days;
        ProgramTemplate chosen = match.best().map(m -> byId.get(m.template().id())).orElse(null);
        if (chosen != null) {
            days = fromTemplate(chosen, 7);   // dùng nguyên cấu trúc Coach soạn, không cắt theo số buổi người dùng khai
        } else {
            days = skeleton(rs, ctx, graph, statuses);
            reason = reason == null ? "FALLBACK_SKELETON" : reason;
        }
        days.forEach(d -> d.exercises.forEach(e -> { if (e.templateExerciseId != null) allIds.add(e.templateExerciseId); }));
        equipmentReq.putAll(skills.equipmentRequirements(allIds));
        ProgramEngine.SlotContext slot = new ProgramEngine.SlotContext(graph, statuses,
                id -> true, restricted,   // dụng cụ do người dùng lo, không dùng để loại bài
 goalPath, gapPriority, scores,
                id -> rs.ladderNode(id).map(ladderNode -> ladderNode.competency()).orElse(graph.node(id).map(node -> node.competency()).orElse(null)));
        for (PlannedDay d : days) {
            for (PlannedExercise e : d.exercises) {
                if (e.templateExerciseId == null) continue;
                ProgramEngine.Selection s = ProgramEngine.pick(rs, slot, e.templateExerciseId, e.section, e.locked);
                e.exerciseId = s.exerciseId() == null ? e.templateExerciseId : s.exerciseId();
                e.selectionReason = json.writeValueAsString(Map.of("reason", s.reason(), "scores", s.breakdown()));
                if (e.competency == null) e.competency = slot.competencyOf().apply(e.exerciseId);
            }
        }
        double globalFactor = ctx.returning() ? rs.param("returning.volumeFactor", 0.65) : 1;
        List<String> volumeNotes = ProgramEngine.enforceVolume(rs, days, ctx.levelCode(), weakest,
                chosen != null ? chosen.getSessionMinutes() : 45, globalFactor, rs.param("deload.volumeFactor", 0.6));

        // ---- Lưu ----
        User user = userRepo.findById(userId).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));
        for (WorkoutPlan p : planRepo.findByUserIdAndStatus(userId, WorkoutPlanStatus.ACTIVE)) {
            p.setStatus(WorkoutPlanStatus.COMPLETED);
            planRepo.save(p);
        }
        int cycleNumber = planRepo.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(workoutPlan -> workoutPlan.getCycleNumber()).filter(Objects::nonNull).max((left, right) -> Integer.compare(left, right)).orElse(0) + 1;
        int weeks = days.stream().mapToInt(d -> d.weekNumber).max().orElse(1);

        WorkoutPlan plan = new WorkoutPlan();
        plan.setUser(user);
        plan.setGoal(ctx.primaryGoal());
        String levelName = rs.level(ctx.levelCode()).name();
        plan.setName("Chu kỳ " + cycleNumber + " · " + (chosen != null ? chosen.getName() : "Khung " + levelName));
        plan.setDescription("Giáo án áp theo level " + levelName + " từ kết quả đánh giá.");
        plan.setDifficultyLevel(ctx.levelCode());
        plan.setDurationWeeks(weeks);
        plan.setDaysPerWeek((int) days.stream().filter(d -> d.weekNumber == 1 && !d.restDay).count());
        plan.setStatus(WorkoutPlanStatus.ACTIVE);
        plan.setStartDate(LocalDate.now());
        plan.setEndDate(LocalDate.now().plusWeeks(weeks));
        plan.setCycleNumber(cycleNumber);
        plan.setAssessmentSessionId(assessmentSessionId);
        plan.setLevelEvaluationId(evaluation == null ? null : evaluation.getId());
        plan.setPreviousPlanId(current.map(workoutPlan -> workoutPlan.getId()).orElse(null));
        plan.setProgramTemplateId(chosen == null ? null : chosen.getId());
        plan.setProgramTemplateVersion(chosen == null ? null : chosen.getVersion());
        plan.setRuleSetId(rs.id());
        plan.setGenerationReason(chosen == null ? "FALLBACK_SKELETON" : reason);

        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("level", ctx.levelCode());
        snapshot.put("levelStatus", ctx.levelStatus());
        snapshot.put("competencies", scores);
        snapshot.put("weakest", weakest);
        snapshot.put("goal", ctx.primaryGoal() == null ? null : ctx.primaryGoal().getCode());
        snapshot.put("constraints", Map.of("daysPerWeek", ctx.constraints().getDaysPerWeek(),
                "sessionMinutes", ctx.constraints().getSessionMinutes(), "equipment", ctx.equipment()));
        snapshot.put("returning", ctx.returning());
        snapshot.put("gaps", gaps);
        snapshot.put("templateMatch", match.ranked().stream().limit(5).map(m -> Map.of("code", m.template().code(),
                "name", m.template().name(), "score", m.score(), "breakdown", m.breakdown())).toList());
        snapshot.put("rejectedTemplates", match.rejected().stream().map(r -> Map.of("code", r.template().code(), "reason", r.reason())).toList());
        snapshot.put("volumeNotes", volumeNotes);
        plan.setInputSnapshot(json.writeValueAsString(snapshot));
        plan = planRepo.save(plan);

        persistDays(plan, days);
        return new CycleResult(plan, snapshot);
    }

    /** Ghi các buổi tập và bài của một chu kỳ (dùng chung cho chu kỳ hệ thống sinh và giáo án học viên tự chọn). */
    private void persistDays(WorkoutPlan plan, List<PlannedDay> days) {
        Map<Long, Exercise> exercises = new HashMap<>();
        exerciseRepo.findAllById(days.stream().flatMap(d -> d.exercises.stream()).map(e -> e.exerciseId)
                .filter(Objects::nonNull).distinct().toList()).forEach(e -> exercises.put(e.getId(), e));
        int dayNumber = 1;
        for (PlannedDay d : days) {
            WorkoutPlanDay day = new WorkoutPlanDay();
            day.setWorkoutPlan(plan);
            day.setDayNumber(dayNumber++);
            day.setWeekNumber(d.weekNumber);
            day.setName(trim(d.name, 255));
            day.setFocus(trim(d.focus, 100));
            day.setRestDay(d.restDay);
            day.setDeload(d.deload);
            day.setEstimatedDurationMin(d.estimatedMinutes);
            day = dayRepo.save(day);
            int seq = 1;
            for (PlannedExercise e : d.exercises) {
                Exercise ex = exercises.get(e.exerciseId);
                if (ex == null) continue;
                WorkoutPlanExercise pe = new WorkoutPlanExercise();
                pe.setWorkoutPlanDay(day);
                pe.setExercise(ex);
                pe.setSequenceNo(seq++);
                pe.setSets(e.sets);
                pe.setTargetRepsMin(e.repMin);
                pe.setTargetRepsMax(e.repMax);
                pe.setTargetDurationSec(e.holdSec);
                pe.setRestSeconds(e.restSec);
                pe.setTargetRpe(e.rpe == null ? null : BigDecimal.valueOf(e.rpe));
                pe.setTempo(trim(e.tempo, 30));
                pe.setNotes(e.notes);
                pe.setSectionType(e.section);
                pe.setTemplateExerciseId(e.templateExerciseId);
                pe.setSelectionReason(e.selectionReason);
                planExerciseRepo.save(pe);
            }
        }
    }

    // ============================== Giáo án mẫu -> buổi tập ==============================

    /** Chuyển cấu trúc của Admin Workout Plan Builder thành buổi tập; giữ N buổi tập đầu mỗi tuần theo số buổi user có. */
    List<PlannedDay> fromTemplate(ProgramTemplate t, int daysPerWeek) {
        List<PlannedDay> out = new ArrayList<>();
        JsonNode root = readTree(t.getStructureJson());
        JsonNode weeks = root.has("weeks") ? root.get("weeks") : root;
        int weekIdx = 0;
        for (JsonNode w : weeks) {
            weekIdx++;
            int weekNumber = w.has("weekNumber") ? w.get("weekNumber").asInt(weekIdx) : weekIdx;
            int workoutDays = 0;
            for (JsonNode d : w.path("days")) {
                String dayType = d.path("dayType").asString("WORKOUT");
                boolean rest = "REST".equals(dayType);
                if (!rest && workoutDays >= daysPerWeek) continue;
                if (!rest) workoutDays++;
                PlannedDay pd = new PlannedDay();
                pd.weekNumber = weekNumber;
                pd.dayIndex = d.path("dayNumber").asInt(out.size() + 1);
                pd.name = "Tuần " + weekNumber + " · " + d.path("name").asString(d.path("dayOfWeekTitle").asString("Buổi tập"));
                pd.focus = d.path("focus").asString(null);
                pd.restDay = rest;
                pd.deload = t.getDeloadWeek() != null && t.getDeloadWeek() == weekNumber;
                for (JsonNode s : d.path("sections")) {
                    String section = s.path("sectionType").asString("MAIN");
                    for (JsonNode e : s.path("exercises")) {
                        Long exId = parseLong(e.path("exerciseId").asString(null));
                        if (exId == null) continue;
                        PlannedExercise pe = new PlannedExercise();
                        pe.templateExerciseId = exId;
                        pe.section = section;
                        pe.sets = Math.max(1, e.path("sets").asInt(3));
                        applyReps(pe, e.path("reps").asString(""), e.path("prescriptionType").asString(""));
                        pe.restSec = e.has("restSeconds") ? e.get("restSeconds").asInt(90) : 90;
                        pe.tempo = e.path("tempo").asString(null);
                        if (e.hasNonNull("rir")) pe.rpe = 10 - e.get("rir").asDouble();
                        else if (e.hasNonNull("rpe")) pe.rpe = e.get("rpe").asDouble();
                        pe.notes = e.path("coachingCues").asString(null);
                        pe.locked = e.path("locked").asBoolean(false);
                        pd.exercises.add(pe);
                    }
                }
                out.add(pd);
            }
        }
        return out;
    }

    static void applyReps(PlannedExercise pe, String reps, String type) {
        String r = reps == null ? "" : reps.trim().toLowerCase();
        if ("TIME_HOLD".equals(type) || r.endsWith("s")) {
            Integer sec = parseInt(r.replace("s", "").replace("giây", "").trim());
            pe.holdSec = sec == null ? 30 : sec;
            return;
        }
        if (r.contains("-")) {
            String[] parts = r.split("-");
            pe.repMin = parseInt(parts[0].trim());
            pe.repMax = parseInt(parts[1].trim());
        } else if (!r.isEmpty() && parseInt(r) != null) {
            pe.repMin = pe.repMax = parseInt(r);
        } else {
            pe.notes = reps;  // AMRAP / EMOM...
        }
    }

    /** Khung mặc định theo level khi không có giáo án mẫu phù hợp (đồng thời báo admin thiếu độ phủ). */
    List<PlannedDay> skeleton(RuleSetConfig rs, UserTrainingContext ctx, SkillGraph graph, Map<Long, String> statuses) {
        String lv = ctx.levelCode();
        int weeks = (int) rs.param("cycle.weeks." + lv, 4);
        boolean deload = ctx.levelRank() >= rs.param("cycle.deload.minRank", 2);
        int days = 3;   // khung dự phòng cố định 3 buổi toàn thân/tuần, không theo số buổi người dùng khai
        List<List<String[]>> templates = new ArrayList<>();
        List<String[]> fullBody = new ArrayList<>(List.of(new String[]{"PULL", "MAIN"}, new String[]{"PUSH", "MAIN"},
                new String[]{"LEGS", "MAIN"}, new String[]{"CORE", "ACCESSORY"}));
        if (ctx.levelRank() >= 2) fullBody.add(0, new String[]{"SKILL", "SKILL"});
        List<String[]> upper = List.of(new String[]{"SKILL", "SKILL"}, new String[]{"PULL", "MAIN"}, new String[]{"PUSH", "MAIN"},
                new String[]{"CORE", "ACCESSORY"});
        List<String[]> lower = List.of(new String[]{"LEGS", "MAIN"}, new String[]{"CORE", "MAIN"}, new String[]{"PULL", "ACCESSORY"});
        for (int i = 0; i < days; i++) templates.add(days <= 3 ? fullBody : (i % 2 == 0 ? upper : lower));

        List<PlannedDay> out = new ArrayList<>();
        for (int w = 1; w <= weeks; w++) {
            for (int i = 0; i < days; i++) {
                PlannedDay pd = new PlannedDay();
                pd.weekNumber = w;
                pd.dayIndex = i + 1;
                pd.deload = deload && w == weeks;
                pd.name = "Tuần " + w + " · " + (days <= 3 ? "Toàn thân " + (i + 1) : (i % 2 == 0 ? "Thân trên" : "Thân dưới & Core"));
                pd.focus = days <= 3 ? "Toàn thân" : (i % 2 == 0 ? "Kéo / Đẩy / Kỹ năng" : "Chân / Core");
                for (String[] slot : templates.get(i)) {
                    Long ex = workingNode(rs, slot[0], statuses);
                    if (ex == null) continue;
                    PlannedExercise pe = new PlannedExercise();
                    pe.templateExerciseId = ex;
                    pe.competency = slot[0];
                    pe.section = slot[1];
                    boolean hold = rs.ladderNode(ex).map(n -> !"VALID_REPS".equals(n.metric())).orElse(false);
                    pe.sets = "COOLDOWN".equals(slot[1]) ? 1 : (int) rs.param("dose.sets." + lv, 3);
                    if (hold) pe.holdSec = (int) rs.param("dose.holdSec." + lv, 30);
                    else { pe.repMin = (int) rs.param("dose.repMin." + lv, 8); pe.repMax = (int) rs.param("dose.repMax." + lv, 12); }
                    pe.restSec = (int) rs.param("dose.restSec." + lv, 90);
                    pe.rpe = 10 - rs.param("dose.rir." + lv, 2);
                    pd.exercises.add(pe);
                }
                out.add(pd);
            }
        }
        return out;
    }

    /** Nấc đang luyện của năng lực: nấc cao nhất READY/IN_PROGRESS; nếu không có thì nấc cao nhất đã đạt; cuối cùng là nấc đầu. */
    static Long workingNode(RuleSetConfig rs, String competency, Map<Long, String> statuses) {
        List<LadderNode> ladder = rs.ladder(competency);
        if (ladder.isEmpty()) return null;
        Long open = null, achieved = null;
        for (LadderNode n : ladder) {
            String s = statuses.getOrDefault(n.exerciseId(), SkillEngine.READY);
            if (SkillEngine.READY.equals(s) || SkillEngine.IN_PROGRESS.equals(s)) open = n.exerciseId();
            if (SkillEngine.ACHIEVED.equals(s) || SkillEngine.ACHIEVED_SELF_REPORTED.equals(s)) achieved = n.exerciseId();
        }
        return open != null ? open : achieved != null ? achieved : ladder.get(0).exerciseId();
    }

    // ============================== Giáo án mẫu -> ứng viên ==============================

    TemplateCandidate toCandidate(RuleSetConfig rs, ProgramTemplate t) {
        Map<String, Double> emphasis = readMap(t.getEmphasisJson());
        return new TemplateCandidate(t.getId(), t.getCode(), t.getVersion(), t.getName(),
                rs.level(t.getLevelMin()).rank(), rs.level(t.getLevelMax()).rank(), rs.level(t.getPrimaryLevel()).rank(),
                new ArrayList<>(readSet(t.getGoalCodes())), t.getDaysPerWeekMin(), t.getDaysPerWeekMax(), t.getSessionMinutes(),
                readSet(t.getRequiredEquipment()), emphasis, t.getPriority());
    }

    private List<String> recentTemplateCodes(Long userId) {
        List<String> codes = new ArrayList<>();
        for (WorkoutPlan p : planRepo.findByUserIdOrderByCreatedAtDesc(userId)) {
            if (p.getProgramTemplateId() == null) { codes.add(""); continue; }
            templateRepo.findById(p.getProgramTemplateId()).ifPresent(t -> codes.add(t.getCode()));
            if (codes.size() >= 2) break;
        }
        return codes;
    }

    private Set<Long> exercisesOf(Long planId) {
        List<Long> dayIds = dayRepo.findByWorkoutPlanIdOrderByDayNumberAsc(planId).stream().map(workoutPlanDay -> workoutPlanDay.getId()).toList();
        Set<Long> ids = new HashSet<>();
        if (!dayIds.isEmpty()) planExerciseRepo.findWithExerciseByDayIds(dayIds).forEach(e -> ids.add(e.getExercise().getId()));
        return ids;
    }

    // ============================== JSON helpers ==============================

    JsonNode readTree(String raw) {
        try {
            return json.readTree(raw == null || raw.isBlank() ? "{}" : raw);
        } catch (Exception e) {
            throw new IllegalArgumentException("Cấu trúc giáo án mẫu không hợp lệ.");
        }
    }

    Set<String> readSet(String raw) {
        if (raw == null || raw.isBlank()) return new LinkedHashSet<>();
        try {
            return new LinkedHashSet<>(json.readValue(raw, new TypeReference<List<String>>() {}));
        } catch (Exception e) {
            return new LinkedHashSet<>();
        }
    }

    Map<String, Double> readMap(String raw) {
        if (raw == null || raw.isBlank()) return Map.of();
        try {
            return json.readValue(raw, new TypeReference<Map<String, Double>>() {});
        } catch (Exception e) {
            return Map.of();
        }
    }

    private static Long parseLong(String s) {
        try { return s == null ? null : Long.valueOf(s.trim()); } catch (NumberFormatException e) { return null; }
    }

    private static Integer parseInt(String s) {
        try { return s == null || s.isBlank() ? null : Integer.valueOf(s.trim()); } catch (NumberFormatException e) { return null; }
    }

    private static String trim(String s, int max) {
        return s == null ? null : s.length() <= max ? s : s.substring(0, max);
    }
}
