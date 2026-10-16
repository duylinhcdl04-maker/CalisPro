package com.calishealth.api.service.level;

import com.calishealth.api.engine.config.DefaultLevelEngineConfig;
import com.calishealth.api.engine.config.RuleSetConfig;
import com.calishealth.api.engine.config.RuleSetConfig.*;
import com.calishealth.api.entity.*;
import com.calishealth.api.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/** Nạp rule set (ACTIVE hoặc theo id) thành RuleSetConfig bất biến; cache theo id vì rule set ACTIVE không đổi nội dung. */
@Service
@Transactional(readOnly = true)
public class RuleSetProvider {
    private final RuleSetRepository ruleSetRepo;
    private final EngineParameterRepository paramRepo;
    private final CompetencyRepository competencyRepo;
    private final CompetencyLadderNodeRepository ladderRepo;
    private final FitnessLevelRepository levelRepo;
    private final LevelRequirementRepository requirementRepo;
    private final ConsistencyRuleRepository consistencyRepo;
    private final ObjectMapper json = new ObjectMapper();
    private final Map<Long, RuleSetConfig> cache = new ConcurrentHashMap<>();

    public RuleSetProvider(RuleSetRepository ruleSetRepo, EngineParameterRepository paramRepo, CompetencyRepository competencyRepo,
                           CompetencyLadderNodeRepository ladderRepo, FitnessLevelRepository levelRepo,
                           LevelRequirementRepository requirementRepo, ConsistencyRuleRepository consistencyRepo) {
        this.ruleSetRepo = ruleSetRepo;
        this.paramRepo = paramRepo;
        this.competencyRepo = competencyRepo;
        this.ladderRepo = ladderRepo;
        this.levelRepo = levelRepo;
        this.requirementRepo = requirementRepo;
        this.consistencyRepo = consistencyRepo;
    }

    public RuleSetConfig active() {
        RuleSet rs = ruleSetRepo.findTopByCodeAndStatusOrderByVersionDesc(DefaultLevelEngineConfig.RULE_SET_CODE, RuleSet.ACTIVE)
                .orElseThrow(() -> new IllegalStateException("Chưa có bộ quy tắc Level Engine nào đang kích hoạt."));
        return byId(rs.getId());
    }

    public RuleSetConfig byId(Long id) {
        RuleSetConfig cached = cache.get(id);
        if (cached != null) return cached;
        RuleSet rs = ruleSetRepo.findById(id).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy rule set " + id));
        RuleSetConfig cfg = load(rs);
        if (!RuleSet.DRAFT.equals(rs.getStatus())) cache.put(id, cfg);  // bản DRAFT còn sửa được -> không cache
        return cfg;
    }

    public void evict(Long id) { cache.remove(id); }

    private RuleSetConfig load(RuleSet rs) {
        Map<String, Double> params = new LinkedHashMap<>();
        paramRepo.findByRuleSetId(rs.getId()).forEach(p -> params.put(p.getParamKey(), p.getParamValue().doubleValue()));

        List<CompetencyDef> competencies = competencyRepo.findByActiveTrueOrderByDisplayOrderAsc().stream()
                .map(c -> new CompetencyDef(c.getCode(), c.getName(), c.isPrimaryCompetency(), c.getAggregation())).toList();

        List<LadderNode> ladders = ladderRepo.findWithExerciseByRuleSetId(rs.getId()).stream()
                .map(n -> new LadderNode(n.getExercise().getId(), n.getExercise().getCode(), n.getExercise().getName(),
                        n.getCompetencyCode(), n.getNodeOrder(), n.getMetric(), n.getBaseScore().doubleValue(),
                        n.getSpanScore().doubleValue(), n.getTargetValue().doubleValue(), n.getEntryValue().doubleValue(),
                        anchors(n.getAnchorsJson()))).toList();

        List<FitnessLevel> levels = levelRepo.findByRuleSetIdOrderByRankNoAsc(rs.getId());
        Map<Long, List<RequirementDef>> reqByLevel = new HashMap<>();
        if (!levels.isEmpty()) {
            for (LevelRequirement r : requirementRepo.findWithRefsByLevelIds(levels.stream().map(fitnessLevel -> fitnessLevel.getId()).toList())) {
                reqByLevel.computeIfAbsent(r.getLevel().getId(), k -> new ArrayList<>()).add(new RequirementDef(
                        r.getGate(), r.getCompetencyCode(),
                        r.getExercise() == null ? null : r.getExercise().getId(),
                        r.getExercise() == null ? null : r.getExercise().getCode(),
                        r.getMetric(), r.getOperator(), r.getValue().doubleValue(), r.isMandatory(), r.getSourceType()));
            }
        }
        List<LevelDef> levelDefs = levels.stream().map(l -> new LevelDef(l.getCode(), l.getRankNo(), l.getName(),
                l.getOverallPromoteMin().doubleValue(), l.getOverallRegressBelow().doubleValue(),
                l.getMinCompetencyConfidence().doubleValue(), l.getDescription(),
                reqByLevel.getOrDefault(l.getId(), List.of()))).toList();

        List<ConsistencyRuleDef> rules = consistencyRepo.findByRuleSetId(rs.getId()).stream()
                .map(c -> new ConsistencyRuleDef(c.getCode(), c.getConditionJson(), c.getSeverity(),
                        readList(c.getAffectedCompetencies()), c.getMessage())).toList();

        if (levelDefs.isEmpty()) throw new IllegalStateException("Rule set " + rs.getCode() + " v" + rs.getVersion() + " chưa có level nào.");
        return new RuleSetConfig(rs.getId(), rs.getCode(), rs.getVersion(), params, competencies, ladders, levelDefs, rules);
    }

    private double[][] anchors(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return json.readValue(raw, double[][].class);
        } catch (Exception e) {
            return null;
        }
    }

    private List<String> readList(String raw) {
        if (raw == null || raw.isBlank()) return List.of();
        try {
            return json.readValue(raw, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }
}
