package com.calishealth.api.service.assessmentv2;

import com.calishealth.api.service.assessmentv2.AssessmentSessionStore.SessionRow;
import com.calishealth.api.service.assessmentv2.TemplateMeta.QuestionMeta;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Lưu đáp án dùng chung cho mọi loại phiên: kiểm tra kiểu/miền, chỉ nhận câu đang hiển thị, upsert idempotent,
 * và xoá đáp án của câu vừa trở nên ẩn (đổi đáp án câu trước). Backend là nguồn quyết định hiển thị, không tin frontend.
 */
@Component
public class AnswerSupport {
    public record SaveResult(List<String> visible, List<String> removed, int answered, List<String> requiredRemaining) {}

    private final AssessmentSessionStore store;
    private final VisibilityEvaluator visibility = new VisibilityEvaluator();

    public AnswerSupport(AssessmentSessionStore store) { this.store = store; }

    public SaveResult save(SessionRow session, TemplateMeta t, RuleSetV2 rs, Map<String, Object> incoming) {
        if (!"IN_PROGRESS".equals(session.status())) throw new IllegalStateException("Phiên không còn ở trạng thái IN_PROGRESS: " + session.status());

        Map<String, Object> merged = new LinkedHashMap<>(store.loadAnswers(session.id()));
        Map<String, Object> normalized = new LinkedHashMap<>();
        for (Map.Entry<String, Object> e : incoming.entrySet()) {
            QuestionMeta q = t.question(e.getKey()).orElseThrow(() -> new IllegalArgumentException("INVALID_ANSWER: câu hỏi không thuộc bài đánh giá: " + e.getKey()));
            Object v = validate(q, e.getValue());
            normalized.put(q.code(), v);
            merged.put(q.code(), v);
        }
        Set<String> visible = new LinkedHashSet<>();
        visibility.visibleQuestions(t, merged, rs).forEach(q -> visible.add(q.code()));
        for (String code : normalized.keySet())
            if (!visible.contains(code)) throw new IllegalArgumentException("INVALID_ANSWER: câu đang ẩn, chưa tới lượt: " + code);

        for (Map.Entry<String, Object> e : normalized.entrySet()) store.upsertAnswer(session.id(), t.question(e.getKey()).orElseThrow(), e.getValue());

        List<String> removed = new ArrayList<>();
        List<Long> removedIds = new ArrayList<>();
        for (String code : new ArrayList<>(merged.keySet())) {
            if (visible.contains(code)) continue;
            removed.add(code);
            removedIds.add(t.question(code).orElseThrow().id());
            merged.remove(code);
        }
        store.deleteAnswers(session.id(), removedIds);

        List<String> remaining = t.questions().stream().filter(q -> visible.contains(q.code()) && q.required() && !merged.containsKey(q.code()))
                .map(QuestionMeta::code).toList();
        return new SaveResult(List.copyOf(visible), removed, merged.size(), remaining);
    }

    public List<String> missingRequired(TemplateMeta t, RuleSetV2 rs, Map<String, Object> answers) {
        Set<String> visible = new HashSet<>();
        visibility.visibleQuestions(t, answers, rs).forEach(q -> visible.add(q.code()));
        return t.questions().stream().filter(q -> visible.contains(q.code()) && q.required() && !answers.containsKey(q.code())).map(QuestionMeta::code).toList();
    }

    private Object validate(QuestionMeta q, Object value) {
        if (value == null) throw new IllegalArgumentException("INVALID_ANSWER: thiếu giá trị cho " + q.code());
        switch (q.questionType()) {
            case "NUMBER", "SCALE" -> {
                if (!(value instanceof Number n)) throw new IllegalArgumentException("INVALID_ANSWER: " + q.code() + " phải là số");
                double d = n.doubleValue();
                if (Double.isNaN(d) || d < 0 && q.minValue() == null) throw new IllegalArgumentException("INVALID_ANSWER: giá trị không hợp lệ cho " + q.code());
                if (q.minValue() != null && d < q.minValue()) throw new IllegalArgumentException("INVALID_ANSWER: " + q.code() + " < " + q.minValue());
                if (q.maxValue() != null && d > q.maxValue()) throw new IllegalArgumentException("INVALID_ANSWER: " + q.code() + " > " + q.maxValue());
                if (q.plausibleMax() != null && d > q.plausibleMax()) throw new IllegalArgumentException("INVALID_ANSWER: " + q.code() + " vượt miền hợp lý " + q.plausibleMax());
                return d;
            }
            case "MULTI_CHOICE" -> {
                if (!(value instanceof Collection<?> c)) throw new IllegalArgumentException("INVALID_ANSWER: " + q.code() + " phải là danh sách");
                List<String> out = new ArrayList<>();
                for (Object o : c) {
                    String code = String.valueOf(o);
                    if (q.option(code).isEmpty()) throw new IllegalArgumentException("INVALID_ANSWER: " + q.code() + " không có lựa chọn " + code);
                    if (!out.contains(code)) out.add(code);
                }
                if (q.config() != null && q.config().has("maxSelections") && out.size() > q.config().get("maxSelections").asInt())
                    throw new IllegalArgumentException("INVALID_ANSWER: " + q.code() + " chọn tối đa " + q.config().get("maxSelections").asInt());
                return out;
            }
            default -> {
                String code = String.valueOf(value);
                if (q.option(code).isEmpty()) throw new IllegalArgumentException("INVALID_ANSWER: " + q.code() + " không có lựa chọn " + code);
                return code;
            }
        }
    }
}
