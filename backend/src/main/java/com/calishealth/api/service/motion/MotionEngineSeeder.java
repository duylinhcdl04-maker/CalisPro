package com.calishealth.api.service.motion;

import com.calishealth.api.dto.MotionDtos.MeasurementDto;
import com.calishealth.api.entity.*;
import com.calishealth.api.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.util.List;

/**
 * Khởi tạo Motion Rule Engine (idempotent):
 *  1. Rule định dạng cũ -> DRAFT có version (không tự chạy realtime khi chưa duyệt).
 *  2. Pha chuẩn cho mọi motion profile.
 *  3. Bộ rule tham chiếu Push-Up (COACHING_BENCHMARK) ở trạng thái PENDING_REVIEW — HLV/admin duyệt rồi mới chạy.
 */
@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
@Order(30)
public class MotionEngineSeeder implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(MotionEngineSeeder.class);
    static final String SEED_ACTOR = "system-seed";
    static final String PUSHUP_EXERCISE_CODE = "push-up";
    static final String BENCHMARK_REF = "Ngưỡng tham khảo huấn luyện (coaching benchmark), chưa phải bằng chứng khoa học cho mọi cá nhân — cần HLV xác nhận. MOTION_RULE_ENGINE_DESIGN.md §12";

    private final AiMotionRuleRepository rules;
    private final ExerciseAiProfileRepository profiles;
    private final ExerciseRepository exercises;
    private final MotionRuleThresholdRepository thresholds;
    private final MotionFeedbackTemplateRepository templates;
    private final LegacyMotionRuleConverter converter;
    private final MotionConfigService config;
    private final MotionRuleMapper mapper;
    private final TransactionTemplate tx;

    public MotionEngineSeeder(AiMotionRuleRepository rules, ExerciseAiProfileRepository profiles, ExerciseRepository exercises,
                              MotionRuleThresholdRepository thresholds, MotionFeedbackTemplateRepository templates,
                              LegacyMotionRuleConverter converter, MotionConfigService config, MotionRuleMapper mapper,
                              TransactionTemplate tx) {
        this.rules = rules;
        this.profiles = profiles;
        this.exercises = exercises;
        this.thresholds = thresholds;
        this.templates = templates;
        this.converter = converter;
        this.config = config;
        this.mapper = mapper;
        this.tx = tx;
    }

    @Override
    public void run(String... args) {
        try {
            tx.executeWithoutResult(s -> migrateLegacy());
            tx.executeWithoutResult(s -> profiles.findAll().forEach(p -> config.profile(p.getId())));   // tạo pha còn thiếu
            tx.executeWithoutResult(s -> seedPushUp());
        } catch (RuntimeException e) {
            log.error("Motion Rule Engine seed thất bại: {}", e.getMessage(), e);
        }
    }

    void migrateLegacy() {
        List<AiMotionRule> legacy = rules.findByStatusIsNull();
        legacy.forEach(r -> converter.convert(r));
        rules.saveAll(legacy);
        int orphans = converter.cleanupOrphanThresholds();
        if (!legacy.isEmpty() || orphans > 0) log.info("Motion Rule Engine: chuyển {} rule cũ sang DRAFT, dọn {} dải ngưỡng mồ côi", legacy.size(), orphans);
    }

    // ============================== Push-Up tham chiếu ==============================

    void seedPushUp() {
        Exercise ex = exercises.findByCode(PUSHUP_EXERCISE_CODE).orElse(null);
        if (ex == null) return;
        ExerciseAiProfile p = profiles.findByExerciseIdAndStatus(ex.getId(), "ACTIVE")
                .or(() -> profiles.findFirstByExerciseIdOrderByCreatedAtDesc(ex.getId())).orElse(null);
        if (p == null || !rules.findByAiProfileIdAndRuleCodeOrderByRuleVersionDesc(p.getId(), "PUSHUP_BODY_LINE").isEmpty()) return;

        // Camera bên hông: thấy được độ sâu (góc khuỷu) và đường thẳng vai–hông–cổ chân
        if (p.getCameraView() == null) p.setCameraView("SIDE");
        if (p.getMovementType() == null) p.setMovementType("REPS");
        if (p.getRepMetricJson() == null) p.setRepMetricJson(mapper.writeMeasurement(points(11, 13, 15)));
        if (p.getRepTopThreshold() == null) p.setRepTopThreshold(160.0);
        if (p.getRepBottomThreshold() == null) p.setRepBottomThreshold(90.0);
        if (p.getRepDirection() == null) p.setRepDirection("DESCENDING_FIRST");
        if (p.getMinPoseConfidence() == null) p.setMinPoseConfidence(0.5);
        if (p.getMinLandmarkVisibility() == null) p.setMinLandmarkVisibility(0.5);
        profiles.save(p);
        config.profile(p.getId());

        template(p, "PUSHUP_BODY_LINE", "Giữ thân người thẳng từ vai tới cổ chân — siết bụng và mông.", "Giữ thân thẳng, siết bụng");
        template(p, "PUSHUP_DEPTH", "Hạ người sâu hơn, khuỷu tay gập tới khoảng 90 độ.", "Hạ sâu hơn");
        template(p, "PUSHUP_ECCENTRIC_TEMPO", "Hạ người chậm và có kiểm soát (khoảng 1–2 giây).", "Hạ chậm lại");
        template(p, "PUSHUP_HEAD_NEUTRAL", "Giữ đầu thẳng hàng với thân, mắt nhìn xuống sàn.", "Giữ đầu thẳng hàng");
        template(p, "PUSHUP_FULL_REP", "Thực hiện đủ chu kỳ: hạ xuống, chạm đáy rồi đẩy lên hết tay.", "Làm đủ biên độ");
        template(p, "PUSHUP_ELBOW_FLARE", "Khép khuỷu tay lại gần thân (khoảng 45 độ), không xòe ngang.", "Khép khuỷu tay lại");
        template(p, "PUSHUP_CAMERA_VISIBILITY", "Camera chưa thấy rõ toàn thân — đặt máy ngang hông, cách 2–3 mét.", "Lùi ra cho camera thấy toàn thân");

        // Đường thân: độ lệch khỏi đường thẳng vai(11)–hông(23)–cổ chân(27); 0° = thẳng tuyệt đối
        AiMotionRule body = rule(p, "PUSHUP_BODY_LINE", "Thân người không thẳng (võng / nhô hông)", "ALL", "ALIGNMENT",
                new MeasurementDto(List.of(11, 23, 27), null, "COLLINEARITY", null, null, null), "DEGREE", "MAXIMUM_ALLOWED",
                null, null, 10.0, "WARNING", 9, true, "ERROR", "TIME", 300, 4000L, "SIDE");
        bands(body, band("WARNING", 10.0, false, 20.0, true), band("ERROR", 20.0, false, null, true));

        // Độ sâu: biên độ góc khuỷu trong rep (đỉnh 160° → đáy ≤ 90° ⇒ ≥ 70°)
        AiMotionRule depth = rule(p, "PUSHUP_DEPTH", "Hạ người chưa đủ sâu", "ALL", "ROM",
                points(11, 13, 15), "DEGREE", "MINIMUM_REQUIRED", null, 70.0, null, "WARNING", 8, true, "ERROR", "FRAME", 1, 0L, "SIDE");
        bands(depth, band("WARNING", 50.0, true, 70.0, false), band("ERROR", null, true, 50.0, false));

        // Nhịp hạ người (pha lệch tâm) — quá nhanh = thả rơi
        AiMotionRule tempo = rule(p, "PUSHUP_ECCENTRIC_TEMPO", "Hạ người quá nhanh", "ALL", "TEMPO",
                new MeasurementDto(List.of(), null, null, null, "DESCENDING", null), "SECOND", "MINIMUM_REQUIRED",
                null, 0.5, null, "INFO", 5, false, null, "FRAME", 1, 5000L, "ANY");
        bands(tempo, band("INFO", 0.3, true, 0.5, false), band("WARNING", null, true, 0.3, false));

        // Đầu: tai(7)–vai(11)–hông(23)
        AiMotionRule head = rule(p, "PUSHUP_HEAD_NEUTRAL", "Đầu cúi / ngửa quá mức", "ALL", "ALIGNMENT",
                new MeasurementDto(List.of(7, 11, 23), null, "COLLINEARITY", null, null, null), "DEGREE", "MAXIMUM_ALLOWED",
                null, null, 20.0, "INFO", 4, false, null, "TIME", 500, 8000L, "SIDE");
        bands(head, band("INFO", 20.0, false, 35.0, true), band("WARNING", 35.0, false, null, true));

        rule(p, "PUSHUP_FULL_REP", "Rep thiếu pha (không đủ chu kỳ)", "ALL", "REP_SEQUENCE",
                new MeasurementDto(List.of(), null, null, null, null, null), "BOOLEAN", "EQUAL",
                1.0, null, null, "WARNING", 6, true, null, "FRAME", 1, 0L, "ANY");

        // Khuỷu xòe: góc hông(23)–vai(11)–khuỷu(13) — chỉ đo được từ camera phía trước
        AiMotionRule flare = rule(p, "PUSHUP_ELBOW_FLARE", "Khuỷu tay xòe quá rộng", "BOTTOM", "ANGLE_3_POINT",
                points(23, 11, 13), "DEGREE", "MAXIMUM_ALLOWED", null, null, 65.0, "WARNING", 7, false, null, "TIME", 300, 4000L, "FRONT");
        bands(flare, band("WARNING", 65.0, false, 80.0, true), band("ERROR", 80.0, false, null, true));

        AiMotionRule vis = rule(p, "PUSHUP_CAMERA_VISIBILITY", "Camera không thấy rõ khớp cần đo", "ALL", "LANDMARK_VISIBILITY",
                points(11, 13, 15, 23, 27), "RATIO", "MINIMUM_REQUIRED", null, 0.6, null, "INFO", 3, false, null, "TIME", 1000, 8000L, "ANY");
        bands(vis, band("INFO", null, true, 0.6, false));

        log.info("Motion Rule Engine: tạo bộ rule tham chiếu Push-Up (PENDING_REVIEW) cho profile {}", p.getId());
    }

    private static MeasurementDto points(Integer... pts) {
        return new MeasurementDto(List.of(pts), null, null, null, null, null);
    }

    private AiMotionRule rule(ExerciseAiProfile p, String code, String name, String phase, String metric, MeasurementDto m,
                              String unit, String operator, Double target, Double normalMin, Double normalMax, String severity,
                              int priority, boolean invalidRep, String invalidRepMin, String persistenceType, int persistence,
                              long cooldownMs, String camera) {
        AiMotionRule r = new AiMotionRule();
        r.setAiProfile(p);
        r.setRuleCode(code);
        r.setRuleName(name);
        r.setRuleType("FORM_CHECK");
        r.setPhaseCode(phase);
        r.setMetricType(metric);
        r.setMeasurementJson(mapper.writeMeasurement(m));
        r.setUnit(unit);
        r.setOperator(operator);
        r.setTargetValue(target);
        r.setNormalMin(normalMin);
        r.setNormalMax(normalMax);
        r.setNormalMinInclusive(true);
        r.setNormalMaxInclusive(true);
        r.setThresholdMin(normalMin);
        r.setThresholdMax(normalMax);
        r.setSeverity(severity);
        r.setPriority(priority);
        r.setInvalidRep(invalidRep);
        r.setInvalidRepMinSeverity(invalidRepMin);
        r.setStopExercise(false);
        r.setPersistenceType(persistenceType);
        r.setPersistenceValue(persistence);
        r.setCooldownMs(cooldownMs);
        r.setEvaluationIntervalMs(0L);
        r.setFeedbackCode(code);
        r.setCameraView(camera);
        r.setEnabled(true);
        r.setRuleVersion(1);
        r.setStatus(MotionConfigService.PENDING_REVIEW);
        r.setSourceType("COACHING_BENCHMARK");
        r.setSourceReference(BENCHMARK_REF);
        r.setChangeNote("Bộ rule tham chiếu ban đầu — đã kiểm thử tự động (MotionRuleEngineTest), chờ HLV duyệt.");
        r.setCreatedBy(SEED_ACTOR);
        r.setUpdatedBy(SEED_ACTOR);
        r.setSubmittedBy(SEED_ACTOR);
        r.setSubmittedAt(Instant.now());
        r.setLastTestedAt(Instant.now());
        return rules.save(r);
    }

    private record SeedBand(String severity, Double min, boolean minInc, Double max, boolean maxInc) {}

    private static SeedBand band(String severity, Double min, boolean minInc, Double max, boolean maxInc) {
        return new SeedBand(severity, min, minInc, max, maxInc);
    }

    private void bands(AiMotionRule r, SeedBand... list) {
        int i = 0;
        for (SeedBand b : list) {
            MotionRuleThreshold t = new MotionRuleThreshold();
            t.setRuleId(r.getId());
            t.setSeverity(b.severity());
            t.setMinValue(b.min());
            t.setMinInclusive(b.minInc());
            t.setMaxValue(b.max());
            t.setMaxInclusive(b.maxInc());
            t.setSortOrder(i++);
            thresholds.save(t);
        }
    }

    private void template(ExerciseAiProfile p, String code, String ui, String voice) {
        if (templates.findByFeedbackCodeAndLanguage(code, MotionFeedbackService.DEFAULT_LANGUAGE).isPresent()) return;
        MotionFeedbackTemplate t = new MotionFeedbackTemplate();
        t.setAiProfileId(p.getId());
        t.setFeedbackCode(code);
        t.setLanguage(MotionFeedbackService.DEFAULT_LANGUAGE);
        t.setUiText(ui);
        t.setVoiceText(voice);
        t.setUpdatedBy(SEED_ACTOR);
        templates.save(t);
    }
}
