package com.calishealth.api.service.motion;

import com.calishealth.api.dto.MotionDtos.*;
import com.calishealth.api.engine.motion.MotionTypes.*;
import com.calishealth.api.entity.AiMotionRule;
import com.calishealth.api.entity.ExerciseAiProfile;
import com.calishealth.api.entity.MotionRuleThreshold;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.util.*;

/** Chuyển đổi entity (DB) <-> định nghĩa thuần của engine (RuleDef / ProfileDef). */
@Component
public class MotionRuleMapper {
    private final ObjectMapper json = new ObjectMapper();

    // ============================== Measurement ==============================

    public MeasurementDto readMeasurement(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return json.readValue(raw, MeasurementDto.class);
        } catch (RuntimeException e) {
            return null;
        }
    }

    public String writeMeasurement(MeasurementDto m) {
        return m == null ? null : json.writeValueAsString(m);
    }

    public static MetricType metricType(String s) {
        if (s == null) return null;
        try { return MetricType.valueOf(s); } catch (IllegalArgumentException e) { return null; }
    }

    public static Operator operator(String s) {
        if (s == null) return null;
        try { return Operator.valueOf(s); } catch (IllegalArgumentException e) { return null; }
    }

    public static Severity severity(String s) {
        if (s == null) return null;
        try { return Severity.valueOf(s); } catch (IllegalArgumentException e) { return null; }
    }

    public Measurement measurement(String metricType, String measurementJson) {
        MetricType type = metricType(metricType);
        if (type == null) return null;
        MeasurementDto m = readMeasurement(measurementJson);
        if (m == null) return new Measurement(type, List.of(), List.of(), null, null, null, null);
        return new Measurement(type, m.points(), m.pointsRight(), m.method(), m.axis(), m.phase(), m.windowFrames());
    }

    // ============================== Rule ==============================

    public RuleDef toDef(AiMotionRule r, List<MotionRuleThreshold> thresholds) {
        List<Band> bands = thresholds == null ? List.of() : thresholds.stream()
                .sorted(Comparator.comparingInt((MotionRuleThreshold t) -> t.getSortOrder()))
                .filter(t -> severity(t.getSeverity()) != null)
                .map(t -> new Band(severity(t.getSeverity()), t.getMinValue(), t.getMaxValue(), t.isMinInclusive(), t.isMaxInclusive()))
                .toList();
        Severity sev = severity(r.getSeverity());
        return new RuleDef(
                r.getId() == null ? 0 : r.getId(), r.getRuleCode(), r.getRuleVersion() == null ? 1 : r.getRuleVersion(),
                r.getRuleName(), r.getStatus(), r.getPhaseCode() == null ? "ALL" : r.getPhaseCode(),
                measurement(r.getMetricType(), r.getMeasurementJson()), r.getUnit(), operator(r.getOperator()),
                r.getTargetValue(), r.getNormalMin(), r.getNormalMax(),
                !Boolean.FALSE.equals(r.getNormalMinInclusive()), !Boolean.FALSE.equals(r.getNormalMaxInclusive()),
                bands, sev == null ? Severity.WARNING : sev, r.getPriority(), r.isInvalidRep(),
                severity(r.getInvalidRepMinSeverity()), Boolean.TRUE.equals(r.getStopExercise()),
                "TIME".equals(r.getPersistenceType()) ? PersistenceType.TIME : PersistenceType.FRAME,
                r.getPersistenceValue() == null ? 1 : r.getPersistenceValue(),
                r.getCooldownMs() == null ? 0 : r.getCooldownMs(),
                r.getEvaluationIntervalMs() == null ? 0 : r.getEvaluationIntervalMs(),
                r.getFeedbackCode(), r.getCameraView());
    }

    /** Áp request lên entity (không đổi status/version/audit — do service quyết định). */
    public void apply(AiMotionRule r, RuleUpsertRequest q, List<MotionRuleThreshold> outBands) {
        if (q.code() != null) r.setRuleCode(q.code().trim().toUpperCase(Locale.ROOT));
        if (q.name() != null) r.setRuleName(q.name().trim());
        r.setDescription(q.description());
        r.setPhaseCode(q.phase() == null || q.phase().isBlank() ? "ALL" : q.phase());
        if (q.metricType() != null) r.setMetricType(q.metricType());
        r.setMeasurementJson(writeMeasurement(q.measurement()));
        r.setUnit(q.unit());
        if (q.operator() != null) r.setOperator(q.operator());
        r.setTargetValue(q.target());
        r.setNormalMin(q.normalMin());
        r.setNormalMax(q.normalMax());
        r.setNormalMinInclusive(q.normalMinInclusive() == null || q.normalMinInclusive());
        r.setNormalMaxInclusive(q.normalMaxInclusive() == null || q.normalMaxInclusive());
        if (q.severity() != null) r.setSeverity(q.severity());
        if (q.priority() != null) r.setPriority(q.priority());
        r.setInvalidRep(Boolean.TRUE.equals(q.invalidRep()));
        r.setInvalidRepMinSeverity(blankToNull(q.invalidRepMinSeverity()));
        r.setStopExercise(Boolean.TRUE.equals(q.stopExercise()));
        r.setPersistenceType("TIME".equals(q.persistenceType()) ? "TIME" : "FRAME");
        r.setPersistenceValue(q.persistenceValue() == null ? 1 : q.persistenceValue());
        r.setCooldownMs(q.cooldownMs() == null ? 0L : q.cooldownMs());
        r.setEvaluationIntervalMs(q.evaluationIntervalMs() == null ? 0L : q.evaluationIntervalMs());
        r.setFeedbackCode(blankToNull(q.feedbackCode()));
        r.setCameraView(blankToNull(q.cameraView()));
        r.setSourceType(blankToNull(q.sourceType()));
        r.setSourceReference(blankToNull(q.sourceReference()));
        if (q.changeNote() != null) r.setChangeNote(q.changeNote());
        if (q.bands() != null) {
            int i = 0;
            for (BandDto b : q.bands()) {
                MotionRuleThreshold t = new MotionRuleThreshold();
                t.setSeverity(b.severity());
                t.setMinValue(b.min());
                t.setMaxValue(b.max());
                t.setMinInclusive(b.minInclusive() == null || b.minInclusive());
                t.setMaxInclusive(b.maxInclusive() == null || b.maxInclusive());
                t.setSortOrder(i++);
                outBands.add(t);
            }
        }
    }

    /** Sao chép toàn bộ nội dung cấu hình sang bản mới (dùng khi sửa rule PUBLISHED -> DRAFT version mới). */
    public void copyContent(AiMotionRule from, AiMotionRule to) {
        to.setAiProfile(from.getAiProfile());
        to.setRuleCode(from.getRuleCode());
        to.setRuleName(from.getRuleName());
        to.setRuleType(from.getRuleType());
        to.setDescription(from.getDescription());
        to.setPhaseCode(from.getPhaseCode());
        to.setMetricType(from.getMetricType());
        to.setMeasurementJson(from.getMeasurementJson());
        to.setUnit(from.getUnit());
        to.setOperator(from.getOperator());
        to.setTargetValue(from.getTargetValue());
        to.setNormalMin(from.getNormalMin());
        to.setNormalMax(from.getNormalMax());
        to.setNormalMinInclusive(from.getNormalMinInclusive());
        to.setNormalMaxInclusive(from.getNormalMaxInclusive());
        to.setThresholdMin(from.getThresholdMin());
        to.setThresholdMax(from.getThresholdMax());
        to.setSeverity(from.getSeverity());
        to.setPriority(from.getPriority());
        to.setInvalidRep(from.isInvalidRep());
        to.setInvalidRepMinSeverity(from.getInvalidRepMinSeverity());
        to.setStopExercise(from.getStopExercise());
        to.setPersistenceType(from.getPersistenceType());
        to.setPersistenceValue(from.getPersistenceValue());
        to.setCooldownMs(from.getCooldownMs());
        to.setEvaluationIntervalMs(from.getEvaluationIntervalMs());
        to.setFeedbackCode(from.getFeedbackCode());
        to.setCameraView(from.getCameraView());
        to.setSourceType(from.getSourceType());
        to.setSourceReference(from.getSourceReference());
        to.setFeedbackMessage(from.getFeedbackMessage());
        to.setVoicePrompt(from.getVoicePrompt());
    }

    // ============================== Profile ==============================

    public ProfileDef toProfileDef(ExerciseAiProfile p) {
        String type = "HOLD".equals(p.getMovementType()) ? "HOLD" : "REPS";
        MeasurementDto m = readMeasurement(p.getRepMetricJson());
        // Chỉ số đếm rep luôn là góc 3 điểm (FeatureEngine.updatePhase)
        Measurement rep = m == null ? null : new Measurement(MetricType.ANGLE_3_POINT, m.points(), null, null, null, null, null);
        return new ProfileDef(p.getId(), p.getVersion(), p.getCameraView(), type, rep,
                p.getRepTopThreshold(), p.getRepBottomThreshold(), p.getRepDirection() == null ? "DESCENDING_FIRST" : p.getRepDirection(),
                p.getDebounceTimeMs() == null ? 0 : p.getDebounceTimeMs(),
                p.getMinRepDurationMs() == null ? 0 : p.getMinRepDurationMs(),
                p.getMaxRepDurationMs() == null ? Long.MAX_VALUE : p.getMaxRepDurationMs(),
                p.getMinPoseConfidence() == null ? 0.5 : p.getMinPoseConfidence(),
                p.getMinLandmarkVisibility() == null ? 0.5 : p.getMinLandmarkVisibility(), Map.of());
    }

    static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
