package com.calishealth.api.engine;

import com.calishealth.api.engine.config.DefaultLevelEngineConfig;
import com.calishealth.api.engine.config.DefaultLevelEngineConfig.*;
import com.calishealth.api.engine.config.RuleSetConfig;
import com.calishealth.api.engine.config.RuleSetConfig.*;
import com.calishealth.api.engine.skill.SkillGraph;

import java.util.*;

/** Dựng RuleSetConfig + SkillGraph từ cấu hình mặc định với ID bài tập giả lập (dùng cho unit test). */
public final class TestRuleSets {
    private TestRuleSets() {}

    private static final Map<String, Long> IDS = new LinkedHashMap<>();

    public static long id(String code) {
        return IDS.computeIfAbsent(code, k -> (long) (IDS.size() + 1));
    }

    public static RuleSetConfig defaults() {
        Map<String, Double> params = new LinkedHashMap<>();
        DefaultLevelEngineConfig.PARAMS.forEach(p -> params.put(p.key(), p.value()));
        List<CompetencyDef> comps = DefaultLevelEngineConfig.COMPETENCIES.stream()
                .map(c -> new CompetencyDef(c.code(), c.name(), c.primary(), c.aggregation())).toList();
        List<LadderNode> ladders = DefaultLevelEngineConfig.LADDERS.stream()
                .map(l -> new LadderNode(id(l.exerciseCode()), l.exerciseCode(), l.exerciseCode(), l.competency(), l.order(),
                        l.metric(), l.base(), l.span(), l.target(), l.entry(), null)).toList();
        List<LevelDef> levels = new ArrayList<>();
        for (LevelSeed s : DefaultLevelEngineConfig.LEVELS) {
            List<RequirementDef> reqs = DefaultLevelEngineConfig.REQUIREMENTS.stream().filter(r -> r.level().equals(s.code()))
                    .map(r -> new RequirementDef(r.gate(), r.competency(), r.exerciseCode() == null ? null : id(r.exerciseCode()),
                            r.exerciseCode(), r.metric(), r.op(), r.value(), true, r.sourceType())).toList();
            levels.add(new LevelDef(s.code(), s.rank(), s.name(), s.promoteMin(), s.regressBelow(), 0.6, s.description(), reqs));
        }
        List<ConsistencyRuleDef> rules = DefaultLevelEngineConfig.CONSISTENCY.stream()
                .map(c -> new ConsistencyRuleDef(c.code(), c.conditionJson(), c.severity(), c.affected(), c.message())).toList();
        return new RuleSetConfig(1L, "LEVEL_ENGINE", 1, params, comps, ladders, levels, rules);
    }

    public static SkillGraph graph() {
        RuleSetConfig rs = defaults();
        Map<String, SkillGraph.Node> nodes = new LinkedHashMap<>();
        for (ProgressionSeed p : DefaultLevelEngineConfig.PROGRESSIONS) {
            for (String code : List.of(p.prerequisite(), p.exercise())) {
                nodes.computeIfAbsent(code, c -> new SkillGraph.Node(id(c), c, c,
                        rs.ladderNodeByCode(c).map(ladderNode -> ladderNode.competency()).orElse(null), false));
            }
        }
        List<SkillGraph.Edge> edges = DefaultLevelEngineConfig.PROGRESSIONS.stream()
                .map(p -> new SkillGraph.Edge(id(p.prerequisite()), id(p.exercise()), p.minReps(), p.minHoldSec(), p.minForm(),
                        2, p.mandatory(), p.weight())).toList();
        Map<Long, Set<Long>> alts = new HashMap<>();
        for (String[] a : DefaultLevelEngineConfig.ALTERNATIVES) {
            nodes.computeIfAbsent(a[1], c -> new SkillGraph.Node(id(c), c, c, null, false));
            alts.computeIfAbsent(id(a[0]), k -> new LinkedHashSet<>()).add(id(a[1]));
        }
        return new SkillGraph(nodes.values(), edges, alts);
    }
}
