package com.calishealth.api.service.assessmentv2;

import tools.jackson.databind.JsonNode;

import java.util.List;
import java.util.Optional;

/** Siêu dữ liệu template đã nạp (câu hỏi + option + section) - dùng chung cho Initial và Safety Screening. */
public record TemplateMeta(long id, String code, int version, String status, String type, List<QuestionMeta> questions) {

    public record OptionMeta(long id, String code, String label, Double score, Double numeric, int sortOrder) {}

    public record QuestionMeta(long id, String code, String text, String instruction, String questionType, String inputType, String category,
                               boolean required, Double minValue, Double maxValue, Double plausibleMax, String evidenceRole, String answerKind,
                               String reliabilityClass, String ladderCode, JsonNode config, JsonNode visibility, String sectionCode,
                               String sectionTitle, int sortOrder, List<OptionMeta> options) {
        public Optional<OptionMeta> option(String code) { return options.stream().filter(o -> o.code().equals(code)).findFirst(); }
    }

    public Optional<QuestionMeta> question(String code) { return questions.stream().filter(q -> q.code().equals(code)).findFirst(); }
}
