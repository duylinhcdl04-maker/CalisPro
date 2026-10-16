package com.calishealth.api.service.assessment;

import com.calishealth.api.entity.AssessmentQuestion;
import com.calishealth.api.entity.QuestionType;

import java.util.List;

/** Ánh xạ giữa loại câu hỏi phía Admin, loại lưu trữ chuẩn hóa và bộ hiển thị phía học viên. */
public final class AssessmentQuestionTypes {
    private AssessmentQuestionTypes() {}

    public static final List<String> ADMIN_TYPES = List.of("SINGLE_CHOICE", "MULTIPLE_CHOICE", "YES_NO", "NUMERIC_INPUT",
            "RATING_SCALE", "PERFORMANCE_TEST", "MEASUREMENT", "SELF_ASSESSMENT");

    public static final List<String> NUMERIC_TYPES = List.of("NUMERIC_INPUT", "PERFORMANCE_TEST", "MEASUREMENT");

    /** Loại phía Admin của câu hỏi (câu hỏi cũ chưa có input_type -> suy từ question_type) */
    public static String inputType(AssessmentQuestion q) {
        if (q.getInputType() != null && !q.getInputType().isBlank()) return q.getInputType();
        if (q.getQuestionType() == null) return "NUMERIC_INPUT";
        return switch (q.getQuestionType()) {
            case SINGLE_CHOICE -> "SINGLE_CHOICE";
            case MULTI_CHOICE -> "MULTIPLE_CHOICE";
            case BOOLEAN -> "YES_NO";
            case SCALE -> "RATING_SCALE";
            default -> "NUMERIC_INPUT";
        };
    }

    public static QuestionType storageType(String adminType) {
        return switch (adminType) {
            case "SINGLE_CHOICE", "SELF_ASSESSMENT" -> QuestionType.SINGLE_CHOICE;
            case "MULTIPLE_CHOICE" -> QuestionType.MULTI_CHOICE;
            case "YES_NO" -> QuestionType.BOOLEAN;
            case "RATING_SCALE" -> QuestionType.SCALE;
            default -> QuestionType.NUMBER;
        };
    }

    /** Bộ hiển thị phía học viên: SINGLE_CHOICE | MULTIPLE_CHOICE | NUMBER | BOOLEAN | SCALE */
    public static String rendererType(String adminType, boolean hasOptions) {
        return switch (adminType) {
            case "SINGLE_CHOICE" -> "SINGLE_CHOICE";
            case "SELF_ASSESSMENT" -> hasOptions ? "SINGLE_CHOICE" : "SCALE";
            case "MULTIPLE_CHOICE" -> "MULTIPLE_CHOICE";
            case "YES_NO" -> "BOOLEAN";
            case "RATING_SCALE" -> "SCALE";
            default -> "NUMBER";
        };
    }
}
