package com.calishealth.api.service.motion;

import com.calishealth.api.entity.AiMotionRule;
import com.calishealth.api.entity.MotionFeedbackTemplate;
import com.calishealth.api.repository.AiMotionRuleRepository;
import com.calishealth.api.repository.MotionFeedbackTemplateRepository;
import com.calishealth.api.repository.MotionRuleThresholdRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;

/**
 * Đưa rule định dạng cũ (metric/operator cũ, thresholdMin/Max, câu cảnh báo gắn trực tiếp) về mô hình Motion Rule Engine:
 * DRAFT có version, vùng chuẩn tường minh, feedback_code -> template. Không đoán landmark: rule cũ không lưu landmark
 * nên luôn ở DRAFT cho tới khi admin cấu hình phép đo, chạy Rule Tester và duyệt.
 */
@Component
public class LegacyMotionRuleConverter {
    private final AiMotionRuleRepository rules;
    private final MotionFeedbackTemplateRepository templates;
    private final MotionRuleThresholdRepository thresholds;

    public LegacyMotionRuleConverter(AiMotionRuleRepository rules, MotionFeedbackTemplateRepository templates,
                                     MotionRuleThresholdRepository thresholds) {
        this.rules = rules;
        this.templates = templates;
        this.thresholds = thresholds;
    }

    /** Gọi sau khi luồng cũ xoá rule (không biết tới bảng dải ngưỡng). */
    public int cleanupOrphanThresholds() {
        return thresholds.deleteOrphans();
    }

    public static boolean isLegacy(AiMotionRule r) {
        return r.getStatus() == null || r.getRuleVersion() == null;
    }

    /** Chuyển đổi tại chỗ (chưa lưu). Gọi trước khi save rule mới từ luồng cũ / Exercise Builder. */
    public void convert(AiMotionRule r) {
        if (!isLegacy(r)) return;
        String oldMetric = r.getMetricType(), oldOp = r.getOperator();
        Double min = r.getThresholdMin(), max = r.getThresholdMax();

        String metric = switch (oldMetric == null ? "" : oldMetric.toUpperCase(Locale.ROOT)) {
            case "ANGLE", "ALIGNMENT" -> "ANGLE_3_POINT";   // giá trị cũ là góc khớp (vd. 168–185°), không phải độ lệch
            case "ROM" -> "ROM";
            case "TEMPO" -> "TEMPO";
            case "DISTANCE" -> "DISTANCE";
            case "VELOCITY" -> "VELOCITY";
            case "SYMMETRY" -> "SYMMETRY";
            default -> oldMetric == null ? "CUSTOM" : oldMetric;   // DEPTH / CUSTOM: admin phải chọn lại loại chỉ số
        };
        String opKey = oldOp == null ? "" : oldOp.toUpperCase(Locale.ROOT);
        String op = switch (opKey) {
            case "LESS_OR_EQUAL", "LTE" -> "LESS_THAN_OR_EQUAL";
            case "GREATER_OR_EQUAL", "GTE" -> "GREATER_THAN_OR_EQUAL";
            case "GT" -> "GREATER_THAN";
            case "LT" -> "LESS_THAN";
            case "EQ" -> "EQUAL";
            case "OUTSIDE_RANGE" -> "OUTSIDE";
            case "" -> "BETWEEN";
            default -> opKey;
        };
        // Toán tử cũ mô tả điều kiện ĐẠT -> chính là vùng chuẩn. Dữ liệu cũ đôi khi để ngưỡng một phía ở sai cột.
        switch (op) {
            case "GREATER_THAN", "GREATER_THAN_OR_EQUAL" -> { r.setNormalMin(min != null ? min : max); r.setNormalMax(null); }
            case "LESS_THAN", "LESS_THAN_OR_EQUAL" -> { r.setNormalMin(null); r.setNormalMax(max != null ? max : min); }
            case "EQUAL" -> r.setTargetValue(min != null ? min : max);
            default -> { r.setNormalMin(min); r.setNormalMax(max); }
        }
        r.setMetricType(metric);
        r.setOperator(op);
        if (r.getUnit() == null) {
            r.setUnit(switch (metric) {
                case "ANGLE_3_POINT", "ROM" -> "DEGREE";
                case "TEMPO" -> "SECOND";
                case "DISTANCE" -> "BODY_RATIO";
                default -> null;
            });
        }
        if (r.getPhaseCode() == null) r.setPhaseCode("ALL");
        if (r.getNormalMinInclusive() == null) r.setNormalMinInclusive(!"GREATER_THAN".equals(op));
        if (r.getNormalMaxInclusive() == null) r.setNormalMaxInclusive(!"LESS_THAN".equals(op));
        if (r.getPersistenceType() == null) { r.setPersistenceType("FRAME"); r.setPersistenceValue(3); }
        if (r.getCooldownMs() == null) r.setCooldownMs(3000L);
        if (r.getEvaluationIntervalMs() == null) r.setEvaluationIntervalMs(0L);
        if (r.getStopExercise() == null) r.setStopExercise(false);
        if (r.getPriority() < 1) r.setPriority(1);
        if (r.getPriority() > 10) r.setPriority(10);

        // Version: nếu mã đã có phiên bản (vd. Exercise Builder đồng bộ lại rule đã xuất bản) -> bản DRAFT kế tiếp
        int version = 1;
        Long previous = null;
        if (r.getAiProfile() != null && r.getAiProfile().getId() != null && r.getRuleCode() != null) {
            List<AiMotionRule> versions = rules.findByAiProfileIdAndRuleCodeOrderByRuleVersionDesc(r.getAiProfile().getId(), r.getRuleCode());
            for (AiMotionRule v : versions) {
                if (v == r || (r.getId() != null && r.getId().equals(v.getId())) || v.getRuleVersion() == null) continue;
                version = Math.max(version, v.getRuleVersion() + 1);
                if (previous == null && MotionConfigService.PUBLISHED.equals(v.getStatus())) previous = v.getId();
            }
        }
        r.setRuleVersion(version);
        r.setPreviousVersionId(previous);
        r.setStatus(MotionConfigService.DRAFT);
        r.setChangeNote(String.format(Locale.ROOT,
                "Chuyển đổi tự động từ cấu hình cũ (metric %s, operator %s, min %s, max %s). Cần chọn landmark, kiểm tra ngưỡng, chạy Rule Tester trước khi gửi duyệt.",
                oldMetric, oldOp, min, max));
        if (r.getFeedbackCode() == null) r.setFeedbackCode(ensureTemplate(r));
    }

    /** Câu cảnh báo cũ -> feedback template riêng của profile. */
    private String ensureTemplate(AiMotionRule r) {
        String ui = r.getFeedbackMessage() != null && !r.getFeedbackMessage().isBlank() ? r.getFeedbackMessage() : r.getVoicePrompt();
        if (ui == null || ui.isBlank() || r.getRuleCode() == null) return null;
        Long profileId = r.getAiProfile() == null ? null : r.getAiProfile().getId();
        String base = r.getRuleCode().toUpperCase(Locale.ROOT).replaceFirst("^(RULE_|BUILDER_)", "").replaceAll("[^A-Z0-9_]", "_");
        String code = base + (profileId == null ? "" : "_P" + profileId);
        if (code.length() > 100) code = code.substring(0, 100);
        if (templates.findByFeedbackCodeAndLanguage(code, MotionFeedbackService.DEFAULT_LANGUAGE).isEmpty()) {
            MotionFeedbackTemplate t = new MotionFeedbackTemplate();
            t.setAiProfileId(profileId);
            t.setFeedbackCode(code);
            t.setLanguage(MotionFeedbackService.DEFAULT_LANGUAGE);
            t.setUiText(ui.trim());
            String voice = r.getVoicePrompt() != null && !r.getVoicePrompt().isBlank() ? r.getVoicePrompt().trim() : ui.trim();
            t.setVoiceText(voice.length() > 200 ? voice.substring(0, 200) : voice);
            t.setUpdatedBy("legacy-migration");
            templates.save(t);
        }
        return code;
    }
}
