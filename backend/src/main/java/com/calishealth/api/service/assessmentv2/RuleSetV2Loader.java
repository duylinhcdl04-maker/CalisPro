package com.calishealth.api.service.assessmentv2;

import com.calishealth.api.engine.v2.RuleParams;
import com.calishealth.api.engine.v2.consistency.ConsistencyChecker;
import com.calishealth.api.engine.v2.level.LevelModelsV2.*;
import com.calishealth.api.engine.v2.progression.ProgressionModels.*;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.*;

/** Nạp rule set V2 từ DB. Chỉ nạp rule set ACTIVE (hoặc DRAFT khi allow-draft, dev/test). */
@Service
public class RuleSetV2Loader {
    private final JdbcTemplate jdbc;
    private final AssessmentV2Settings settings;
    private final ObjectMapper json;

    public RuleSetV2Loader(JdbcTemplate jdbc, AssessmentV2Settings settings, ObjectMapper json) {
        this.jdbc = jdbc; this.settings = settings; this.json = json;
    }

    /** Id rule set đang áp dụng (ACTIVE, hoặc DRAFT khi allow-draft) mà không nạp toàn bộ cấu hình. */
    public long configuredId() { return loadConfigured().id(); }

    public RuleSetV2 loadConfigured() {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT id, version, status FROM rule_sets WHERE code = ? ORDER BY version DESC", settings.ruleSetCode());
        for (Map<String, Object> r : rows) {
            String status = (String) r.get("status");
            if ("ACTIVE".equals(status) || (settings.allowDraft() && ("DRAFT".equals(status) || "PENDING_REVIEW".equals(status))))
                return load(((Number) r.get("id")).longValue());
        }
        throw new IllegalStateException("Không có rule set " + settings.ruleSetCode() + " ACTIVE (chưa được Coach duyệt/kích hoạt)");
    }

    public RuleSetV2 load(long id) {
        Map<String, Object> rs = jdbc.queryForMap("SELECT code, version, status FROM rule_sets WHERE id = ?", id);

        Map<String, Double> params = new HashMap<>();
        jdbc.query("SELECT param_key, param_value FROM engine_parameters WHERE rule_set_id = ? AND param_value IS NOT NULL",
                rch -> { params.put(rch.getString(1), rch.getDouble(2)); }, id);
        Map<String, String> text = new HashMap<>();
        jdbc.query("SELECT param_key, param_text FROM engine_parameters WHERE rule_set_id = ? AND param_text IS NOT NULL", rch -> { text.put(rch.getString(1), rch.getString(2)); }, id);


        Map<String, List<Stage>> stages = new LinkedHashMap<>();
        Map<String, String> competencyOfLadder = new LinkedHashMap<>();
        Map<String, Integer> verify = new HashMap<>();
        jdbc.query("""
                SELECT l.code, l.competency_code, l.verify_from_rank, s.code, s.rank_no, s.metric, s.pass_value, s.target_value, s.base_score, s.span_score
                FROM progression_ladders l JOIN progression_stages s ON s.ladder_id = l.id
                WHERE l.rule_set_id = ? ORDER BY l.id, s.rank_no""", rch -> {
            String ladder = rch.getString(1);
            competencyOfLadder.putIfAbsent(ladder, rch.getString(2));
            int v = rch.getInt(3);
            if (!rch.wasNull()) verify.put(ladder, v);
            stages.computeIfAbsent(ladder, k -> new ArrayList<>()).add(new Stage(rch.getString(4), rch.getInt(5), rch.getString(6),
                    rch.getDouble(7), rch.getDouble(8), rch.getDouble(9), rch.getDouble(10)));
        }, id);

        Map<String, List<Prerequisite>> pre = new HashMap<>();
        jdbc.query("""
                SELECT l.code, s.code, p.code, pr.mandatory, pr.bypass_policy
                FROM progression_stage_prerequisites pr JOIN progression_stages s ON s.id = pr.stage_id
                JOIN progression_stages p ON p.id = pr.prerequisite_stage_id JOIN progression_ladders l ON l.id = s.ladder_id
                WHERE l.rule_set_id = ?""", rch -> {
            pre.computeIfAbsent(rch.getString(1), k -> new ArrayList<>())
                    .add(new Prerequisite(rch.getString(2), rch.getString(3), rch.getBoolean(4), "ALLOW_BYPASS".equals(rch.getString(5))));
        }, id);

        List<Ladder> ladders = new ArrayList<>();
        stages.forEach((code, st) -> ladders.add(new Ladder(code, competencyOfLadder.get(code), st, pre.getOrDefault(code, List.of()))));

        List<LevelDef> levels = new ArrayList<>();
        Map<Long, List<CompetencyReq>> compReqs = new HashMap<>();
        Map<Long, List<SkillReq>> skillReqs = new HashMap<>();
        jdbc.query("""
                SELECT lr.level_id, lr.gate, lr.competency_code, lr.value, e.code, lr.self_reported_acceptable
                FROM level_requirements lr JOIN fitness_levels fl ON fl.id = lr.level_id LEFT JOIN exercises e ON e.id = lr.exercise_id
                WHERE fl.rule_set_id = ?""", rch -> {
            long levelId = rch.getLong(1);
            String gate = rch.getString(2);
            if ("COMPETENCY".equals(gate)) compReqs.computeIfAbsent(levelId, k -> new ArrayList<>()).add(new CompetencyReq(rch.getString(3), rch.getDouble(4)));
            else if ("SKILL".equals(gate) && rch.getString(5) != null)
                skillReqs.computeIfAbsent(levelId, k -> new ArrayList<>()).add(new SkillReq(rch.getString(5), rch.getBoolean(6)));
        }, id);
        jdbc.query("SELECT id, code, rank_no, overall_promote_min FROM fitness_levels WHERE rule_set_id = ? ORDER BY rank_no", rch -> {
            long lid = rch.getLong(1);
            levels.add(new LevelDef(rch.getString(2), rch.getInt(3), rch.getDouble(4), compReqs.getOrDefault(lid, List.of()), skillReqs.getOrDefault(lid, List.of())));
        }, id);
        Map<Integer, List<RuleSetV2.PerformanceReq>> performance = new HashMap<>();
        Map<Integer, List<RuleSetV2.QualityReq>> quality = new HashMap<>();
        jdbc.query("""
                SELECT fl.rank_no, lr.gate, e.code, lr.metric, lr.operator, lr.value
                FROM level_requirements lr JOIN fitness_levels fl ON fl.id = lr.level_id LEFT JOIN exercises e ON e.id = lr.exercise_id
                WHERE fl.rule_set_id = ? AND lr.gate IN ('PERFORMANCE', 'QUALITY')""", rch -> {
            int rank = rch.getInt(1);
            if ("PERFORMANCE".equals(rch.getString(2)))
                performance.computeIfAbsent(rank, k -> new ArrayList<>()).add(new RuleSetV2.PerformanceReq(rch.getString(3), rch.getString(4), rch.getString(5), rch.getDouble(6)));
            else quality.computeIfAbsent(rank, k -> new ArrayList<>()).add(new RuleSetV2.QualityReq(rch.getString(4), rch.getString(5), rch.getDouble(6)));
        }, id);


        List<ConsistencyChecker.RuleDef> rules = new ArrayList<>();
        jdbc.query("SELECT code, condition_json, severity, affected_competencies, message FROM consistency_rules WHERE rule_set_id = ? ORDER BY code", rch -> {
            try {
                Set<String> affected = new TreeSet<>();
                for (JsonNode n : json.readTree(rch.getString(4))) affected.add(n.asString());
                rules.add(new ConsistencyChecker.RuleDef(rch.getString(1), json.readTree(rch.getString(2)), rch.getString(3), affected, rch.getString(5)));
            } catch (Exception e) { throw new IllegalStateException("Luật mâu thuẫn không đọc được: " + rch.getString(1), e); }
        }, id);

        List<String> primary = jdbc.queryForList("SELECT code FROM competencies WHERE is_primary = TRUE AND active = TRUE ORDER BY display_order", String.class);

        return new RuleSetV2(id, (String) rs.get("code"), ((Number) rs.get("version")).intValue(), (String) rs.get("status"),
                new RuleParams(params), ladders, verify, levels, rules, primary, text, performance, quality);
    }
}
