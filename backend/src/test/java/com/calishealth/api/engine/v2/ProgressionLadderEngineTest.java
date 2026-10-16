package com.calishealth.api.engine.v2;

import com.calishealth.api.engine.v2.progression.ProgressionLadderEngine;
import com.calishealth.api.engine.v2.progression.ProgressionModels.*;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/** Nhóm G2 (ladder) + I19 (thiếu/không tin cậy không phải bằng chứng tiêu cực). */
class ProgressionLadderEngineTest {
    private final ProgressionLadderEngine engine = new ProgressionLadderEngine();

    private static Map<String, Observation> obs(Object... kv) {
        Map<String, Observation> m = new HashMap<>();
        for (int i = 0; i < kv.length; i += 2) {
            Object v = kv[i + 1];
            m.put((String) kv[i], v instanceof Observation o ? o : Observation.measured(((Number) v).doubleValue()));
        }
        return m;
    }

    private StageStatus status(LadderResult r, String stage) {
        return r.stages().stream().filter(s -> s.stage().equals(stage)).findFirst().orElseThrow().status();
    }

    @Test
    void pushUpAndDipPass_pikeFail_highestIsDip() {
        LadderResult r = engine.evaluate(V2TestFixtures.pushLadder(false),
                new LadderInput(obs("push-up", 21, "dips", 4, "pike-push-up", 1), false));
        assertEquals("dips", r.highestStage());
        assertEquals(54.0, r.score(), 1e-9);                 // 50 + 15 * 4/15
        assertEquals(StageStatus.FAIL, status(r, "pike-push-up"));
        assertEquals(EvidenceState.ACHIEVED, r.state());
    }

    @Test
    void allThreePass_highestIsPike_scoreNotAveraged() {
        LadderResult r = engine.evaluate(V2TestFixtures.pushLadder(false),
                new LadderInput(obs("push-up", 21, "dips", 15, "pike-push-up", 3), false));
        assertEquals("pike-push-up", r.highestStage());
        assertEquals(67.0, r.score(), 1e-9);                 // 65 + 10 * 3/15 - KHÔNG phải trung bình của dips (65) và pike
    }

    @Test
    void higherStagePassesButPrerequisiteFails_isRejected() {
        LadderResult r = engine.evaluate(V2TestFixtures.pushLadder(false),
                new LadderInput(obs("incline-push-up", 10, "push-up", 3, "dips", 4), false));
        assertEquals(StageStatus.FAIL, status(r, "push-up"));
        assertEquals(StageStatus.REJECTED_PREREQ, status(r, "dips"));
        assertEquals("incline-push-up", r.highestStage());
        assertEquals(10.0, r.score(), 1e-9);                 // 0 + 20 * 10/20
    }

    @Test
    void bypassPolicyAllowsHigherStageDespiteFailedPrerequisite() {
        LadderResult r = engine.evaluate(V2TestFixtures.pushLadder(true),
                new LadderInput(obs("push-up", 3, "dips", 4), false));
        assertEquals("dips", r.highestStage());
        assertEquals(StageStatus.PASS, status(r, "dips"));
    }

    @Test
    void unaskedPrerequisitesAreInferred_notAsked() {
        LadderResult r = engine.evaluate(V2TestFixtures.pushLadder(false), new LadderInput(obs("dips", 6), false));
        assertEquals("dips", r.highestStage());
        assertEquals(StageStatus.INFERRED_PASS, status(r, "push-up"));
        assertEquals(StageStatus.INFERRED_PASS, status(r, "incline-push-up"));
        assertEquals("INFERRED", r.stages().get(0).origin());
    }

    @Test
    void lowerStageEvidenceIsNeverDropped() {
        LadderResult r = engine.evaluate(V2TestFixtures.pushLadder(false),
                new LadderInput(obs("push-up", 21, "dips", 4, "pike-push-up", 1), false));
        assertEquals(4, r.stages().size());
        assertEquals(21.0, r.stages().get(1).value());
    }

    @Test
    void noDataIsNullNotZero() {
        LadderResult r = engine.evaluate(V2TestFixtures.pushLadder(false), new LadderInput(Map.of(), false));
        assertNull(r.score());
        assertEquals(EvidenceState.NO_EVIDENCE, r.state());
    }

    @Test
    void notTriedIsNotFail() {
        LadderResult r = engine.evaluate(V2TestFixtures.pushLadder(false),
                new LadderInput(obs("incline-push-up", Observation.notTried(), "push-up", Observation.notTried()), false));
        assertEquals(StageStatus.NOT_ASSESSED, status(r, "push-up"));
        assertNull(r.score());
        assertEquals(EvidenceState.NO_EVIDENCE, r.state());
    }

    @Test
    void unreliableMeasurementIsNotFailAndGivesNoScore() {
        LadderResult r = engine.evaluate(V2TestFixtures.pushLadder(false), new LadderInput(obs("push-up", Observation.unreliable()), false));
        assertEquals(StageStatus.UNRELIABLE, status(r, "push-up"));
        assertNull(r.score());
        assertEquals(EvidenceState.UNRELIABLE, r.state());
    }

    @Test
    void failAtLowestStageOrExplicitNoneIsTheOnlyWayToScoreZero() {
        LadderResult failLowest = engine.evaluate(V2TestFixtures.pushLadder(false), new LadderInput(obs("incline-push-up", 0), false));
        assertEquals(0.0, failLowest.score());
        assertEquals(EvidenceState.NONE_ACHIEVED, failLowest.state());

        LadderResult explicitNone = engine.evaluate(V2TestFixtures.pushLadder(false), new LadderInput(Map.of(), true));
        assertEquals(0.0, explicitNone.score());

        // FAIL ở nấc cao KHÔNG suy ra không làm được nấc thấp (I19)
        LadderResult failHigh = engine.evaluate(V2TestFixtures.pushLadder(false), new LadderInput(obs("pike-push-up", 0), false));
        assertNull(failHigh.score());
    }
}
