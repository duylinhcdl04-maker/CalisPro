package com.calishealth.api.service.level;

import com.calishealth.api.dto.LevelEngineDtos.*;
import com.calishealth.api.engine.config.DefaultLevelEngineConfig;
import com.calishealth.api.engine.config.RuleSetConfig;
import com.calishealth.api.engine.level.CompetencyScoringEngine;
import com.calishealth.api.engine.level.CompetencyScoringEngine.CompetencyResult;
import com.calishealth.api.engine.level.ExplanationBuilder;
import com.calishealth.api.engine.level.LevelEvaluationEngine;
import com.calishealth.api.engine.level.LevelModels.*;
import com.calishealth.api.engine.skill.SkillGraph;
import com.calishealth.api.entity.*;
import com.calishealth.api.repository.*;
import com.calishealth.api.config.Actor;
import com.calishealth.api.service.notification.NotificationService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

/**
 * Quản trị bộ quy tắc Level Engine có version: clone -> sửa bản DRAFT -> kiểm tra -> mô phỏng -> kích hoạt.
 * Bản ACTIVE/ARCHIVED bất biến để kết quả lịch sử luôn tái lập được.
 */
@Service
public class AdminLevelEngineService {
    private final RuleSetRepository ruleSetRepo;
    private final EngineParameterRepository paramRepo;
    private final CompetencyLadderNodeRepository ladderRepo;
    private final FitnessLevelRepository levelRepo;
    private final LevelRequirementRepository requirementRepo;
    private final ConsistencyRuleRepository consistencyRepo;
    private final ExerciseRepository exerciseRepo;
    private final RuleSetProvider provider;
    private final SkillProgressService skills;
    private final NotificationService notifications;
    private final ObjectMapper json = new ObjectMapper();

    public AdminLevelEngineService(RuleSetRepository ruleSetRepo, EngineParameterRepository paramRepo,
                                   CompetencyLadderNodeRepository ladderRepo, FitnessLevelRepository levelRepo,
                                   LevelRequirementRepository requirementRepo, ConsistencyRuleRepository consistencyRepo,
                                   ExerciseRepository exerciseRepo, RuleSetProvider provider, SkillProgressService skills, NotificationService notifications) {
        this.ruleSetRepo = ruleSetRepo;
        this.paramRepo = paramRepo;
        this.ladderRepo = ladderRepo;
        this.levelRepo = levelRepo;
        this.requirementRepo = requirementRepo;
        this.consistencyRepo = consistencyRepo;
        this.exerciseRepo = exerciseRepo;
        this.provider = provider;
        this.skills = skills;
        this.notifications = notifications;
    }

    @Transactional(readOnly = true)
    public List<RuleSetSummaryDto> list() {
        return ruleSetRepo.findByCodeOrderByVersionDesc(DefaultLevelEngineConfig.RULE_SET_CODE).stream().map(this::summary).toList();
    }

    @Transactional(readOnly = true)
    public RuleSetDetailDto detail(Long id) {
        RuleSet rs = find(id);
        List<ParamDto> params = paramRepo.findByRuleSetId(id).stream()
                .sorted(Comparator.comparing(engineParameter -> engineParameter.getParamKey()))
                .map(p -> new ParamDto(p.getParamKey(), p.getParamValue().doubleValue(), p.getSourceType(), p.getSourceReference())).toList();
        List<LadderNodeDto> ladders = ladderRepo.findWithExerciseByRuleSetId(id).stream().map(n -> new LadderNodeDto(n.getCompetencyCode(),
                String.valueOf(n.getExercise().getId()), n.getExercise().getCode(), n.getExercise().getName(), n.getNodeOrder(), n.getMetric(),
                n.getBaseScore().doubleValue(), n.getSpanScore().doubleValue(), n.getTargetValue().doubleValue(),
                n.getEntryValue().doubleValue(), n.getSourceType(), n.getSourceReference())).toList();
        List<FitnessLevel> levels = levelRepo.findByRuleSetIdOrderByRankNoAsc(id);
        Map<Long, List<RequirementDto>> reqs = new HashMap<>();
        if (!levels.isEmpty()) {
            requirementRepo.findWithRefsByLevelIds(levels.stream().map(fitnessLevel -> fitnessLevel.getId()).toList()).forEach(r ->
                    reqs.computeIfAbsent(r.getLevel().getId(), k -> new ArrayList<>()).add(new RequirementDto(r.getGate(), r.getCompetencyCode(),
                            r.getExercise() == null ? null : String.valueOf(r.getExercise().getId()),
                            r.getExercise() == null ? null : r.getExercise().getCode(), r.getMetric(), r.getOperator(),
                            r.getValue().doubleValue(), r.isMandatory(), r.getSourceType(), r.getSourceReference())));
        }
        List<LevelConfigDto> levelDtos = levels.stream().map(l -> new LevelConfigDto(l.getCode(), l.getRankNo(), l.getName(),
                l.getOverallPromoteMin().doubleValue(), l.getOverallRegressBelow().doubleValue(), l.getMinCompetencyConfidence().doubleValue(),
                l.getDescription(), l.getColorScheme(), reqs.getOrDefault(l.getId(), List.of()))).toList();
        List<ConsistencyRuleDto> rules = consistencyRepo.findByRuleSetId(id).stream().map(c -> new ConsistencyRuleDto(c.getCode(),
                c.getConditionJson(), c.getSeverity(), readList(c.getAffectedCompetencies()), c.getMessage())).toList();
        return new RuleSetDetailDto(summary(rs), params, ladders, levelDtos, rules);
    }

    @Transactional
    public RuleSetDetailDto cloneRuleSet(Long id, String user, Long authorId) {
        RuleSet source = find(id);
        RuleSetDetailDto d = detail(id);
        RuleSet copy = new RuleSet();
        copy.setCode(source.getCode());
        copy.setVersion(ruleSetRepo.findTopByCodeOrderByVersionDesc(source.getCode()).map(ruleSet -> ruleSet.getVersion()).orElse(0) + 1);
        copy.setStatus(RuleSet.DRAFT);
        copy.setParentId(source.getId());
        copy.setNotes("Bản sao từ v" + source.getVersion());
        copy.setCreatedBy(user);
        copy.setAuthorId(authorId);
        copy = ruleSetRepo.save(copy);
        writeChildren(copy.getId(), new UpdateRuleSetRequest(null, d.params(), d.ladders(), d.levels(), d.consistencyRules()));
        return detail(copy.getId());
    }

    @Transactional
    public RuleSetDetailDto update(Long id, UpdateRuleSetRequest req, Long actorId) {
        RuleSet rs = find(id);
        if (RuleSet.PENDING_REVIEW.equals(rs.getStatus())) throw new IllegalStateException("Bản này đang chờ Admin duyệt nên không sửa được. Hãy rút lại yêu cầu duyệt nếu cần chỉnh thêm.");
        checkAuthor(rs, actorId);
        if (!RuleSet.DRAFT.equals(rs.getStatus())) throw new IllegalStateException("Chỉ sửa được bản DRAFT. Hãy clone bộ quy tắc để tạo phiên bản mới.");
        List<String> errors = validate(req);
        if (!errors.isEmpty()) throw new IllegalArgumentException(String.join(" ", errors));
        if (req.notes() != null) rs.setNotes(req.notes());
        ruleSetRepo.save(rs);
        deleteChildren(id);
        writeChildren(id, req);
        provider.evict(id);
        return detail(id);
    }

    /** Coach gửi bản DRAFT của mình cho Admin duyệt. Kiểm tra hợp lệ trước; Admin được báo ngay (WebSocket). */
    @Transactional
    public RuleSetDetailDto submit(Long id, Long actorId) {
        RuleSet rs = find(id);
        if (!RuleSet.DRAFT.equals(rs.getStatus())) throw new IllegalStateException("Chỉ gửi duyệt được bản DRAFT (đang " + rs.getStatus() + ").");
        checkAuthor(rs, actorId);
        RuleSetDetailDto d = detail(id);
        List<String> errors = validate(new UpdateRuleSetRequest(null, d.params(), d.ladders(), d.levels(), d.consistencyRules()));
        if (!errors.isEmpty()) throw new IllegalArgumentException("Chưa thể gửi duyệt: " + String.join(" ", errors));
        rs.setStatus(RuleSet.PENDING_REVIEW);
        rs.setSubmittedAt(Instant.now());
        if (rs.getAuthorId() == null) rs.setAuthorId(actorId);
        ruleSetRepo.save(rs);
        notifications.notifyRole("ADMIN", "LEVEL_ENGINE_SUBMITTED", "Level Engine v" + rs.getVersion() + " chờ duyệt",
                (rs.getCreatedBy() == null ? "Coach" : rs.getCreatedBy()) + " đã gửi bản " + rs.getCode() + " v" + rs.getVersion() + " để duyệt và kích hoạt.",
                "LEVEL_ENGINE_RULE_SET", rs.getId());
        return detail(id);
    }

    /** Tác giả rút lại yêu cầu duyệt để sửa tiếp (chỉ khi chưa được duyệt). */
    @Transactional
    public RuleSetDetailDto withdraw(Long id, Long actorId) {
        RuleSet rs = find(id);
        if (!RuleSet.PENDING_REVIEW.equals(rs.getStatus())) throw new IllegalStateException("Bản này không ở trạng thái chờ duyệt (đang " + rs.getStatus() + ").");
        checkAuthor(rs, actorId);
        rs.setStatus(RuleSet.DRAFT);
        rs.setSubmittedAt(null);
        ruleSetRepo.save(rs);
        return detail(id);
    }

    /** Admin quyết định: APPROVED => kích hoạt làm bản chính (bản ACTIVE cũ => ARCHIVED); CHANGES_REQUESTED => trả về DRAFT kèm lý do. */
    @Transactional
    public RuleSetDetailDto decide(Long id, Long adminId, RuleSetDecisionRequest req) {
        RuleSet rs = find(id);
        if (!RuleSet.PENDING_REVIEW.equals(rs.getStatus())) throw new IllegalStateException("Bản này chưa được gửi duyệt (đang " + rs.getStatus() + ").");
        String decision = req == null || req.decision() == null ? "" : req.decision().trim().toUpperCase(Locale.ROOT);
        if ("CHANGES_REQUESTED".equals(decision)) {
            if (req.notes() == null || req.notes().isBlank()) throw new IllegalArgumentException("Cần ghi rõ Coach phải chỉnh sửa gì.");
            checkNotSelfApproval(rs, adminId);
            rs.setStatus(RuleSet.DRAFT);
            rs.setSubmittedAt(null);
            ruleSetRepo.save(rs);
            notifyAuthor(rs, adminId, "LEVEL_ENGINE_CHANGES_REQUESTED", "Level Engine v" + rs.getVersion() + " cần chỉnh sửa", req.notes().trim());
            return detail(id);
        }
        if (!"APPROVED".equals(decision)) throw new IllegalArgumentException("decision phải là APPROVED hoặc CHANGES_REQUESTED.");
        return activate(id, adminId);
    }

    /** Kích hoạt làm bản chính. Bản đang chờ duyệt do chính Admin gửi thì không tự kích hoạt được. */
    @Transactional
    public RuleSetDetailDto activate(Long id, Long adminId) {
        RuleSet rs = find(id);
        if (RuleSet.ACTIVE.equals(rs.getStatus())) return detail(id);
        if (RuleSet.ARCHIVED.equals(rs.getStatus())) throw new IllegalStateException("Bản đã lưu trữ không kích hoạt lại được. Hãy clone thành bản nháp mới.");
        if (RuleSet.PENDING_REVIEW.equals(rs.getStatus())) checkNotSelfApproval(rs, adminId);
        else if (rs.getAuthorId() != null && !rs.getAuthorId().equals(adminId))
            throw new IllegalStateException("Bản nháp này do Coach soạn nên phải được Coach gửi duyệt trước khi Admin kích hoạt.");
        RuleSetDetailDto d = detail(id);
        List<String> errors = validate(new UpdateRuleSetRequest(null, d.params(), d.ladders(), d.levels(), d.consistencyRules()));
        if (!errors.isEmpty()) throw new IllegalArgumentException("Chưa thể kích hoạt: " + String.join(" ", errors));
        ruleSetRepo.findByCodeOrderByVersionDesc(rs.getCode()).stream().filter(r -> RuleSet.ACTIVE.equals(r.getStatus())).forEach(r -> {
            r.setStatus(RuleSet.ARCHIVED);
            ruleSetRepo.save(r);
            provider.evict(r.getId());
        });
        rs.setStatus(RuleSet.ACTIVE);
        rs.setActivatedAt(Instant.now());
        ruleSetRepo.save(rs);
        provider.evict(id);
        notifyAuthor(rs, adminId, "LEVEL_ENGINE_ACTIVATED", "Level Engine v" + rs.getVersion() + " đã được áp dụng",
                "Admin đã duyệt và kích hoạt " + rs.getCode() + " v" + rs.getVersion() + " làm bản chính.");
        return detail(id);
    }

    /** Coach chỉ sửa/gửi duyệt bản do mình soạn; bản chưa có tác giả thì người đầu tiên nhận làm tác giả. Admin không bị giới hạn. */
    private void checkAuthor(RuleSet rs, Long actorId) {
        if (!Actor.coachOnly() || actorId == null) return;
        if (rs.getAuthorId() == null) { rs.setAuthorId(actorId); ruleSetRepo.save(rs); return; }
        if (!rs.getAuthorId().equals(actorId)) throw new AccessDeniedException("Chỉ tác giả được sửa bản DRAFT này. Hãy clone để soạn bản riêng.");
    }

    private void checkNotSelfApproval(RuleSet rs, Long adminId) {
        if (rs.getAuthorId() != null && rs.getAuthorId().equals(adminId)) throw new AccessDeniedException("Không được tự duyệt bản do chính mình soạn.");
    }

    private void notifyAuthor(RuleSet rs, Long actorId, String type, String title, String message) {
        if (rs.getAuthorId() == null || rs.getAuthorId().equals(actorId)) return;
        notifications.notifyUsers(List.of(rs.getAuthorId()), type, title, message, "LEVEL_ENGINE_RULE_SET", rs.getId());
    }

    @Transactional(readOnly = true)
    public ValidationDto validateRuleSet(Long id) {
        RuleSetDetailDto d = detail(id);
        List<String> errors = validate(new UpdateRuleSetRequest(null, d.params(), d.ladders(), d.levels(), d.consistencyRules()));
        return new ValidationDto(errors.isEmpty(), errors);
    }

    /** Mô phỏng: chạy engine trên dữ liệu giả lập với rule set bất kỳ (kể cả DRAFT), không ghi DB. */
    @Transactional(readOnly = true)
    public SimulateResponse simulate(SimulateRequest req) {
        RuleSetConfig rs = req.ruleSetId() == null ? provider.active() : provider.byId(Long.valueOf(req.ruleSetId()));
        double conf = req.confidence() == null ? 0.9 : req.confidence();
        Map<String, CompetencyResult> comps = new LinkedHashMap<>();
        if (req.competencies() != null) req.competencies().forEach((c, v) -> comps.put(c,
                new CompetencyResult(c, v, v, conf, rs.band(v, null), null, "SIMULATED", null)));
        Double overall = CompetencyScoringEngine.overall(rs, comps);
        Map<String, Long> ids = new HashMap<>();
        exerciseRepo.findAll().forEach(e -> ids.put(e.getCode(), e.getId()));
        List<TestOutcome> tests = new ArrayList<>();
        if (req.tests() != null) for (SimTestDto t : req.tests()) {
            Long exId = ids.get(t.exerciseCode());
            if (exId == null) throw new IllegalArgumentException("Không có bài tập " + t.exerciseCode());
            String metric = rs.ladderNode(exId).map(ladderNode -> ladderNode.metric()).orElse(t.holdSec() != null ? "HOLD_SEC" : "VALID_REPS");
            tests.add(new TestOutcome(exId, t.exerciseCode(), rs.ladderNode(exId).map(ladderNode -> ladderNode.competency()).orElse(null),
                    metric, t.totalReps(), t.validReps(), t.holdSec(), null, t.formScore(), null, t.majorViolations(),
                    t.poseConfidence() == null ? 0.85 : t.poseConfidence(), t.visibility() == null ? 0.9 : t.visibility(), null,
                    t.trackedRatio() == null ? 0.95 : t.trackedRatio(), 0.85, "AI_MEASURED", "VALID", true));
        }
        Map<Long, String> nodes = new HashMap<>();
        if (req.nodeStatus() != null) req.nodeStatus().forEach((code, st) -> { if (ids.containsKey(code)) nodes.put(ids.get(code), st); });
        SkillGraph graph = skills.graph(rs);
        String current = req.currentLevel() == null ? rs.levelByRank(0).code() : req.currentLevel();
        Outcome o = LevelEvaluationEngine.evaluate(new LevelContext(current, req.status() == null ? "VERIFIED" : req.status(),
                req.previousEwma(), req.consecutiveBelow() == null ? 0 : req.consecutiveBelow(), comps, overall, tests, nodes,
                graph.harderEquivalents(), null, List.of(), Boolean.TRUE.equals(req.baseline()), Boolean.TRUE.equals(req.coachVerified()),
                false, Instant.now()), rs);
        Map<String, String> gates = new LinkedHashMap<>();
        o.gates().forEach((k, v) -> gates.put(k, v.status()));
        EvaluationDto ev = new EvaluationDto(null, null, o.previousLevel(), o.candidateLevel(), o.finalLevel(), o.overall(), o.ewma(), gates,
                o.decision(), o.reasons().stream().map(r -> new ReasonDto(r.gate(), r.code(), r.competency(), r.exerciseCode(), r.required(),
                r.actual(), r.passed(), r.message())).toList(),
                ExplanationBuilder.level(rs, o.previousLevel(), o.finalLevel(), o.decision(), o.overall(), o.reasons()),
                rs.code() + " v" + rs.version(), RuleSetConfig.ALGORITHM_VERSION, null, Instant.now());
        return new SimulateResponse(overall, ev, FitnessStateMapper.competencies(rs, comps));
    }

    // ============================== Kiểm tra cấu hình ==============================

    List<String> validate(UpdateRuleSetRequest req) {
        List<String> errors = new ArrayList<>();
        Map<String, Double> params = new HashMap<>();
        if (req.params() != null) req.params().forEach(p -> params.put(p.key(), p.value()));
        double sum = 0;
        for (String c : List.of("PUSH", "PULL", "LEGS", "CORE", "MOBILITY", "SKILL")) sum += params.getOrDefault("overall.weight." + c, 0.0);
        if (Math.abs(sum - 1) > 0.001) errors.add("Tổng trọng số điểm tổng (overall.weight.*) phải bằng 1 (hiện " + Math.round(sum * 1000) / 1000.0 + ").");
        List<LevelConfigDto> levels = req.levels() == null ? List.of() : req.levels().stream().sorted(Comparator.comparingInt(levelConfigDto -> levelConfigDto.rank())).toList();
        if (levels.isEmpty()) errors.add("Cần ít nhất một level.");
        for (int i = 0; i < levels.size(); i++) {
            LevelConfigDto l = levels.get(i);
            if (l.rank() != i) errors.add("Rank của level phải liên tục từ 0 (" + l.code() + ").");
            if (i > 0 && l.promoteMin() <= levels.get(i - 1).promoteMin()) errors.add("Ngưỡng lên level của " + l.code() + " phải lớn hơn level trước.");
            if (i > 0 && l.regressBelow() >= l.promoteMin()) errors.add("Ngưỡng xét tụt của " + l.code() + " phải nhỏ hơn ngưỡng lên (hysteresis).");
            if (l.requirements() != null) for (RequirementDto r : l.requirements()) {
                if (List.of("PERFORMANCE", "SKILL").contains(r.gate()) && exerciseId(r.exerciseId(), r.exerciseCode()) == null) {
                    errors.add(l.code() + ": yêu cầu " + r.gate() + " thiếu bài tập hợp lệ.");
                }
                if ("COMPETENCY".equals(r.gate()) && r.competency() == null) errors.add(l.code() + ": yêu cầu COMPETENCY thiếu năng lực.");
            }
        }
        if (req.ladders() != null) for (LadderNodeDto n : req.ladders()) {
            if (n.target() <= 0) errors.add("Nấc " + n.exerciseCode() + ": target phải > 0.");
            if (n.base() < 0 || n.base() + n.span() > 100.0001) errors.add("Nấc " + n.exerciseCode() + ": base + span phải trong 0–100.");
            if (exerciseId(n.exerciseId(), n.exerciseCode()) == null) errors.add("Nấc thang tham chiếu bài tập không tồn tại: " + n.exerciseCode());
        }
        if (req.consistencyRules() != null) for (ConsistencyRuleDto c : req.consistencyRules()) {
            try { json.readTree(c.conditionJson()); } catch (Exception e) { errors.add("Luật " + c.code() + ": điều kiện JSON không hợp lệ."); }
        }
        return errors;
    }

    // ============================== Ghi cấu hình ==============================

    private void deleteChildren(Long id) {
        paramRepo.deleteByRuleSetId(id);
        ladderRepo.deleteByRuleSetId(id);
        consistencyRepo.deleteByRuleSetId(id);
        List<FitnessLevel> levels = levelRepo.findByRuleSetIdOrderByRankNoAsc(id);
        if (!levels.isEmpty()) requirementRepo.deleteByLevelIds(levels.stream().map(fitnessLevel -> fitnessLevel.getId()).toList());
        levelRepo.deleteAll(levels);
        levelRepo.flush();
    }

    private void writeChildren(Long id, UpdateRuleSetRequest req) {
        if (req.params() != null) for (ParamDto p : req.params()) {
            EngineParameter e = new EngineParameter();
            e.setRuleSetId(id);
            e.setParamKey(p.key());
            e.setParamValue(BigDecimal.valueOf(p.value()));
            e.setSourceType(p.sourceType() == null ? DefaultLevelEngineConfig.PRODUCT : p.sourceType());
            e.setSourceReference(p.sourceReference());
            paramRepo.save(e);
        }
        if (req.ladders() != null) for (LadderNodeDto n : req.ladders()) {
            CompetencyLadderNode l = new CompetencyLadderNode();
            l.setRuleSetId(id);
            l.setCompetencyCode(n.competency());
            l.setExercise(exerciseRepo.findById(exerciseId(n.exerciseId(), n.exerciseCode())).orElseThrow());
            l.setNodeOrder(n.order());
            l.setMetric(n.metric());
            l.setBaseScore(BigDecimal.valueOf(n.base()));
            l.setSpanScore(BigDecimal.valueOf(n.span()));
            l.setTargetValue(BigDecimal.valueOf(n.target()));
            l.setEntryValue(BigDecimal.valueOf(n.entry()));
            l.setSourceType(n.sourceType() == null ? DefaultLevelEngineConfig.COACHING : n.sourceType());
            l.setSourceReference(n.sourceReference());
            ladderRepo.save(l);
        }
        if (req.levels() != null) for (LevelConfigDto d : req.levels()) {
            FitnessLevel l = new FitnessLevel();
            l.setRuleSetId(id);
            l.setCode(d.code());
            l.setRankNo(d.rank());
            l.setName(d.name());
            l.setOverallPromoteMin(BigDecimal.valueOf(d.promoteMin()));
            l.setOverallRegressBelow(BigDecimal.valueOf(d.regressBelow()));
            l.setMinCompetencyConfidence(BigDecimal.valueOf(d.minConfidence()));
            l.setDescription(d.description());
            l.setColorScheme(d.colorScheme());
            l = levelRepo.save(l);
            if (d.requirements() != null) for (RequirementDto r : d.requirements()) {
                LevelRequirement q = new LevelRequirement();
                q.setLevel(l);
                q.setGate(r.gate());
                q.setCompetencyCode(r.competency());
                Long exId = exerciseId(r.exerciseId(), r.exerciseCode());
                q.setExercise(exId == null ? null : exerciseRepo.findById(exId).orElse(null));
                q.setMetric(r.metric());
                q.setOperator(r.operator() == null ? "GTE" : r.operator());
                q.setValue(BigDecimal.valueOf(r.value()));
                q.setMandatory(r.mandatory() == null || r.mandatory());
                q.setSourceType(r.sourceType() == null ? DefaultLevelEngineConfig.PRODUCT : r.sourceType());
                q.setSourceReference(r.sourceReference());
                requirementRepo.save(q);
            }
        }
        if (req.consistencyRules() != null) for (ConsistencyRuleDto c : req.consistencyRules()) {
            ConsistencyRule r = new ConsistencyRule();
            r.setRuleSetId(id);
            r.setCode(c.code());
            r.setConditionJson(c.conditionJson());
            r.setSeverity(c.severity());
            r.setAffectedCompetencies(json.writeValueAsString(c.affectedCompetencies() == null ? List.of() : c.affectedCompetencies()));
            r.setMessage(c.message());
            consistencyRepo.save(r);
        }
    }

    private Long exerciseId(String id, String code) {
        if (id != null && !id.isBlank()) {
            try { return exerciseRepo.existsById(Long.valueOf(id)) ? Long.valueOf(id) : null; } catch (NumberFormatException ignored) { }
        }
        return code == null ? null : exerciseRepo.findByCode(code).map(exercise -> exercise.getId()).orElse(null);
    }

    private RuleSet find(Long id) {
        return ruleSetRepo.findById(id).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy rule set " + id));
    }

    private RuleSetSummaryDto summary(RuleSet r) {
        return new RuleSetSummaryDto(String.valueOf(r.getId()), r.getCode(), r.getVersion(), r.getStatus(),
                r.getParentId() == null ? null : String.valueOf(r.getParentId()), r.getNotes(), r.getCreatedBy(), r.getCreatedAt(), r.getActivatedAt(), r.getAuthorId(), r.getSubmittedAt());
    }

    private List<String> readList(String raw) {
        try { return raw == null ? List.of() : json.readValue(raw, new TypeReference<List<String>>() {}); } catch (Exception e) { return List.of(); }
    }
}
