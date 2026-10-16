package com.calishealth.api.service.ai;

import com.calishealth.api.entity.*;
import com.calishealth.api.repository.*;
import com.calishealth.api.service.motion.LegacyMotionRuleConverter;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Locale;
import java.util.Objects;

/**
 * Đồng bộ cấu hình AI Motion soạn ở bước 5 của Exercise Builder (exercises.ai_analysis_data)
 * sang hồ sơ AI runtime mà engine thực sự dùng: exercise_ai_profiles, ai_motion_rules, ai_landmark_requirements.
 *
 * Quy ước:
 *  - Chỉ thay các rule có mã bắt đầu bằng BUILDER_; rule admin tạo/chỉnh trên trang AI Motion được giữ nguyên.
 *  - Trong Builder, "điều kiện" mô tả FORM ĐÚNG (vd. khuỷu ≤ 90°) - trùng ngữ nghĩa "passed" của RuleEvaluator.
 *  - Nội dung không đổi so với lần đồng bộ trước thì bỏ qua (không tăng phiên bản).
 */
@Service
public class ExerciseAiSyncService {
    private static final Logger log = LoggerFactory.getLogger(ExerciseAiSyncService.class);
    static final String RULE_PREFIX = "BUILDER_";
    private static final String SYNC_SOURCE = "EXERCISE_BUILDER";

    private final ExerciseAiProfileRepository profileRepo;
    private final AiMotionRuleRepository ruleRepo;
    private final AiLandmarkRequirementRepository landmarkRepo;
    private final AiConfigurationVersionRepository versionRepo;
    private final AiConfigurationAuditLogRepository auditRepo;
    private final ObjectMapper objectMapper;
    private final LegacyMotionRuleConverter ruleConverter;

    public ExerciseAiSyncService(
            ExerciseAiProfileRepository profileRepo,
            AiMotionRuleRepository ruleRepo,
            AiLandmarkRequirementRepository landmarkRepo,
            AiConfigurationVersionRepository versionRepo,
            AiConfigurationAuditLogRepository auditRepo,
            ObjectMapper objectMapper,
            LegacyMotionRuleConverter ruleConverter
    ) {
        this.profileRepo = profileRepo;
        this.ruleRepo = ruleRepo;
        this.landmarkRepo = landmarkRepo;
        this.versionRepo = versionRepo;
        this.auditRepo = auditRepo;
        this.objectMapper = objectMapper;
        this.ruleConverter = ruleConverter;
    }

    // ===== Cấu trúc JSON aiAnalysis của Builder (Frontend: ExerciseFormData["aiAnalysis"]) =====

    @JsonIgnoreProperties(ignoreUnknown = true)
    record BuilderAi(Boolean enabled, List<BuilderLandmark> landmarks, List<BuilderJointRule> jointRules,
                     List<BuilderRomRule> romRules, BuilderTempo tempoRule, List<BuilderErrorRule> errorRules) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record BuilderLandmark(Integer id, String name, Boolean enabled) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record BuilderJointRule(String measurement, String condition, Double targetValue, Double secondaryValue,
                            Double tolerance, String action, String message) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record BuilderRomRule(String movementName, String metricType, Double minROM, Double maxROM,
                          Double tolerance, String unit, String description) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record BuilderTempo(Double eccentricSec, Double pauseBottomSec, Double concentricSec, Double pauseTopSec, Double toleranceSec) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record BuilderErrorRule(String ruleName, String category, String conditionDescription, String severity,
                            String aiFeedback, String correctionCue) {}

    public record SyncResult(Long profileId, String profileVersion, boolean changed, int rulesSynced,
                             int rulesSkipped, int landmarksSynced) {}

    /**
     * Đồng bộ AI của động tác. Trả về null nếu động tác không có cấu hình AI từ Builder.
     * Chạy trong transaction của lời gọi (lưu động tác + đồng bộ AI cùng thành công hoặc cùng rollback).
     */
    @Transactional
    public SyncResult syncFromBuilder(Exercise exercise) {
        String json = exercise.getAiAnalysisData();
        if (json == null || json.isBlank()) return null;

        BuilderAi ai;
        try {
            ai = objectMapper.readValue(json, BuilderAi.class);
        } catch (Exception e) {
            throw new IllegalArgumentException("Cấu hình AI Motion (bước 5) không hợp lệ: " + e.getMessage(), e);
        }

        ExerciseAiProfile profile = profileRepo.findFirstByExerciseIdOrderByCreatedAtDesc(exercise.getId())
                .orElseGet(() -> newProfile(exercise));

        // Bỏ qua nếu nội dung giống hệt lần đồng bộ trước
        boolean unchanged = versionRepo.findByAiProfileIdOrderByCreatedAtDesc(profile.getId()).stream()
                .filter(v -> SYNC_SOURCE.equals(v.getCreatedBy()))
                .findFirst()
                .map(v -> json.equals(v.getConfigurationSnapshot()))
                .orElse(false);
        if (unchanged) {
            return new SyncResult(profile.getId(), profile.getVersion(), false, 0, 0, 0);
        }

        // ---- Profile ----
        profile.setAnalysisEnabled(ai.enabled() == null || ai.enabled());
        profile.setStatus("ACTIVE");
        profile.setVersion(nextVersion(profile.getVersion()));

        // ---- Rules ----
        ruleRepo.deleteByProfileIdAndRuleCodePrefix(profile.getId(), RULE_PREFIX);
        ruleConverter.cleanupOrphanThresholds();
        int synced = 0, skipped = 0, index = 0;
        String repDown = null, repUp = null;

        for (BuilderJointRule j : nonNull(ai.jointRules())) {
            index++;
            AiMotionRule r = mapJointRule(profile, j, index);
            if (r == null) { skipped++; continue; }
            saveRule(r);
            synced++;
            if ("REP_COUNT_TRIGGER".equals(j.action())) {
                String cond = describe(j);
                if ("LESS_THAN".equals(j.condition())) repDown = cond;
                else if ("GREATER_THAN".equals(j.condition())) repUp = cond;
            }
        }
        if (repDown != null) profile.setRepDownCondition(repDown);
        if (repUp != null) profile.setRepUpCondition(repUp);

        index = 0;
        for (BuilderRomRule rom : nonNull(ai.romRules())) {
            index++;
            if (rom.minROM() == null && rom.maxROM() == null) { skipped++; continue; }
            double tol = val(rom.tolerance());
            AiMotionRule r = baseRule(profile, RULE_PREFIX + "ROM_" + index,
                    firstNonBlank(rom.movementName(), "Biên độ chuyển động " + index));
            r.setRuleType("ROM");
            r.setMetricType("ROM");
            r.setOperator("BETWEEN");
            r.setThresholdMin(rom.minROM() != null ? rom.minROM() - tol : null);
            r.setThresholdMax(rom.maxROM() != null ? rom.maxROM() + tol : null);
            r.setSeverity("WARNING");
            r.setInvalidRep(true);
            r.setPriority(2);
            String unit = rom.unit() != null ? " " + rom.unit() : "";
            r.setFeedbackMessage(firstNonBlank(rom.description(),
                    "Biên độ " + r.getRuleName() + " cần trong khoảng " + fmt(rom.minROM()) + " – " + fmt(rom.maxROM()) + unit + "."));
            saveRule(r);
            synced++;
            if (rom.minROM() != null && ("%".equals(rom.unit()) || "height_percent".equals(rom.metricType()))) {
                profile.setMinRomPercentage(rom.minROM());
            }
        }

        BuilderTempo t = ai.tempoRule();
        if (t != null) {
            double total = val(t.eccentricSec()) + val(t.pauseBottomSec()) + val(t.concentricSec()) + val(t.pauseTopSec());
            double tol = val(t.toleranceSec());
            if (total > 0) {
                AiMotionRule r = baseRule(profile, RULE_PREFIX + "TEMPO",
                        "Nhịp độ " + fmt(t.eccentricSec()) + "-" + fmt(t.pauseBottomSec()) + "-" + fmt(t.concentricSec()) + "-" + fmt(t.pauseTopSec()));
                r.setRuleType("TEMPO");
                r.setMetricType("TEMPO");
                r.setOperator("BETWEEN");
                r.setThresholdMin(Math.max(0, total - tol));
                r.setThresholdMax(total + tol);
                r.setSeverity("INFO");
                r.setPriority(1);
                r.setFeedbackMessage("Giữ nhịp độ mỗi rep khoảng " + fmt(total) + " giây (±" + fmt(tol) + "s).");
                r.setVoicePrompt("Giữ đúng nhịp, hạ chậm có kiểm soát.");
                saveRule(r);
                synced++;
                int minMs = (int) Math.max(300, Math.round((total - tol) * 1000));
                profile.setMinRepDurationMs(minMs);
                if (profile.getMaxRepDurationMs() != null && profile.getMaxRepDurationMs() <= minMs) {
                    profile.setMaxRepDurationMs(minMs * 3);
                }
            }
        }

        index = 0;
        for (BuilderErrorRule e : nonNull(ai.errorRules())) {
            index++;
            if (e.ruleName() == null || e.ruleName().isBlank()) { skipped++; continue; }
            // Lỗi mô tả bằng lời chưa có phép đo -> lưu làm mẫu phản hồi; engine không tự đánh giá được
            AiMotionRule r = baseRule(profile, RULE_PREFIX + "ERROR_" + index, e.ruleName().trim());
            r.setRuleType(errorRuleType(e.category()));
            r.setMetricType("CUSTOM");
            r.setOperator("BETWEEN");
            r.setSeverity(mapSeverity(e.severity()));
            r.setInvalidRep("CRITICAL".equals(r.getSeverity()));
            r.setPriority("CRITICAL".equals(r.getSeverity()) ? 4 : "WARNING".equals(r.getSeverity()) ? 2 : 1);
            r.setFeedbackMessage(firstNonBlank(e.aiFeedback(), e.conditionDescription()));
            r.setVoicePrompt(firstNonBlank(e.correctionCue(), e.aiFeedback()));
            saveRule(r);
            synced++;
        }

        // ---- Landmarks: thay bằng các landmark đang bật trong Builder ----
        List<BuilderLandmark> enabledLandmarks = nonNull(ai.landmarks()).stream()
                .filter(l -> Boolean.TRUE.equals(l.enabled()) && l.name() != null)
                .toList();
        int landmarks = 0;
        if (!enabledLandmarks.isEmpty()) {
            landmarkRepo.deleteAll(landmarkRepo.findByAiProfileId(profile.getId()));
            for (BuilderLandmark l : enabledLandmarks) {
                AiLandmarkRequirement lr = new AiLandmarkRequirement();
                lr.setAiProfile(profile);
                String name = l.name().trim().toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]+", "_");
                lr.setLandmarkName(name.length() > 60 ? name.substring(0, 60) : name);
                lr.setLandmarkIndex(l.id());
                lr.setRequired(true);
                lr.setMinVisibility(0.65);
                lr.setSide(name.startsWith("LEFT") ? "LEFT" : name.startsWith("RIGHT") ? "RIGHT" : "CENTER");
                landmarkRepo.save(lr);
                landmarks++;
            }
        }

        profileRepo.save(profile);

        // ---- Phiên bản & audit ----
        AiConfigurationVersion v = new AiConfigurationVersion();
        v.setAiProfile(profile);
        v.setVersionNumber(profile.getVersion());
        v.setConfigurationSnapshot(json);
        v.setStatus("ACTIVE");
        v.setCreatedBy(SYNC_SOURCE);
        v.setApprovedBy(currentUser());
        v.setPublishedAt(java.time.Instant.now());
        v.setChangeSummary("Đồng bộ từ Exercise Builder: " + synced + " rule, " + landmarks + " landmark"
                + (skipped > 0 ? ", bỏ qua " + skipped + " rule không hỗ trợ" : ""));
        versionRepo.save(v);

        AiConfigurationAuditLog audit = new AiConfigurationAuditLog();
        audit.setProfileId(profile.getId());
        audit.setExerciseName(exercise.getName());
        audit.setUserEmail(currentUser());
        audit.setAction("UPDATE");
        audit.setNewValue(json.length() > 60000 ? json.substring(0, 60000) : json);
        audit.setReason(v.getChangeSummary());
        auditRepo.save(audit);

        log.info("AI sync exercise {} -> profile {} v{}: {} rules, {} skipped, {} landmarks",
                exercise.getId(), profile.getId(), profile.getVersion(), synced, skipped, landmarks);
        return new SyncResult(profile.getId(), profile.getVersion(), true, synced, skipped, landmarks);
    }

    // ============================== MAPPING ==============================

    private AiMotionRule mapJointRule(ExerciseAiProfile profile, BuilderJointRule j, int index) {
        if (j.targetValue() == null || j.condition() == null) return null;
        double target = j.targetValue();
        double tol = val(j.tolerance());
        AiMotionRule r = baseRule(profile, RULE_PREFIX + "JOINT_" + index,
                firstNonBlank(j.measurement(), "Góc khớp " + index));
        r.setMetricType("ANGLE");

        switch (j.condition()) {
            case "LESS_THAN" -> { r.setOperator("LESS_OR_EQUAL"); r.setThresholdMax(target + tol); }
            case "GREATER_THAN" -> { r.setOperator("GREATER_OR_EQUAL"); r.setThresholdMin(target - tol); }
            case "BETWEEN" -> {
                double upper = j.secondaryValue() != null ? j.secondaryValue() : target;
                r.setOperator("BETWEEN");
                r.setThresholdMin(Math.min(target, upper) - tol);
                r.setThresholdMax(Math.max(target, upper) + tol);
            }
            case "OUTSIDE_RANGE" -> {
                if (j.secondaryValue() == null) return null;
                r.setOperator("OUTSIDE_RANGE");
                r.setThresholdMin(Math.min(target, j.secondaryValue()));
                r.setThresholdMax(Math.max(target, j.secondaryValue()));
            }
            case "STABLE" -> { r.setOperator("BETWEEN"); r.setThresholdMin(target - tol); r.setThresholdMax(target + tol); }
            default -> { return null; } // INCREASING / DECREASING: RuleEvaluator chưa hỗ trợ xu hướng theo thời gian
        }

        switch (Objects.requireNonNullElse(j.action(), "WARNING")) {
            case "REP_COUNT_TRIGGER" -> { r.setRuleType("REP_TRIGGER"); r.setSeverity("INFO"); r.setInvalidRep(true); r.setPriority(3); }
            case "CRITICAL_STOP" -> { r.setRuleType("SAFETY"); r.setSeverity("CRITICAL"); r.setInvalidRep(true); r.setPriority(4); }
            case "FORM_CUE" -> { r.setRuleType("FORM_CHECK"); r.setSeverity("INFO"); r.setPriority(1); }
            default -> { r.setRuleType("FORM_CHECK"); r.setSeverity("WARNING"); r.setPriority(2); }
        }
        r.setFeedbackMessage(firstNonBlank(j.message(), r.getRuleName() + " chưa đạt chuẩn."));
        r.setVoicePrompt(j.message());
        return r;
    }

    /** Rule Builder vào Motion Rule Engine dưới dạng DRAFT có version (không tự chạy realtime khi chưa duyệt). */
    private void saveRule(AiMotionRule r) {
        ruleConverter.convert(r);
        ruleRepo.save(r);
    }

    private static AiMotionRule baseRule(ExerciseAiProfile profile, String code, String name) {
        AiMotionRule r = new AiMotionRule();
        r.setAiProfile(profile);
        r.setRuleCode(code);
        r.setRuleName(name.length() > 150 ? name.substring(0, 150) : name);
        r.setEnabled(true);
        return r;
    }

    private ExerciseAiProfile newProfile(Exercise exercise) {
        ExerciseAiProfile p = new ExerciseAiProfile();
        p.setExercise(exercise);
        String name = exercise.getName() + " AI Tracking";
        p.setProfileName(name.length() > 150 ? name.substring(0, 150) : name);
        p.setVersion("1.0");
        p.setStatus("ACTIVE");
        return profileRepo.save(p);
    }

    private static String describe(BuilderJointRule j) {
        String m = firstNonBlank(j.measurement(), "Góc khớp");
        return switch (j.condition()) {
            case "LESS_THAN" -> m + " ≤ " + fmt(j.targetValue() + val(j.tolerance())) + "°";
            case "GREATER_THAN" -> m + " ≥ " + fmt(j.targetValue() - val(j.tolerance())) + "°";
            default -> m;
        };
    }

    private static String errorRuleType(String category) {
        if (category == null) return "FORM_CHECK";
        return switch (category) {
            case "Tempo" -> "TEMPO";
            case "Range of Motion" -> "ROM";
            default -> "FORM_CHECK";
        };
    }

    private static String mapSeverity(String s) {
        if (s == null) return "WARNING";
        return switch (s.toUpperCase(Locale.ROOT)) {
            case "CRITICAL" -> "CRITICAL";
            case "INFO" -> "INFO";
            default -> "WARNING";
        };
    }

    /** "1.0" -> "1.1", "2.9" -> "2.10"; định dạng lạ thì về "1.1". */
    static String nextVersion(String current) {
        if (current != null && current.matches("\\d+\\.\\d+")) {
            String[] p = current.split("\\.");
            return p[0] + "." + (Integer.parseInt(p[1]) + 1);
        }
        return "1.1";
    }

    private static String currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String name = auth != null ? auth.getName() : null;
        return name == null || name.isBlank() ? "ADMIN" : (name.length() > 100 ? name.substring(0, 100) : name);
    }

    private static <T> List<T> nonNull(List<T> list) {
        return list == null ? List.of() : list;
    }

    private static double val(Double d) {
        return d == null ? 0 : d;
    }

    private static String fmt(Double d) {
        if (d == null) return "?";
        return d == Math.floor(d) ? String.valueOf(d.longValue()) : String.valueOf(d);
    }

    private static String firstNonBlank(String a, String b) {
        return (a != null && !a.isBlank()) ? a.trim() : b;
    }
}
