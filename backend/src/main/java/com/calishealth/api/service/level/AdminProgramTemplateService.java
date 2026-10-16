package com.calishealth.api.service.level;

import com.calishealth.api.config.Actor;
import com.calishealth.api.dto.LevelEngineDtos.*;
import com.calishealth.api.engine.config.RuleSetConfig;
import com.calishealth.api.engine.program.ProgramEngine;
import com.calishealth.api.engine.program.ProgramModels.PlannedDay;
import com.calishealth.api.engine.program.ProgramModels.PlannedExercise;
import com.calishealth.api.entity.*;
import com.calishealth.api.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.*;

/**
 * Giáo án mẫu (Admin): điều kiện áp dụng + cấu trúc tuần/ngày/bài. Sửa bản đã xuất bản và đang được dùng
 * sẽ tạo phiên bản mới (bản cũ lưu trữ) để mọi chu kỳ tập cũ vẫn truy vết đúng phiên bản đã sinh ra nó.
 */
@Service
public class AdminProgramTemplateService {
    private final ProgramTemplateRepository repo;
    private final WorkoutPlanRepository planRepo;
    private final GoalRepository goalRepo;
    private final ExerciseRepository exerciseRepo;
    private final RuleSetProvider ruleSets;
    private final TrainingCycleService cycles;
    private final ObjectMapper json = new ObjectMapper();

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.calishealth.api.service.notification.NotificationService notifications;
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private AiReadinessService aiReadiness;

    public AdminProgramTemplateService(ProgramTemplateRepository repo, WorkoutPlanRepository planRepo, GoalRepository goalRepo,
                                       ExerciseRepository exerciseRepo, RuleSetProvider ruleSets, TrainingCycleService cycles) {
        this.repo = repo;
        this.planRepo = planRepo;
        this.goalRepo = goalRepo;
        this.exerciseRepo = exerciseRepo;
        this.ruleSets = ruleSets;
        this.cycles = cycles;
    }

    @Transactional(readOnly = true)
    public List<ProgramTemplateDto> list(boolean includeArchived) {
        List<ProgramTemplate> all = includeArchived ? repo.findAll() : repo.findByStatusNotOrderByUpdatedAtDesc(ProgramTemplate.ARCHIVED);
        return all.stream().sorted(Comparator.comparing((ProgramTemplate programTemplate) -> programTemplate.getUpdatedAt()).reversed()).map(t -> dto(t, true)).toList();
    }

    @Transactional(readOnly = true)
    public ProgramTemplateDto get(Long id) {
        return dto(find(id), true);
    }

    @Transactional
    public ProgramTemplateDto create(ProgramTemplateRequest req, String user) {
        ProgramTemplate t = new ProgramTemplate();
        t.setCode(uniqueCode(req.name()));
        t.setCreatedBy(user);
        apply(t, req);
        String status = req.status() == null || Actor.coachOnly() ? ProgramTemplate.DRAFT : req.status();   // Coach chỉ soạn bản nháp; Admin mới xuất bản
        if (ProgramTemplate.PUBLISHED.equals(status)) publishChecks(t);
        t.setStatus(status);
        if (ProgramTemplate.PUBLISHED.equals(status)) t.setPublishedAt(Instant.now());
        return dto(repo.save(t), true);
    }

    @Transactional
    public ProgramTemplateDto update(Long id, ProgramTemplateRequest req, String user) {
        ProgramTemplate t = find(id);
        if (ProgramTemplate.ARCHIVED.equals(t.getStatus())) throw new IllegalStateException("Giáo án đã lưu trữ, không thể sửa.");
        if (Actor.coachOnly() && !ProgramTemplate.DRAFT.equals(t.getStatus()))
            throw new IllegalStateException("Giáo án đang được áp dụng/đã xuất bản, Coach chỉ sửa được bản nháp. Hãy nhân bản thành bản nháp rồi gửi Admin duyệt.");
        boolean used = planRepo.countByProgramTemplateId(t.getId()) > 0;
        if (ProgramTemplate.PUBLISHED.equals(t.getStatus()) && used) {
            // Phiên bản mới, giữ nguyên bản cũ cho các chu kỳ đã sinh
            ProgramTemplate next = new ProgramTemplate();
            next.setCode(t.getCode());
            next.setVersion(repo.findTopByCodeOrderByVersionDesc(t.getCode()).map(programTemplate -> programTemplate.getVersion()).orElse(t.getVersion()) + 1);
            next.setCreatedBy(user);
            copy(t, next);
            apply(next, req);
            String status = req.status() == null ? ProgramTemplate.PUBLISHED : req.status();
            if (ProgramTemplate.PUBLISHED.equals(status)) publishChecks(next);
            next.setStatus(status);
            next.setPublishedAt(ProgramTemplate.PUBLISHED.equals(status) ? Instant.now() : null);
            t.setStatus(ProgramTemplate.ARCHIVED);
            repo.save(t);
            return dto(repo.save(next), true);
        }
        apply(t, req);
        if (req.status() != null && !Actor.coachOnly()) {
            if (ProgramTemplate.PUBLISHED.equals(req.status())) {
                publishChecks(t);
                if (t.getPublishedAt() == null) t.setPublishedAt(Instant.now());
            }
            t.setStatus(req.status());
        }
        return dto(repo.save(t), true);
    }

    @Transactional
    public ProgramTemplateDto setStatus(Long id, String status) {
        ProgramTemplate t = find(id);
        if (!List.of(ProgramTemplate.DRAFT, ProgramTemplate.PUBLISHED, ProgramTemplate.ARCHIVED).contains(status)) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ: " + status);
        }
        if (ProgramTemplate.PUBLISHED.equals(status)) {
            publishChecks(t);
            t.setPublishedAt(Instant.now());
        }
        t.setStatus(status);
        ProgramTemplateDto saved = dto(repo.save(t), true);
        notifyAuthor(t, status);
        return saved;
    }

    /** Coach gửi bản nháp cho Admin duyệt và xuất bản (chỉ thông báo; trạng thái vẫn là bản nháp cho tới khi Admin xuất bản). */
    @Transactional
    public ProgramTemplateDto submitForReview(Long id) {
        ProgramTemplate t = find(id);
        if (!ProgramTemplate.DRAFT.equals(t.getStatus())) throw new IllegalStateException("Chỉ gửi duyệt được bản nháp (đang " + t.getStatus() + ").");
        publishChecks(t);   // gửi đi thì phải xuất bản được: có bài, bài tồn tại trong thư viện
        if (notifications != null) notifications.notifyRole("ADMIN", "PROGRAM_TEMPLATE_SUBMITTED", "Giáo án mẫu chờ duyệt",
                (t.getCreatedBy() == null ? "Coach" : t.getCreatedBy()) + " gửi giáo án \"" + t.getName() + "\" để duyệt và xuất bản.", "PROGRAM_TEMPLATE", t.getId());
        return dto(t, true);
    }

    @Transactional
    public ProgramTemplateDto duplicate(Long id, String user) {
        ProgramTemplate src = find(id);
        ProgramTemplate t = new ProgramTemplate();
        copy(src, t);
        t.setName(src.getName() + " (Bản sao)");
        t.setCode(uniqueCode(t.getName()));
        t.setStatus(ProgramTemplate.DRAFT);
        t.setCreatedBy(user);
        return dto(repo.save(t), true);
    }

    @Transactional
    public void delete(Long id) {
        ProgramTemplate t = find(id);
        if (planRepo.countByProgramTemplateId(id) > 0) {
            t.setStatus(ProgramTemplate.ARCHIVED);  // đã sinh chu kỳ cho học viên -> chỉ lưu trữ để giữ truy vết
            repo.save(t);
            return;
        }
        repo.delete(t);
    }

    /** Ma trận độ phủ: Level × Mục tiêu × Số buổi/tuần -> số giáo án áp dụng được (ô 0 = thiếu giáo án). */
    @Transactional(readOnly = true)
    public CoverageDto coverage() {
        RuleSetConfig rs = ruleSets.active();
        List<ProgramTemplate> published = repo.findByStatus(ProgramTemplate.PUBLISHED);
        List<String> levels = rs.levelsAsc().stream().map(levelDef -> levelDef.code()).toList();
        List<String> goals = goalRepo.findByActiveTrue().stream().map(goal -> goal.getCode()).toList();
        List<Integer> days = List.of(2, 3, 4, 5, 6);
        List<CoverageCellDto> cells = new ArrayList<>();
        for (String level : levels) {
            int rank = rs.level(level).rank();
            for (String goal : goals) {
                String category = goalRepo.findByCode(goal).map(found -> found.getCategory()).orElse(null);
                for (int d : days) {
                    List<String> names = published.stream()
                            .filter(t -> rs.level(t.getLevelMin()).rank() <= rank && rank <= rs.level(t.getLevelMax()).rank())
                            .filter(t -> t.getDaysPerWeekMin() <= d && d <= t.getDaysPerWeekMax())
                            .filter(t -> {
                                Set<String> g = cycles.readSet(t.getGoalCodes());
                                return g.isEmpty() || g.contains(goal) || g.contains("GENERAL_FITNESS") || (category != null && g.contains(category));
                            }).map(programTemplate -> programTemplate.getName()).toList();
                    cells.add(new CoverageCellDto(level, goal, d, names.size(), names));
                }
            }
        }
        return new CoverageDto(levels, goals, days, cells);
    }

    // ============================== Helpers ==============================

    private void apply(ProgramTemplate t, ProgramTemplateRequest r) {
        RuleSetConfig rs = ruleSets.active();
        if (r.name() != null) t.setName(r.name().trim());
        if (t.getName() == null || t.getName().isBlank()) throw new IllegalArgumentException("Tên giáo án không được để trống.");
        if (r.description() != null) t.setDescription(r.description());
        if (r.primaryLevel() != null) t.setPrimaryLevel(level(rs, r.primaryLevel()));
        if (r.levelMin() != null) t.setLevelMin(level(rs, r.levelMin()));
        if (r.levelMax() != null) t.setLevelMax(level(rs, r.levelMax()));
        if (t.getPrimaryLevel() == null) t.setPrimaryLevel(rs.levelByRank(1).code());
        if (t.getLevelMin() == null) t.setLevelMin(t.getPrimaryLevel());
        if (t.getLevelMax() == null) t.setLevelMax(t.getPrimaryLevel());
        int min = rs.level(t.getLevelMin()).rank(), max = rs.level(t.getLevelMax()).rank(), primary = rs.level(t.getPrimaryLevel()).rank();
        if (min > max || primary < min || primary > max) throw new IllegalArgumentException("Khoảng level không hợp lệ (level chính phải nằm trong khoảng).");
        if (r.goalCodes() != null) t.setGoalCodes(json.writeValueAsString(r.goalCodes()));
        if (t.getGoalCodes() == null) t.setGoalCodes("[]");
        if (r.daysPerWeekMin() != null) t.setDaysPerWeekMin(r.daysPerWeekMin());
        if (r.daysPerWeekMax() != null) t.setDaysPerWeekMax(r.daysPerWeekMax());
        if (r.sessionMinutes() != null) t.setSessionMinutes(r.sessionMinutes());
        if (r.durationWeeks() != null) t.setDurationWeeks(r.durationWeeks());
        t.setDeloadWeek(r.deloadWeek() != null && r.deloadWeek() > 0 ? r.deloadWeek() : (r.deloadWeek() != null ? null : t.getDeloadWeek()));
        if (r.requiredEquipment() != null) t.setRequiredEquipment(json.writeValueAsString(r.requiredEquipment().stream()
                .map(s -> s.trim().toUpperCase()).filter(s -> !s.isEmpty() && !"NONE".equals(s)).distinct().toList()));
        if (t.getRequiredEquipment() == null) t.setRequiredEquipment("[]");
        if (r.requiresCoachReview() != null) t.setRequiresCoachReview(r.requiresCoachReview());
        if (r.priority() != null) t.setPriority(r.priority());
        if (r.structure() != null) t.setStructureJson(json.writeValueAsString(r.structure()));
        if (t.getStructureJson() == null) t.setStructureJson("{\"weeks\":[]}");
        if (t.getDaysPerWeekMin() <= 0) t.setDaysPerWeekMin(3);
        if (t.getDaysPerWeekMax() < t.getDaysPerWeekMin()) t.setDaysPerWeekMax(t.getDaysPerWeekMin());
        if (t.getSessionMinutes() <= 0) t.setSessionMinutes(45);
        if (t.getDurationWeeks() <= 0) t.setDurationWeeks(Math.max(1, weeksIn(t)));
        if (r.emphasis() != null && !r.emphasis().isEmpty()) t.setEmphasisJson(json.writeValueAsString(normalizeEmphasis(r.emphasis())));
        else t.setEmphasisJson(json.writeValueAsString(computeEmphasis(rs, t)));
    }

    /** Trọng tâm năng lực tự tính từ số set theo năng lực trong cấu trúc giáo án. */
    Map<String, Double> computeEmphasis(RuleSetConfig rs, ProgramTemplate t) {
        Map<String, Double> sets = new LinkedHashMap<>();
        List<PlannedDay> days = cycles.fromTemplate(t, 7);
        Set<Long> ids = new HashSet<>();
        days.forEach(d -> d.exercises.forEach(e -> ids.add(e.templateExerciseId)));
        Map<Long, String> comp = new HashMap<>();
        exerciseRepo.findAllById(ids).forEach(e -> comp.put(e.getId(), rs.ladderNode(e.getId()).map(ladderNode -> ladderNode.competency())
                .orElse(e.getCategory() == null ? null : e.getCategory().getCode())));
        for (PlannedDay d : days) for (PlannedExercise e : d.exercises) {
            String c = comp.get(e.templateExerciseId);
            if (c == null || !ProgramEngine.PRIMARY.contains(c) || "WARMUP".equals(e.section) || "COOLDOWN".equals(e.section)) continue;   // khởi động và thả lỏng không phản ánh trọng tâm của giáo án
            sets.merge(c, (double) e.sets, (left, right) -> Double.sum(left, right));
        }
        return normalizeEmphasis(sets);
    }

    private static Map<String, Double> normalizeEmphasis(Map<String, Double> raw) {
        double sum = raw.values().stream().mapToDouble(v -> Math.max(0, v)).sum();
        Map<String, Double> out = new LinkedHashMap<>();
        if (sum <= 0) return out;
        raw.forEach((k, v) -> out.put(k.toUpperCase(), Math.round(Math.max(0, v) / sum * 1000) / 1000.0));
        return out;
    }

    private void publishChecks(ProgramTemplate t) {
        List<PlannedDay> days = cycles.fromTemplate(t, 7);
        long exercises = days.stream().mapToLong(d -> d.exercises.size()).sum();
        if (exercises == 0) throw new IllegalArgumentException("Giáo án chưa có bài tập nào nên chưa thể xuất bản.");
        Set<Long> ids = new HashSet<>();
        days.forEach(d -> d.exercises.forEach(e -> ids.add(e.templateExerciseId)));
        long found = exerciseRepo.findAllById(ids).size();
        if (found < ids.size()) throw new IllegalArgumentException("Giáo án tham chiếu bài tập không tồn tại trong thư viện.");
        sessionStructureChecks(days, ids);
    }

    private static final Map<String, String> SECTION_LABEL = Map.of("WARMUP", "Khởi động", "MAIN", "Bài chính", "ACCESSORY", "Bài bổ trợ", "COOLDOWN", "Thả lỏng & đo linh hoạt");

    /**
     * Mỗi buổi tập phải đủ 4 phần (khởi động, bài chính, bài bổ trợ, thả lỏng & đo linh hoạt), phần Bài chính có ít nhất một bài đo được bằng AI,
     * và bài đặt ở phần nào thì phần đó phải nằm trong "dùng được ở phần nào" của bài (bài chưa phân loại thì không bị chặn).
     */
    private void sessionStructureChecks(List<PlannedDay> days, Set<Long> exerciseIds) {
        Map<Long, Set<String>> roles = new HashMap<>();
        Map<Long, String> names = new HashMap<>();
        exerciseRepo.findAllById(exerciseIds).forEach(e -> {
            names.put(e.getId(), e.getName());
            if (e.getSessionRoles() != null && !e.getSessionRoles().isBlank())
                roles.put(e.getId(), new HashSet<>(Arrays.asList(e.getSessionRoles().split(","))));
        });
        Map<Long, com.calishealth.api.dto.TrainingSessionDtos.AiInfo> ai = aiReadiness == null ? Map.of() : aiReadiness.infoFor(exerciseIds);
        Set<String> problems = new LinkedHashSet<>();
        for (PlannedDay d : days) {
            if (d.restDay) continue;
            String where = "Buổi " + d.dayIndex + " (tuần " + d.weekNumber + ")";
            Map<String, List<PlannedExercise>> bySection = new LinkedHashMap<>();
            for (PlannedExercise e : d.exercises) bySection.computeIfAbsent("SKILL".equals(e.section) ? "MAIN" : e.section, k -> new ArrayList<>()).add(e);
            for (String sec : List.of("WARMUP", "MAIN", "ACCESSORY", "COOLDOWN"))
                if (bySection.getOrDefault(sec, List.of()).isEmpty()) problems.add(where + " thiếu phần “" + SECTION_LABEL.get(sec) + "”.");
            if (aiReadiness != null && bySection.getOrDefault("MAIN", List.of()).stream().noneMatch(e -> aiReadiness.isReady(e.templateExerciseId, ai)))
                if (!bySection.getOrDefault("MAIN", List.of()).isEmpty()) problems.add(where + ": phần “Bài chính” chưa có bài nào đo được bằng AI.");
            for (Map.Entry<String, List<PlannedExercise>> en : bySection.entrySet())
                for (PlannedExercise e : en.getValue()) {
                    Set<String> allowed = roles.get(e.templateExerciseId);
                    if (allowed != null && !allowed.contains(en.getKey()))
                        problems.add(where + ": “" + names.get(e.templateExerciseId) + "” không dùng được ở phần “" + SECTION_LABEL.getOrDefault(en.getKey(), en.getKey()) + "”.");
                }
        }
        if (!problems.isEmpty()) {
            List<String> shown = problems.stream().limit(6).toList();
            throw new IllegalArgumentException("Giáo án chưa đúng cấu trúc buổi tập: " + String.join(" ", shown) + (problems.size() > shown.size() ? " (và " + (problems.size() - shown.size()) + " lỗi khác)" : ""));
        }
    }

    /** Báo tác giả khi Admin xuất bản hoặc lưu trữ giáo án của họ (không tự báo cho chính người vừa thao tác). */
    private void notifyAuthor(ProgramTemplate t, String status) {
        if (notifications == null || t.getCreatedBy() == null) return;
        String me = com.calishealth.api.config.Actor.email();
        if (me != null && me.equalsIgnoreCase(t.getCreatedBy())) return;
        if (ProgramTemplate.PUBLISHED.equals(status)) notifications.notifyEmail(t.getCreatedBy(), "PROGRAM_TEMPLATE_PUBLISHED", "Giáo án mẫu đã được xuất bản",
                "Giáo án \"" + t.getName() + "\" đã được Admin duyệt và xuất bản.", "PROGRAM_TEMPLATE", t.getId());
        else if (ProgramTemplate.ARCHIVED.equals(status)) notifications.notifyEmail(t.getCreatedBy(), "PROGRAM_TEMPLATE_ARCHIVED", "Giáo án mẫu đã được lưu trữ",
                "Giáo án \"" + t.getName() + "\" đã được Admin lưu trữ.", "PROGRAM_TEMPLATE", t.getId());
    }

    private int weeksIn(ProgramTemplate t) {
        JsonNode root = cycles.readTree(t.getStructureJson());
        JsonNode weeks = root.has("weeks") ? root.get("weeks") : root;
        return weeks.isArray() ? weeks.size() : 0;
    }

    private static String level(RuleSetConfig rs, String raw) {
        String v = raw.trim().toUpperCase();
        for (RuleSetConfig.LevelDef l : rs.levelsAsc()) if (l.code().equals(v) || l.name().equals(v)) return l.code();
        throw new IllegalArgumentException("Level không hợp lệ: " + raw);
    }

    private static void copy(ProgramTemplate s, ProgramTemplate t) {
        t.setName(s.getName());
        t.setDescription(s.getDescription());
        t.setLevelMin(s.getLevelMin());
        t.setLevelMax(s.getLevelMax());
        t.setPrimaryLevel(s.getPrimaryLevel());
        t.setGoalCodes(s.getGoalCodes());
        t.setDaysPerWeekMin(s.getDaysPerWeekMin());
        t.setDaysPerWeekMax(s.getDaysPerWeekMax());
        t.setSessionMinutes(s.getSessionMinutes());
        t.setDurationWeeks(s.getDurationWeeks());
        t.setDeloadWeek(s.getDeloadWeek());
        t.setRequiredEquipment(s.getRequiredEquipment());
        t.setEmphasisJson(s.getEmphasisJson());
        t.setRequiresCoachReview(s.isRequiresCoachReview());
        t.setPriority(s.getPriority());
        t.setStructureJson(s.getStructureJson());
    }

    private String uniqueCode(String name) {
        String base = (name == null ? "PROGRAM" : java.text.Normalizer.normalize(name, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "").replace('đ', 'd').replace('Đ', 'D'))
                .toUpperCase().replaceAll("[^A-Z0-9]+", "_").replaceAll("^_|_$", "");
        if (base.isEmpty()) base = "PROGRAM";
        if (base.length() > 60) base = base.substring(0, 60);
        String code = base;
        for (int i = 2; repo.existsByCode(code); i++) code = base + "_" + i;
        return code;
    }

    private ProgramTemplate find(Long id) {
        return repo.findById(id).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy giáo án mẫu " + id));
    }

    private ProgramTemplateDto dto(ProgramTemplate t, boolean withStructure) {
        Object structure = null;
        if (withStructure) {
            try { structure = json.readValue(t.getStructureJson(), Object.class); } catch (Exception e) { structure = Map.of(); }
        }
        return new ProgramTemplateDto(String.valueOf(t.getId()), t.getCode(), t.getVersion(), t.getName(), t.getDescription(), t.getStatus(),
                t.getLevelMin(), t.getLevelMax(), t.getPrimaryLevel(), new ArrayList<>(cycles.readSet(t.getGoalCodes())),
                t.getDaysPerWeekMin(), t.getDaysPerWeekMax(), t.getSessionMinutes(), t.getDurationWeeks(), t.getDeloadWeek(),
                new ArrayList<>(cycles.readSet(t.getRequiredEquipment())), cycles.readMap(t.getEmphasisJson()), t.isRequiresCoachReview(),
                t.getPriority(), structure, t.getCreatedBy(), t.getCreatedAt(), t.getUpdatedAt(), t.getPublishedAt(),
                planRepo.countDistinctUsersByProgramTemplateId(t.getId()),
                planRepo.countByProgramTemplateIdAndStatus(t.getId(), WorkoutPlanStatus.ACTIVE));
    }
}
