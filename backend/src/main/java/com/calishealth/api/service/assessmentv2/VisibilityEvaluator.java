package com.calishealth.api.service.assessmentv2;

import com.calishealth.api.engine.v2.progression.ProgressionModels.Ladder;
import com.calishealth.api.engine.v2.progression.ProgressionModels.Stage;
import com.calishealth.api.service.assessmentv2.TemplateMeta.QuestionMeta;
import tools.jackson.databind.JsonNode;

import java.util.List;
import java.util.Map;

/**
 * Hiển thị câu hỏi có điều kiện (visibility_json). Backend là nguồn quyết định; câu ẩn KHÔNG vào mẫu số, không phải 0 điểm.
 * Dạng: {"all":[{"question":Q,"op":"NOT_IN|IN|EQ","value":..}]} hoặc {"ladderVerify":LADDER,"nodeQuestion":Q}.
 * Câu điều kiện chưa được trả lời ⇒ câu phụ thuộc bị ẩn (chưa tới lượt).
 */
public final class VisibilityEvaluator {

    public boolean visible(QuestionMeta q, Map<String, Object> answers, RuleSetV2 rs) {
        JsonNode v = q.visibility();
        if (v == null || v.isNull()) return true;
        if (v.has("ladderVerify")) return ladderVerifyVisible(v, answers, rs);
        if (v.has("all")) { for (JsonNode c : v.get("all")) if (!atom(c, answers)) return false; return true; }
        if (v.has("any")) { for (JsonNode c : v.get("any")) if (atom(c, answers)) return true; return false; }
        throw new IllegalStateException("visibility_json không nhận diện được ở câu " + q.code());
    }

    private boolean atom(JsonNode c, Map<String, Object> answers) {
        Object given = answers.get(c.get("question").asString());
        if (given == null) return false;
        JsonNode value = c.get("value");
        return switch (c.get("op").asString()) {
            case "EQ" -> String.valueOf(given).equals(value.asString());
            case "IN" -> contains(value, given);
            case "NOT_IN" -> !contains(value, given);
            default -> throw new IllegalStateException("Toán tử visibility không hỗ trợ: " + c.get("op").asString());
        };
    }

    private boolean contains(JsonNode list, Object given) {
        for (JsonNode n : list) if (String.valueOf(given).equals(n.asString())) return true;
        return false;
    }

    private boolean ladderVerifyVisible(JsonNode v, Map<String, Object> answers, RuleSetV2 rs) {
        Object node = answers.get(v.get("nodeQuestion").asString());
        if (!(node instanceof String claimed) || claimed.equals("NOT_TRIED") || claimed.equals("NONE")) return false;
        String ladderCode = v.get("ladderVerify").asString();
        Ladder ladder = rs.ladderByCode(ladderCode).orElseThrow(() -> new IllegalStateException("Thiếu ladder " + ladderCode));
        Integer from = rs.verifyFromRank().get(ladderCode);
        if (from == null) return false;
        return ladder.stages().stream().filter(s -> s.code().equals(claimed)).map(Stage::rank).anyMatch(r -> r >= from);
    }

    public List<QuestionMeta> visibleQuestions(TemplateMeta t, Map<String, Object> answers, RuleSetV2 rs) {
        return t.questions().stream().filter(q -> visible(q, answers, rs)).toList();
    }
}
