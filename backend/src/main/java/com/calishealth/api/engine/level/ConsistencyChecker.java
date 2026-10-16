package com.calishealth.api.engine.level;

import com.calishealth.api.engine.config.RuleSetConfig;
import com.calishealth.api.engine.config.RuleSetConfig.ConsistencyRuleDef;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.*;

/**
 * Phát hiện câu trả lời tự khai mâu thuẫn / phi thực tế theo consistency_rules (không viết cứng luật trong code).
 * Điều kiện: {"all":[...]} hoặc {"any":[...]}, mỗi phần tử là một trong:
 *   {"question":"MÃ_CÂU","op":"EQ|NEQ|GTE|GT|LTE|LT|IN","value":...}   - đáp án câu hỏi (mã option hoặc số)
 *   {"node":"pull-up","op":"GTE","value":10}                           - số rep/giây tự khai tại một bài
 *   {"ladderScore":"PULL","op":"GTE","value":60}                       - điểm thang tự khai của một năng lực
 * Thiếu dữ liệu cho một điều kiện -> điều kiện đó = false (không kết luận mâu thuẫn khi không có bằng chứng).
 */
public final class ConsistencyChecker {
    private static final ObjectMapper JSON = new ObjectMapper();

    public record Violation(String code, String severity, List<String> competencies, String message) {}

    public record Result(Map<String, String> qualityByCompetency, String overallQuality, List<Violation> violations,
                         Set<String> conflictedCompetencies, double answeredRatio) {}

    private ConsistencyChecker() {}

    /**
     * @param answersByCode  mã câu hỏi -> đáp án thô
     * @param nodeValues     mã bài tập -> giá trị tự khai
     * @param ladderScores   năng lực -> điểm thang tự khai
     * @param answeredRatio  tỉ lệ câu chấm điểm / ánh xạ năng lực đã được trả lời (0..1)
     */
    public static Result check(RuleSetConfig rs, Map<String, Object> answersByCode, Map<String, Double> nodeValues,
                               Map<String, Double> ladderScores, double answeredRatio) {
        List<Violation> violations = new ArrayList<>();
        for (ConsistencyRuleDef r : rs.consistencyRules()) {
            JsonNode cond;
            try {
                cond = JSON.readTree(r.conditionJson());
            } catch (Exception e) {
                continue;  // luật cấu hình sai không được làm hỏng bài làm của học viên
            }
            if (eval(cond, answersByCode, nodeValues, ladderScores)) {
                violations.add(new Violation(r.code(), r.severity(), r.affected(), r.message()));
            }
        }
        String coverage = answeredRatio >= rs.param("quality.coverage.high", 0.9) ? "HIGH"
                : answeredRatio >= rs.param("quality.coverage.medium", 0.7) ? "MEDIUM" : "LOW";

        Map<String, String> perCompetency = new LinkedHashMap<>();
        Set<String> conflicted = new LinkedHashSet<>();
        for (RuleSetConfig.CompetencyDef c : rs.competencies()) {
            String q = coverage;
            for (Violation v : violations) {
                if (!v.competencies().contains(c.code())) continue;
                if ("CONFLICT".equals(v.severity())) { q = "CONFLICTED"; conflicted.add(c.code()); }
                else if (!"CONFLICTED".equals(q)) q = worse(q, "MEDIUM");
            }
            perCompetency.put(c.code(), q);
        }
        String overall = !conflicted.isEmpty() ? "CONFLICTED"
                : violations.isEmpty() ? coverage : worse(coverage, "MEDIUM");
        return new Result(perCompetency, overall, violations, conflicted, answeredRatio);
    }

    private static String worse(String a, String b) {
        List<String> order = List.of("HIGH", "MEDIUM", "LOW", "CONFLICTED");
        return order.indexOf(a) >= order.indexOf(b) ? a : b;
    }

    static boolean eval(JsonNode n, Map<String, Object> answers, Map<String, Double> nodes, Map<String, Double> ladder) {
        if (n == null || n.isNull()) return false;
        if (n.has("all")) {
            for (JsonNode c : n.get("all")) if (!eval(c, answers, nodes, ladder)) return false;
            return n.get("all").size() > 0;
        }
        if (n.has("any")) {
            for (JsonNode c : n.get("any")) if (eval(c, answers, nodes, ladder)) return true;
            return false;
        }
        String op = n.has("op") ? n.get("op").asString() : "EQ";
        JsonNode expected = n.get("value");
        if (n.has("question")) return compare(answers.get(n.get("question").asString()), op, expected);
        if (n.has("node")) return compare(nodes.get(n.get("node").asString().toLowerCase()), op, expected);
        if (n.has("ladderScore")) return compare(ladder.get(n.get("ladderScore").asString()), op, expected);
        return false;
    }

    private static boolean compare(Object actual, String op, JsonNode expected) {
        if (actual == null || expected == null) return false;
        if ("IN".equals(op)) {
            for (JsonNode e : expected) if (String.valueOf(actual).equalsIgnoreCase(e.asString())) return true;
            return false;
        }
        Double a = number(actual);
        if (expected.isNumber() && a != null) {
            double e = expected.asDouble();
            return switch (op) {
                case "GTE" -> a >= e; case "GT" -> a > e; case "LTE" -> a <= e; case "LT" -> a < e;
                case "NEQ" -> a != e; default -> a == e;
            };
        }
        boolean eq = String.valueOf(actual).equalsIgnoreCase(expected.asString());
        return "NEQ".equals(op) != eq;
    }

    private static Double number(Object o) {
        if (o instanceof Number n) return n.doubleValue();
        try { return Double.parseDouble(String.valueOf(o).trim()); } catch (Exception e) { return null; }
    }
}
