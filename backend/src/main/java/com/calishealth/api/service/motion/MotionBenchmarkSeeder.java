package com.calishealth.api.service.motion;

import com.calishealth.api.dto.MotionDtos.MeasurementDto;
import com.calishealth.api.engine.motion.MotionTypes.Band;
import com.calishealth.api.entity.*;
import com.calishealth.api.repository.*;
import com.calishealth.api.service.motion.MotionBenchmarkSpecs.ExerciseSpec;
import com.calishealth.api.service.motion.MotionBenchmarkSpecs.RuleSpec;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;


/**
 * Nạp bản NHÁP rule chấm form cho các bài đường Baseline L0-L3 (MotionBenchmarkSpecs). Chỉ chạy khi bật rõ ràng
 * app.seed.motion-benchmarks=true (ghi dữ liệu, tách khỏi app.seed.enabled). Idempotent:
 *  - profile đã có movementType (đã cấu hình) thì KHÔNG đụng cấu hình đếm rep/giữ;
 *  - rule đã tồn tại (cùng mã) thì bỏ qua.
 * Rule ở trạng thái DRAFT, chưa kiểm thử (lastTestedAt rỗng): phải qua Rule Tester -> gửi duyệt -> xuất bản mới chạy thật.
 */
@Component
@ConditionalOnProperty(name = "app.seed.motion-benchmarks", havingValue = "true")
@Order(40)
public class MotionBenchmarkSeeder implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(MotionBenchmarkSeeder.class);
    static final String ACTOR = "system-seed-benchmark";

    private final AiMotionRuleRepository rules;
    private final ExerciseAiProfileRepository profiles;
    private final ExerciseRepository exercises;
    private final MotionRuleThresholdRepository thresholds;
    private final MotionFeedbackTemplateRepository templates;
    private final MotionConfigService config;
    private final MotionRuleMapper mapper;
    private final TransactionTemplate tx;

    public MotionBenchmarkSeeder(AiMotionRuleRepository rules, ExerciseAiProfileRepository profiles, ExerciseRepository exercises,
                                 MotionRuleThresholdRepository thresholds, MotionFeedbackTemplateRepository templates,
                                 MotionConfigService config, MotionRuleMapper mapper, TransactionTemplate tx) {
        this.rules = rules; this.profiles = profiles; this.exercises = exercises; this.thresholds = thresholds;
        this.templates = templates; this.config = config; this.mapper = mapper; this.tx = tx;
    }

    @Override
    public void run(String... args) {
        int created = 0;
        for (ExerciseSpec spec : MotionBenchmarkSpecs.all()) {
            try {
                Integer n = tx.execute(s -> seed(spec));
                created += n == null ? 0 : n;
            } catch (RuntimeException e) {
                log.error("Motion benchmark: bỏ qua {} do lỗi: {}", spec.exerciseCode(), e.getMessage(), e);
            }
        }
        log.info("Motion benchmark: đã tạo {} rule DRAFT", created);
    }

    /** Trả về số rule mới tạo cho bài này. */
    int seed(ExerciseSpec spec) {
        Exercise ex = exercises.findByCode(spec.exerciseCode()).orElse(null);
        if (ex == null) { log.warn("Motion benchmark: không có bài tập {}", spec.exerciseCode()); return 0; }
        ExerciseAiProfile p = profiles.findByExerciseIdAndStatus(ex.getId(), "ACTIVE")
                .or(() -> profiles.findFirstByExerciseIdOrderByCreatedAtDesc(ex.getId())).orElse(null);
        if (p == null) { log.warn("Motion benchmark: bài {} chưa có motion profile", spec.exerciseCode()); return 0; }

        if (p.getMovementType() == null) {                    // chỉ cấu hình khi profile chưa được ai cấu hình
            p.setCameraView(spec.cameraView());
            p.setMovementType(spec.movementType());
            p.setRepMetricJson(mapper.writeMeasurement(new MeasurementDto(spec.repPoints(), null, null, null, null, null)));
            p.setRepTopThreshold(spec.repTop());
            p.setRepBottomThreshold(spec.repBottom());
            p.setRepDirection(spec.repDirection());
            if ("REPS".equals(spec.movementType())) {
                p.setMinRepDurationMs((int) spec.minRepMs());
                p.setMaxRepDurationMs((int) spec.maxRepMs());
                p.setDebounceTimeMs((int) spec.debounceMs());
            }
            if (p.getMinPoseConfidence() == null) p.setMinPoseConfidence(0.5);
            if (p.getMinLandmarkVisibility() == null) p.setMinLandmarkVisibility(0.5);
            profiles.save(p);
        }
        config.profile(p.getId());                            // tạo pha còn thiếu

        int created = 0;
        for (RuleSpec r : spec.rules()) {
            if (!rules.findByAiProfileIdAndRuleCodeOrderByRuleVersionDesc(p.getId(), r.code()).isEmpty()) continue;
            template(p, r);
            AiMotionRule saved = rules.save(entity(p, r, spec));
            int i = 0;
            for (Band b : r.bands()) {
                MotionRuleThreshold t = new MotionRuleThreshold();
                t.setRuleId(saved.getId());
                t.setSeverity(b.severity().name());
                t.setMinValue(b.min());
                t.setMinInclusive(b.minInclusive());
                t.setMaxValue(b.max());
                t.setMaxInclusive(b.maxInclusive());
                t.setSortOrder(i++);
                thresholds.save(t);
            }
            created++;
        }
        if (created > 0) log.info("Motion benchmark: {} - tạo {} rule DRAFT", spec.exerciseCode(), created);
        return created;
    }

    private AiMotionRule entity(ExerciseAiProfile p, RuleSpec s, ExerciseSpec spec) {
        AiMotionRule r = new AiMotionRule();
        r.setAiProfile(p);
        r.setRuleCode(s.code());
        r.setRuleName(s.name());
        r.setRuleType("FORM_CHECK");
        r.setPhaseCode(s.phase());
        r.setMetricType(s.metric().name());
        r.setMeasurementJson(mapper.writeMeasurement(new MeasurementDto(s.points(), null, s.method(), null, s.phaseArg(), null)));
        r.setUnit(s.unit());
        r.setOperator(s.operator().name());
        r.setTargetValue(s.target());
        r.setNormalMin(s.normalMin());
        r.setNormalMax(s.normalMax());
        r.setNormalMinInclusive(true);
        r.setNormalMaxInclusive(true);
        r.setThresholdMin(s.normalMin());
        r.setThresholdMax(s.normalMax());
        r.setSeverity(s.severity().name());
        r.setPriority(s.priority());
        r.setInvalidRep(s.invalidRep());
        r.setStopExercise(false);
        r.setPersistenceType(s.persistenceType().name());
        r.setPersistenceValue(s.persistence());
        r.setCooldownMs(s.cooldownMs());
        r.setEvaluationIntervalMs(0L);
        r.setFeedbackCode(s.code());
        r.setCameraView(s.camera());
        r.setEnabled(true);
        r.setRuleVersion(1);
        r.setStatus(MotionConfigService.DRAFT);
        r.setSourceType("COACHING_BENCHMARK");
        r.setSourceReference(MotionBenchmarkSpecs.SOURCE_REFERENCE);
        r.setChangeNote("Bản nháp kỹ thuật cho " + spec.exerciseCode() + ": " + spec.note() + " CHƯA kiểm thử trên video thật, chờ Coach chỉnh và chạy Rule Tester.");
        r.setCreatedBy(ACTOR);
        r.setUpdatedBy(ACTOR);
        return r;
    }

    private void template(ExerciseAiProfile p, RuleSpec r) {
        if (templates.findByFeedbackCodeAndLanguage(r.code(), MotionFeedbackService.DEFAULT_LANGUAGE).isPresent()) return;
        MotionFeedbackTemplate t = new MotionFeedbackTemplate();
        t.setAiProfileId(p.getId());
        t.setFeedbackCode(r.code());
        t.setLanguage(MotionFeedbackService.DEFAULT_LANGUAGE);
        t.setUiText(r.uiText());
        t.setVoiceText(r.voiceText());
        t.setUpdatedBy(ACTOR);
        templates.save(t);
    }

}
