package com.calishealth.api.service.level;

import com.calishealth.api.dto.LevelEngineDtos.*;
import com.calishealth.api.engine.config.RuleSetConfig;
import com.calishealth.api.engine.level.CompetencyScoringEngine.CompetencyResult;
import com.calishealth.api.engine.skill.SkillEngine.Gap;
import com.calishealth.api.entity.LevelEvaluation;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.util.*;

/** Chuyển kết quả engine / entity sang DTO. */
public final class FitnessStateMapper {
    private static final ObjectMapper JSON = new ObjectMapper();

    private FitnessStateMapper() {}

    public static List<CompetencyDto> competencies(RuleSetConfig rs, Map<String, CompetencyResult> comps) {
        List<CompetencyDto> out = new ArrayList<>();
        for (RuleSetConfig.CompetencyDef def : rs.competencies()) {
            CompetencyResult r = comps.get(def.code());
            if (r == null) continue;
            out.add(new CompetencyDto(def.code(), def.name(), r.score(), r.observation(), r.band(), r.confidence(), r.trend(),
                    r.source(), r.dataQuality()));
        }
        return out;
    }

    public static EvaluationDto evaluation(LevelEvaluation e, String ruleSetLabel) {
        if (e == null) return null;
        Map<String, String> gates = new LinkedHashMap<>();
        put(gates, "RELIABILITY", e.getReliabilityGate());
        put(gates, "PERFORMANCE", e.getPerformanceGate());
        put(gates, "QUALITY", e.getQualityGate());
        put(gates, "COMPETENCY", e.getCompetencyGate());
        put(gates, "SKILL", e.getSkillGate());
        put(gates, "STABILITY", e.getStabilityGate());
        List<ReasonDto> reasons;
        try {
            reasons = JSON.readValue(e.getReasonsJson(), new TypeReference<List<ReasonDto>>() {});
        } catch (Exception ex) {
            reasons = List.of();
        }
        return new EvaluationDto(String.valueOf(e.getId()), String.valueOf(e.getAssessmentSessionId()), e.getPreviousLevel(),
                e.getCandidateLevel(), e.getFinalLevel(), e.getOverallScore() == null ? null : e.getOverallScore().doubleValue(),
                e.getEwmaOverall() == null ? null : e.getEwmaOverall().doubleValue(), gates, e.getDecision(), reasons,
                e.getExplanation(), ruleSetLabel, e.getAlgorithmVersion(),
                e.getCoachOverrideId() == null ? null : String.valueOf(e.getCoachOverrideId()), e.getCreatedAt());
    }

    public static GapDto gap(Gap g) {
        return new GapDto(g.exerciseId() == null ? null : String.valueOf(g.exerciseId()), g.exerciseCode(), g.competency(),
                g.required(), g.current(), g.deficit(), g.priority(), g.kind(), g.message());
    }

    private static void put(Map<String, String> m, String k, String v) { if (v != null) m.put(k, v); }
}
