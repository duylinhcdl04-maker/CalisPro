package com.calishealth.api.engine.v2.level;

import com.calishealth.api.engine.v2.level.TrainingStabilityEvaluator.*;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class TrainingStabilityEvaluatorTest {
    private final TrainingStabilityEvaluator ev = new TrainingStabilityEvaluator();
    private final Instant now = Instant.parse("2026-10-09T00:00:00Z");

    private Obs obs(String ex, int daysAgo, double value, Double form) { return new Obs(ex, now.minus(Duration.ofDays(daysAgo)), value, form); }

    private Result run(List<Req> reqs, List<Obs> o) { return ev.evaluate(reqs, o, now, 21, 4, 3, 75); }

    @Test void noMandatoryRequirement_isPass() {
        assertEquals(Verdict.PASS, run(List.of(), List.of()).verdict());
    }

    @Test void threeOfLastFourQualifying_isPass() {
        Result r = run(List.of(new Req("pull-up", 12, 15.0, Set.of())),
                List.of(obs("pull-up", 1, 13, 80.0), obs("pull-up", 3, 12, 78.0), obs("pull-up", 5, 6, 90.0), obs("pull-up", 7, 14, 76.0)));
        assertEquals(Verdict.PASS, r.verdict());
        assertEquals(3, r.qualifying());
    }

    @Test void enoughSessionsButTwoOfFour_isFail() {
        Result r = run(List.of(new Req("pull-up", 12, 15.0, Set.of())),
                List.of(obs("pull-up", 1, 13, 80.0), obs("pull-up", 3, 12, 78.0), obs("pull-up", 5, 6, 90.0), obs("pull-up", 7, 8, 90.0)));
        assertEquals(Verdict.FAIL, r.verdict());
    }

    @Test void tooFewSessions_isInsufficientNotFail() {
        Result r = run(List.of(new Req("pull-up", 12, 15.0, Set.of())), List.of(obs("pull-up", 1, 13, 80.0), obs("pull-up", 3, 12, 78.0)));
        assertEquals(Verdict.INSUFFICIENT, r.verdict());
        assertEquals("TRAINING_LOG_TOO_FEW_SESSIONS", r.reasonCode());
        assertEquals(Verdict.INSUFFICIENT, run(List.of(new Req("pull-up", 12, 15.0, Set.of())), List.of()).verdict());
    }

    @Test void formBelowThresholdOrMissing_doesNotQualify() {
        Result r = run(List.of(new Req("pull-up", 12, 15.0, Set.of())),
                List.of(obs("pull-up", 1, 20, 60.0), obs("pull-up", 2, 20, null), obs("pull-up", 3, 20, 74.9), obs("pull-up", 4, 20, 75.0)));
        assertEquals(1, r.qualifying());
        assertEquals(Verdict.FAIL, r.verdict());
    }

    @Test void onlyTheLastFourInsideTheWindowCount() {
        Result r = run(List.of(new Req("dips", 15, 20.0, Set.of())),
                List.of(obs("dips", 1, 5, 90.0), obs("dips", 2, 5, 90.0), obs("dips", 3, 5, 90.0), obs("dips", 4, 5, 90.0),   // 4 buổi gần nhất: không đạt
                        obs("dips", 10, 20, 90.0), obs("dips", 11, 20, 90.0), obs("dips", 12, 20, 90.0),                      // cũ hơn: bị cắt bởi lastN
                        obs("dips", 40, 20, 90.0)));                                                                        // ngoài cửa sổ
        assertEquals(0, r.qualifying());
        assertEquals(Verdict.FAIL, r.verdict());
    }

    @Test void aHarderExerciseOfTheSameLadder_countsWithAtLeastOneRep() {
        Result r = run(List.of(new Req("pull-up", 12, 15.0, Set.of("chest-to-bar-pull-up", "muscle-up"))),
                List.of(obs("muscle-up", 1, 1, 90.0), obs("chest-to-bar-pull-up", 2, 3, 85.0), obs("pull-up", 3, 12, 80.0), obs("muscle-up", 4, 0, 90.0)));
        assertEquals(3, r.qualifying());                   // muscle-up 0 rep không tính
        assertEquals(Verdict.PASS, r.verdict());
    }

    @Test void theBottleneckIsTheLowestRatio_andTiesAreAllChecked() {
        Req strong = new Req("pull-up", 12, 24.0, Set.of());     // ratio 2
        Req weak = new Req("dips", 15, 16.0, Set.of());          // ratio 1.07: nút cổ chai
        List<Obs> onlyPullUps = List.of(obs("pull-up", 1, 20, 90.0), obs("pull-up", 2, 20, 90.0), obs("pull-up", 3, 20, 90.0), obs("pull-up", 4, 20, 90.0));
        Result r = run(List.of(strong, weak), onlyPullUps);
        assertEquals(List.of("dips"), r.bottlenecks());
        assertNotEquals(Verdict.PASS, r.verdict(), "buổi tập bài mạnh không thay được bài nút cổ chai");

        Req tie = new Req("pull-up", 12, 12.0, Set.of()), tie2 = new Req("dips", 15, 15.0, Set.of());   // cùng ratio 1
        Result t = run(List.of(tie, tie2), onlyPullUps);
        assertEquals(2, t.bottlenecks().size());
        assertNotEquals(Verdict.PASS, t.verdict(), "hoà thì cả hai phải đạt");
    }

    @Test void unmeasuredRequirementCountsAsTheBottleneck() {
        Result r = run(List.of(new Req("pull-up", 12, 30.0, Set.of()), new Req("dips", 15, null, Set.of())), List.of());
        assertEquals(List.of("dips"), r.bottlenecks());
        assertEquals(Verdict.INSUFFICIENT, r.verdict());
    }
}
