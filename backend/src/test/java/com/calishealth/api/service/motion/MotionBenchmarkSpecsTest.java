package com.calishealth.api.service.motion;

import com.calishealth.api.engine.motion.MotionRuleEngine;
import com.calishealth.api.engine.motion.MotionRuleValidator;
import com.calishealth.api.engine.motion.MotionTypes.*;
import com.calishealth.api.service.motion.MotionBenchmarkSpecs.ExerciseSpec;
import com.calishealth.api.service.motion.MotionBenchmarkSpecs.RuleSpec;
import org.junit.jupiter.api.Test;

import java.util.*;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Kiểm tra CƠ HỌC của bản nháp rule L0-L3: cấu hình hợp lệ theo validator của engine, mã không trùng, và ngưỡng đếm rep/giữ nhất quán
 * (đủ biên độ thì đếm đúng, nông thì không đếm hợp lệ, giữ đúng tư thế thì tính thời gian). KHÔNG chứng minh ngưỡng đúng sinh học
 * với người thật - việc đó cần video thật và Coach.
 */
class MotionBenchmarkSpecsTest {
    private static final Set<String> REPS_PHASES = Set.of("SETUP", "TOP", "DESCENDING", "BOTTOM", "ASCENDING");
    private static final Set<String> HOLD_PHASES = Set.of("SETUP", "HOLD");

    private static ProfileDef profile(ExerciseSpec s) {
        return new ProfileDef(1, "1.0", s.cameraView(), s.movementType(), s.repMetric(), s.repTop(), s.repBottom(), s.repDirection(),
                s.debounceMs(), s.minRepMs(), s.maxRepMs() == 0 ? 10_000 : s.maxRepMs(), 0.5, 0.5, Map.of());
    }

    /** Khung có góc (a-b-c của repMetric) = angle độ; các landmark khác ở giữa khung, mọi visibility = 0.9. */
    private static PoseFrame frame(ExerciseSpec s, long t, double angle) {
        List<Landmark> lm = new ArrayList<>();
        for (int i = 0; i < 33; i++) lm.add(new Landmark(0.5, 0.5, 0, 0.9));
        double rad = Math.toRadians(angle);
        lm.set(s.repPoints().get(0), new Landmark(0.5, 0.3, 0, 0.9));
        lm.set(s.repPoints().get(1), new Landmark(0.5, 0.5, 0, 0.9));
        lm.set(s.repPoints().get(2), new Landmark(0.5 + 0.2 * Math.sin(rad), 0.5 - 0.2 * Math.cos(rad), 0, 0.9));
        return new PoseFrame(t, lm, 1.0);
    }

    @Test
    void everyRuleIsValidAndCodesAreUnique() {
        Set<String> codes = new HashSet<>();
        for (ExerciseSpec s : MotionBenchmarkSpecs.all()) {
            Set<String> phases = "HOLD".equals(s.movementType()) ? HOLD_PHASES : REPS_PHASES;
            assertFalse(s.rules().isEmpty(), s.exerciseCode());
            for (RuleSpec r : s.rules()) {
                MotionRuleValidator.Result res = MotionRuleValidator.validate(r.toRuleDef(1), phases, true);
                assertTrue(res.valid(), s.exerciseCode() + "/" + r.code() + ": " + res.errors());
                assertTrue(codes.add(r.code()), "trùng mã rule/feedback: " + r.code());
                assertFalse(r.uiText().isBlank(), r.code());
            }
        }
        assertTrue(codes.size() >= 30, "kỳ vọng ≥ 30 rule, có " + codes.size());
    }

    @Test
    void coversTheMandatoryExercisesOnTheL0toL3Path() {
        Set<String> covered = MotionBenchmarkSpecs.all().stream().map(ExerciseSpec::exerciseCode).collect(Collectors.toSet());
        // mandatory & levelMin ≤ 3 trong bộ PA2 (trừ push-up đã có bộ tham chiếu riêng), cộng bài nền assisted-squat
        for (String code : List.of("incline-push-up", "dips", "pull-up", "australian-pull-up", "bodyweight-squat", "bulgarian-split-squat",
                "shrimp-squat", "dead-hang", "plank", "hollow-body-hold", "l-sit", "assisted-squat"))
            assertTrue(covered.contains(code), "thiếu " + code);
    }

    @Test
    void coversTheAdvancedAndSkillExercisesToo() {
        Set<String> covered = MotionBenchmarkSpecs.all().stream().map(ExerciseSpec::exerciseCode).collect(Collectors.toSet());
        for (String code : List.of("muscle-up", "handstand-push-up", "chest-to-bar-pull-up", "pseudo-planche-push-up", "pistol-squat", "hanging-leg-raise",
                "wall-pike-hold", "crow-pose", "chest-to-wall-handstand", "handstand"))
            assertTrue(covered.contains(code), "thiếu " + code);
        assertEquals(22, covered.size(), "12 bài đợt 1 + 10 bài đợt 2");
    }

    @Test
    void repExercises_countFullRepsAndIgnoreShallowOnes() {
        for (ExerciseSpec s : MotionBenchmarkSpecs.all()) {
            if (!"REPS".equals(s.movementType())) continue;
            double hi = s.repTop() + 8, lo = s.repBottom() - 5, mid = (s.repTop() + s.repBottom()) / 2;
            // không rule: chỉ ngưỡng đếm rep -> 3 rep đủ biên độ đều hợp lệ
            MotionRuleEngine engine = new MotionRuleEngine(profile(s), List.of(), s.cameraView(), true);
            long t = 0;
            for (int rep = 0; rep < 3; rep++) t = cycle(engine, s, t, hi, lo);
            assertEquals(3, engine.summary().totalReps(), s.exerciseCode() + ": 3 rep đủ biên độ phải đếm được 3");
            assertEquals(3, engine.summary().validReps(), s.exerciseCode());

            // nông (chỉ tới giữa): không có rep hợp lệ nào
            MotionRuleEngine shallow = new MotionRuleEngine(profile(s), List.of(), s.cameraView(), true);
            long u = 0;
            for (int rep = 0; rep < 3; rep++) u = cycle(shallow, s, u, hi, mid + 5);
            assertEquals(0, shallow.summary().validReps(), s.exerciseCode() + ": rep nông không được tính hợp lệ");

            // có đủ rule DRAFT chạy ở chế độ thử: vẫn đếm đủ số rep (rule chỉ đổi tính hợp lệ, không làm mất rep)
            List<RuleDef> defs = new ArrayList<>();
            long id = 1;
            for (RuleSpec r : s.rules()) defs.add(r.toRuleDef(id++));
            MotionRuleEngine withRules = new MotionRuleEngine(profile(s), defs, s.cameraView(), true);
            long v = 0;
            for (int rep = 0; rep < 3; rep++) v = cycle(withRules, s, v, hi, lo);
            assertEquals(3, withRules.summary().totalReps(), s.exerciseCode() + " (kèm rule)");
        }
    }

    @Test
    void holdExercises_countTimeOnlyInsideTheHoldRange() {
        for (ExerciseSpec s : MotionBenchmarkSpecs.all()) {
            if (!"HOLD".equals(s.movementType())) continue;
            double inside = (s.repBottom() + Math.min(s.repTop(), 180)) / 2;
            MotionRuleEngine engine = new MotionRuleEngine(profile(s), List.of(), s.cameraView(), true);
            for (int i = 0; i <= 30; i++) engine.process(frame(s, i * 100L, inside));
            assertEquals(3.0, engine.summary().holdSec(), 0.15, s.exerciseCode() + ": giữ trong dải phải tính 3 giây");

            double outside = s.repBottom() - 25;
            MotionRuleEngine out = new MotionRuleEngine(profile(s), List.of(), s.cameraView(), true);
            for (int i = 0; i <= 30; i++) out.process(frame(s, i * 100L, outside));
            assertEquals(0.0, out.summary().holdSec(), 0.01, s.exerciseCode() + ": ngoài dải không tính giữ");
        }
    }

    /** Một chu kỳ: đỉnh -> đáy -> đỉnh, mỗi bước 250 ms (đủ dài hơn minRepMs của mọi bài). Trả thời điểm kế tiếp. */
    private static long cycle(MotionRuleEngine engine, ExerciseSpec s, long t0, double hi, double lo) {
        double[] seq = {hi, hi, (hi * 2 + lo) / 3, (hi + lo * 2) / 3, lo, lo, (hi + lo * 2) / 3, (hi * 2 + lo) / 3, hi, hi};
        long t = t0;
        for (double a : seq) { engine.process(frame(s, t, a)); t += 250; }
        return t + 500;
    }
}
