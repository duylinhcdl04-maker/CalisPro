package com.calishealth.api.engine.v2.consistency;

import tools.jackson.databind.JsonNode;

import java.util.*;

/**
 * Phát hiện mâu thuẫn (ASSESSMENT_FRAMEWORK_V2 §7.3) - luật là DỮ LIỆU (consistency_rules.condition_json), không phải if trong Java.
 *
 * Từ vựng điều kiện: {"all":[..]} {"any":[..]}, {"question":Q,"op":EQ|IN,"value":..}, {"node":S,"op":GTE|GT|LT|LTE|EQ,"value":n},
 * {"verification":{"status":"FAIL"}}, {"competenciesAtOrAboveBand":{"band":"ADVANCED","count":3}}.
 *
 * I19: một atom tham chiếu bằng chứng KHÔNG tường minh (chưa thử / suy luận / không tin cậy) luôn đánh giá FALSE,
 * nên thiếu dữ liệu không bao giờ tạo ra "mâu thuẫn" hay hạ level.
 */
public final class ConsistencyChecker {

    public record RuleDef(String code, JsonNode condition, String severity, Set<String> affected, String message) {}

    /**
     * @param choiceAnswers câu hỏi -> mã option đã chọn (chỉ câu đã trả lời)
     * @param nodeValues    stage -> giá trị khai báo TƯỜNG MINH (không có mặt = không có bằng chứng tường minh)
     * @param failedVerification năng lực có câu kiểm chứng nấc dưới được khai là chưa đạt
     * @param bandThresholds ví dụ ADVANCED -> 70 (từ rule set)
     */
    public record Facts(Map<String, String> choiceAnswers, Map<String, Double> nodeValues, Set<String> failedVerification,
                        Map<String, Double> competencyScores, Map<String, Double> bandThresholds) {}

    public record Flag(String code, String severity, Set<String> affected, String message) {}

    public List<Flag> check(List<RuleDef> rules, Facts facts) {
        List<Flag> out = new ArrayList<>();
        for (RuleDef r : rules) {
            Set<String> hit = new TreeSet<>();
            if (r.condition().has("verification")) {
                hit.addAll(facts.failedVerification());
                hit.retainAll(r.affected());
            } else if (eval(r.condition(), facts)) {
                hit.addAll(r.affected());
            }
            if (!hit.isEmpty()) out.add(new Flag(r.code(), r.severity(), hit, r.message()));
        }
        return out;
    }

    private boolean eval(JsonNode n, Facts f) {
        if (n.has("all")) { for (JsonNode c : n.get("all")) if (!eval(c, f)) return false; return true; }
        if (n.has("any")) { for (JsonNode c : n.get("any")) if (eval(c, f)) return true; return false; }
        if (n.has("question")) {
            String given = f.choiceAnswers().get(n.get("question").asString());
            if (given == null) return false;
            JsonNode v = n.get("value");
            return switch (n.get("op").asString()) {
                case "EQ" -> given.equals(v.asString());
                case "IN" -> { for (JsonNode x : v) if (given.equals(x.asString())) yield true; yield false; }
                default -> throw new IllegalArgumentException("Toán tử không hỗ trợ: " + n.get("op").asString());
            };
        }
        if (n.has("node")) {
            Double actual = f.nodeValues().get(n.get("node").asString());
            if (actual == null) return false;
            double v = n.get("value").asDouble();
            return switch (n.get("op").asString()) {
                case "GTE" -> actual >= v; case "GT" -> actual > v; case "LT" -> actual < v; case "LTE" -> actual <= v; case "EQ" -> actual == v;
                default -> throw new IllegalArgumentException("Toán tử không hỗ trợ: " + n.get("op").asString());
            };
        }
        if (n.has("competenciesAtOrAboveBand")) {
            JsonNode b = n.get("competenciesAtOrAboveBand");
            Double threshold = f.bandThresholds().get(b.get("band").asString());
            if (threshold == null) throw new IllegalStateException("Rule set thiếu ngưỡng band " + b.get("band").asString());
            long count = f.competencyScores().values().stream().filter(s -> s != null && s >= threshold).count();
            return count >= b.get("count").asInt();
        }
        throw new IllegalArgumentException("Điều kiện không nhận diện được: " + n);
    }
}
