package com.calishealth.api.service.assessmentv2;

import com.calishealth.api.safety.SafetyModels.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.*;

/** Nạp cấu hình Safety của một rule set: cờ, ràng buộc theo cờ, policy theo status, clearance rule. */
@Component
public class SafetyConfigLoader {
    public record Config(long ruleSetId, List<FlagDef> flagDefs, Map<String, Set<String>> flagConstraints, Map<Status, Integer> validityDays,
                         Map<Status, Set<String>> requireAcknowledgementFor, Map<Status, Set<String>> blockedActions, List<ClearanceRule> clearanceRules,
                         Set<String> constraintCodes) {}

    private final JdbcTemplate jdbc;
    private final ObjectMapper json;

    public SafetyConfigLoader(JdbcTemplate jdbc, ObjectMapper json) { this.jdbc = jdbc; this.json = json; }

    public Config load(long ruleSetId) {
        List<FlagDef> defs = jdbc.query("SELECT code, sticky FROM safety_flag_defs WHERE rule_set_id = ?", (rs, i) -> new FlagDef(rs.getString(1), rs.getBoolean(2)), ruleSetId);
        Map<String, Set<String>> fc = new HashMap<>();
        jdbc.query("SELECT flag_code, constraint_code FROM safety_flag_constraints WHERE rule_set_id = ?",
                rch -> { fc.computeIfAbsent(rch.getString(1), k -> new TreeSet<>()).add(rch.getString(2)); }, ruleSetId);
        Map<Status, Integer> validity = new EnumMap<>(Status.class);
        Map<Status, Set<String>> ack = new EnumMap<>(Status.class), blocked = new EnumMap<>(Status.class);
        jdbc.query("SELECT status, validity_days, require_acknowledgement_for, blocked_actions FROM safety_policies WHERE rule_set_id = ?", rch -> {
            Status st = Status.valueOf(rch.getString(1));
            validity.put(st, rch.getInt(2));
            ack.put(st, strings(rch.getString(3)));
            blocked.put(st, strings(rch.getString(4)));
        }, ruleSetId);
        List<ClearanceRule> rules = new ArrayList<>();
        jdbc.query("SELECT id, from_status, flag_scope_json, method, resulting_status, allow_retained_constraints FROM safety_clearance_rules WHERE rule_set_id = ? ORDER BY id", rch -> {
            JsonNode scope = json.readTree(rch.getString(3));
            Set<String> flags = new TreeSet<>();
            if (scope.has("flags")) scope.get("flags").forEach(n -> flags.add(n.asString()));
            rules.add(new ClearanceRule(rch.getLong(1), Status.valueOf(rch.getString(2)), ScopeMode.valueOf(scope.get("mode").asString()), flags,
                    ClearanceMethod.valueOf(rch.getString(4)), Status.valueOf(rch.getString(5)), rch.getBoolean(6)));
        }, ruleSetId);
        Set<String> codes = new TreeSet<>(jdbc.queryForList("SELECT code FROM safety_constraint_defs", String.class));
        return new Config(ruleSetId, defs, fc, validity, ack, blocked, rules, codes);
    }

    private Set<String> strings(String jsonArray) {
        Set<String> out = new TreeSet<>();
        json.readTree(jsonArray).forEach(n -> out.add(n.asString()));
        return out;
    }
}
