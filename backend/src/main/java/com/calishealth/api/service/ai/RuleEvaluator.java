package com.calishealth.api.service.ai;

import com.calishealth.api.dto.AiMotionDtos.RuleEvaluationResult;
import com.calishealth.api.entity.AiMotionRule;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class RuleEvaluator {

    public RuleEvaluationResult evaluate(AiMotionRule rule, Map<String, Double> metrics) {
        String metricKey = rule.getMetricType() != null ? rule.getMetricType().toUpperCase() : "ANGLE";
        
        // Find metric matching rule code or metric type
        Double actualVal = null;
        if (metrics.containsKey(rule.getRuleCode())) {
            actualVal = metrics.get(rule.getRuleCode());
        } else if (metrics.containsKey(metricKey)) {
            actualVal = metrics.get(metricKey);
        } else {
            // Check common aliases
            for (Map.Entry<String, Double> entry : metrics.entrySet()) {
                if (entry.getKey().equalsIgnoreCase(rule.getRuleCode()) ||
                    entry.getKey().equalsIgnoreCase(rule.getRuleName()) ||
                    entry.getKey().toUpperCase().contains(metricKey)) {
                    actualVal = entry.getValue();
                    break;
                }
            }
        }

        double actual = 0.0;
        if (actualVal != null) {
            actual = actualVal;
        } else if (rule.getThresholdMin() != null) {
            actual = rule.getThresholdMin();
        }

        boolean passed = evaluateCondition(actual, rule.getOperator(), rule.getThresholdMin(), rule.getThresholdMax());
        String expectedRange = formatExpectedRange(rule.getOperator(), rule.getThresholdMin(), rule.getThresholdMax());

        return new RuleEvaluationResult(
                rule.getRuleCode(),
                rule.getRuleName(),
                rule.getMetricType(),
                Math.round(actual * 100.0) / 100.0,
                expectedRange,
                passed,
                rule.getSeverity(),
                rule.isInvalidRep(),
                passed ? null : (rule.getFeedbackMessage() != null ? rule.getFeedbackMessage() : "Sai form kỹ thuật ở mốc " + rule.getRuleName()),
                passed ? null : (rule.getVoicePrompt() != null ? rule.getVoicePrompt() : rule.getFeedbackMessage())
        );
    }

    private boolean evaluateCondition(double val, String operator, Double min, Double max) {
        if (operator == null) return true;
        return switch (operator.toUpperCase()) {
            case "BETWEEN" -> {
                if (min != null && max != null) yield val >= min && val <= max;
                if (min != null) yield val >= min;
                if (max != null) yield val <= max;
                yield true;
            }
            case "GREATER_THAN", "GT" -> (min == null || val > min);
            case "LESS_THAN", "LT" -> (max == null || val < max);
            case "GREATER_OR_EQUAL", "GTE", "GREATER_THAN_OR_EQUAL", "MINIMUM_REQUIRED" -> (min == null || val >= min);
            case "LESS_OR_EQUAL", "LTE", "LESS_THAN_OR_EQUAL", "MAXIMUM_ALLOWED" -> (max == null || val <= max);
            case "EQUAL", "EQ" -> (min == null || Math.abs(val - min) < 0.001);
            case "OUTSIDE_RANGE", "OUTSIDE" -> (min != null && max != null && (val < min || val > max));
            default -> true;
        };
    }

    private String formatExpectedRange(String operator, Double min, Double max) {
        if (operator == null) return "Bất kỳ";
        return switch (operator.toUpperCase()) {
            case "BETWEEN" -> (min != null ? min : "-∞") + " ~ " + (max != null ? max : "+∞");
            case "GREATER_THAN", "GT" -> "> " + min;
            case "LESS_THAN", "LT" -> "< " + max;
            case "GREATER_OR_EQUAL", "GTE" -> "≥ " + min;
            case "LESS_OR_EQUAL", "LTE" -> "≤ " + max;
            case "EQUAL", "EQ" -> "= " + min;
            case "OUTSIDE_RANGE" -> "< " + min + " hoặc > " + max;
            default -> operator;
        };
    }
}
