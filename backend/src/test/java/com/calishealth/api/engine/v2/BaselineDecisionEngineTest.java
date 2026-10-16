package com.calishealth.api.engine.v2;

import com.calishealth.api.engine.v2.level.BaselineDecisionEngine;
import com.calishealth.api.engine.v2.level.LevelModelsV2.*;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/** Nhóm G7 (fast-track) + G8 (stability/level của Baseline) + I8/I19 (đo không tin cậy ⇒ RETEST, thiếu ⇒ INCOMPLETE). */
class BaselineDecisionEngineTest {
    private final BaselineDecisionEngine engine = new BaselineDecisionEngine();
    private static final Attempt OK = new Attempt(AttemptStatus.VALID, true);
    private static final Attempt BELOW = new Attempt(AttemptStatus.VALID, false);
    private static final Attempt BAD = new Attempt(AttemptStatus.INVALID_MEASUREMENT, false);
    private static final Attempt ABORT = new Attempt(AttemptStatus.USER_ABORTED, false);
    private static final Attempt MISSING = new Attempt(AttemptStatus.NOT_DONE, false);

    private static LevelEvidence ev(int rank, List<Attempt> attempts) {
        return new LevelEvidence(rank, attempts, GateStatus.PASS, GateStatus.PASS, GateStatus.PASS, GateStatus.PASS);
    }

    private static LevelEvidence ev(int rank, List<Attempt> attempts, GateStatus overall, GateStatus competency, GateStatus skill, GateStatus reliability) {
        return new LevelEvidence(rank, attempts, overall, competency, skill, reliability);
    }

    private static List<Attempt> two() { return List.of(OK, OK); }

    private BaselineResult run(int provisional, List<LevelEvidence> levels) {
        return engine.decide(new BaselineInput(provisional, true, levels), V2TestFixtures.params());
    }

    @Test
    void provisionalL2_allGatesL4Pass_isL3VerifiedWithL4AwaitingCoach() {
        BaselineResult r = run(2, List.of(ev(1, List.of(OK)), ev(2, two()), ev(3, two()), ev(4, two())));
        assertEquals(BaselineOutcome.VERIFIED, r.outcome());
        assertEquals(3, r.finalRank());                                          // camera không tự xác minh L4
        assertEquals(4, r.pendingCoachRank());
        assertEquals("L4_AWAITING_COACH_VERIFICATION", r.reasonCode());
        assertEquals(Decision.PROMOTED, r.decision());
        assertTrue(r.fastTrackConsumed());
    }

    @Test
    void l4WithoutCoachRequirement_isVerifiedByCamera() {
        RuleParams noCoach = V2TestFixtures.params("level.L4.requiresCoachVerified", 0);
        BaselineResult r = engine.decide(new BaselineInput(2, true, List.of(ev(1, List.of(OK)), ev(2, two()), ev(3, two()), ev(4, two()))), noCoach);
        assertEquals(4, r.finalRank());
        assertNull(r.pendingCoachRank());
    }

    @Test
    void failingL4_hasNoPendingCoachFlag() {
        BaselineResult r = run(2, List.of(ev(1, List.of(OK)), ev(2, two()), ev(3, two()), ev(4, List.of(BELOW))));
        assertEquals(3, r.finalRank());
        assertNull(r.pendingCoachRank());
    }

    @Test
    void l4PendingCoach_isNeverANegativeOrRegression() {
        BaselineResult r = run(3, List.of(ev(1, List.of(OK)), ev(2, two()), ev(3, two()), ev(4, two())));
        assertEquals(3, r.finalRank());
        assertEquals(Decision.MAINTAINED, r.decision());                         // provisional 3 → vẫn 3, không REGRESSED
        assertEquals(4, r.pendingCoachRank());
    }

    @Test
    void provisionalL2_failsAtL4_isL3Verified() {
        BaselineResult r = run(2, List.of(ev(1, List.of(OK)), ev(2, two()), ev(3, two()), ev(4, List.of(BELOW, OK))));
        assertEquals(3, r.finalRank());
        assertEquals(Decision.PROMOTED, r.decision());
        assertEquals(GateStatus.FAIL, r.stabilityByLevel().get(4));
    }

    @Test
    void provisionalL2_onlyL1Passes_isL1Verified_regressed() {
        BaselineResult r = run(2, List.of(ev(1, List.of(OK)), ev(2, List.of(OK, BELOW))));
        assertEquals(BaselineOutcome.VERIFIED, r.outcome());
        assertEquals(1, r.finalRank());
        assertEquals(Decision.REGRESSED, r.decision());
        assertEquals("BASELINE_RECALIBRATION", r.reasonCode());
        assertEquals(GateStatus.FAIL, r.stabilityByLevel().get(2));          // attempt 2 tin cậy nhưng không đạt => Stability FAIL
    }

    @Test
    void reliableFailAtL1_isL0Verified() {
        BaselineResult r = run(2, List.of(ev(1, List.of(BELOW))));
        assertEquals(0, r.finalRank());
        assertEquals(Decision.REGRESSED, r.decision());
    }

    @Test
    void unreliableSecondAttempt_isRetestRequired_notL1() {
        BaselineResult r = run(2, List.of(ev(1, List.of(OK)), ev(2, List.of(OK, BAD))));
        assertEquals(BaselineOutcome.RETEST_REQUIRED, r.outcome());
        assertNull(r.finalRank());
        assertNull(r.decision());
        assertFalse(r.fastTrackConsumed());
    }

    @Test
    void userAbortedIsRetest_notFail() {
        BaselineResult r = run(2, List.of(ev(1, List.of(ABORT))));
        assertEquals(BaselineOutcome.RETEST_REQUIRED, r.outcome());
        assertFalse(r.fastTrackConsumed());
    }

    @Test
    void missingSecondAttempt_isIncomplete_notL1() {
        BaselineResult r = run(2, List.of(ev(1, List.of(OK)), ev(2, List.of(OK))));
        assertEquals(BaselineOutcome.INCOMPLETE, r.outcome());
        assertNull(r.finalRank());
        assertFalse(r.fastTrackConsumed());
        assertEquals(BaselineOutcome.INCOMPLETE, run(2, List.of(ev(1, List.of(OK)), ev(2, List.of(OK, MISSING)))).outcome());
    }

    @Test
    void aReliableFailingAttemptConcludesTheLevel_withoutDemandingTheSecondAttempt() {
        BaselineResult r = run(2, List.of(ev(1, List.of(OK)), ev(2, List.of(BELOW))));
        assertEquals(BaselineOutcome.VERIFIED, r.outcome());
        assertEquals(1, r.finalRank());
        assertEquals(GateStatus.FAIL, r.stabilityByLevel().get(2));
        assertEquals(1, run(2, List.of(ev(1, List.of(OK)), ev(2, List.of(BELOW, MISSING)))).finalRank());
    }

    @Test
    void stoppingAfterPassingLowerLevels_isIncompleteNotFinalized() {
        BaselineResult r = run(2, List.of(ev(1, List.of(OK)), ev(2, two())));
        assertEquals(BaselineOutcome.INCOMPLETE, r.outcome());
        assertEquals("NEXT_LEVEL_NOT_TESTED", r.reasonCode());
    }

    @Test
    void attemptFloor_cannotBeLoweredByRuleSet() {
        RuleParams below = V2TestFixtures.params("baseline.attempts.L2", 1);
        BaselineResult r = engine.decide(new BaselineInput(2, true, List.of(ev(1, List.of(OK)), ev(2, List.of(OK)))), below);
        assertEquals(BaselineOutcome.INCOMPLETE, r.outcome());                   // vẫn đòi 2 attempt (sàn bất biến)
        assertEquals(2, engine.attemptsRequired(2, below));
        assertEquals(1, engine.attemptsRequired(1, below));
        assertEquals(3, engine.attemptsRequired(3, V2TestFixtures.params("baseline.attempts.L3", 3)));   // được phép cao hơn sàn
    }

    @Test
    void anyGateFailingBlocksTheLevel_noGateIsBypassed() {
        for (int gate = 0; gate < 3; gate++) {
            GateStatus[] g = {GateStatus.PASS, GateStatus.PASS, GateStatus.PASS};
            g[gate] = GateStatus.FAIL;
            BaselineResult r = run(2, List.of(ev(1, List.of(OK)), ev(2, two()), ev(3, two(), g[0], g[1], g[2], GateStatus.PASS)));
            assertEquals(2, r.finalRank(), "gate #" + gate);
            assertEquals(Decision.MAINTAINED, r.decision());
        }
    }

    @Test
    void insufficientEvidenceGate_isIncomplete_notFail() {
        BaselineResult r = run(2, List.of(ev(1, List.of(OK)), ev(2, two(), GateStatus.PASS, GateStatus.INSUFFICIENT_EVIDENCE, GateStatus.PASS, GateStatus.PASS)));
        assertEquals(BaselineOutcome.INCOMPLETE, r.outcome());
    }

    @Test
    void unreliableOrFailingReliabilityGate_isRetest() {
        assertEquals(BaselineOutcome.RETEST_REQUIRED,
                run(2, List.of(ev(1, List.of(OK), GateStatus.PASS, GateStatus.PASS, GateStatus.PASS, GateStatus.FAIL))).outcome());
        assertEquals(BaselineOutcome.RETEST_REQUIRED,
                run(2, List.of(ev(1, List.of(OK), GateStatus.PASS, GateStatus.UNRELIABLE, GateStatus.PASS, GateStatus.PASS))).outcome());
    }

    @Test
    void selfReportedSkillIsNotMeasuredEvidenceForPeriodic() {
        BaselineResult r = run(2, List.of(ev(1, List.of(OK)), ev(2, two(), GateStatus.PASS, GateStatus.PASS, GateStatus.PASS_SELF_REPORTED, GateStatus.PASS)));
        assertEquals(BaselineOutcome.INCOMPLETE, r.outcome());
    }

    @Test
    void fastTrackHasNoMarginOrReliabilityThresholdParameters() {
        // Tham số cũ fastTrack.margin / fastTrack.minReliability không tồn tại trong rule set V2: engine vẫn chạy bình thường
        assertFalse(V2TestFixtures.baseParams().containsKey("fastTrack.margin"));
        assertFalse(V2TestFixtures.baseParams().containsKey("fastTrack.minReliability"));
        assertEquals(BaselineOutcome.VERIFIED, run(2, List.of(ev(1, List.of(OK)), ev(2, two()), ev(3, two()), ev(4, two()))).outcome());
    }

    @Test
    void fastTrackDisabled_restoresStepLimit() {
        RuleParams off = V2TestFixtures.params("fast_track.enabled", 0);
        BaselineResult r = engine.decide(new BaselineInput(2, true, List.of(ev(1, List.of(OK)), ev(2, two()), ev(3, two()), ev(4, two()))), off);
        assertEquals(3, r.finalRank());                                          // provisional 2 + max_promotion_step 1
    }

    @Test
    void onlyForTheFirstBaseline() {
        assertThrows(IllegalArgumentException.class, () -> engine.decide(new BaselineInput(2, false, List.of(ev(1, List.of(OK)))), V2TestFixtures.params()));
    }

    // ------------------------------------------------------------------ kết thúc sớm (không có dụng cụ / dừng giữa chừng)

    private BaselineResult early(int provisional, List<LevelEvidence> levels) {
        return engine.decideEarly(new BaselineInput(provisional, true, levels), V2TestFixtures.params());
    }

    @Test
    void earlyFinish_confirmsTheHighestFullyEvidencedLevel_asPartialEvidence() {
        BaselineResult r = early(1, List.of(ev(1, List.of(OK)), ev(2, List.of(OK, MISSING))));
        assertEquals(BaselineOutcome.VERIFIED, r.outcome());
        assertEquals(1, r.finalRank());
        assertEquals("PARTIAL_EVIDENCE", r.reasonCode());
        assertEquals(Decision.MAINTAINED, r.decision());
        assertTrue(r.fastTrackConsumed());
    }

    @Test
    void earlyFinish_aMissingOrUnreliableNextLevel_isNotARetestAndNotAFail() {
        assertEquals(2, early(1, List.of(ev(1, List.of(OK)), ev(2, two()), ev(3, List.of(BAD, MISSING)))).finalRank());
        assertEquals(2, early(1, List.of(ev(1, List.of(OK)), ev(2, two()), ev(3, List.of(ABORT, MISSING)))).finalRank());
        assertEquals(2, early(2, List.of(ev(1, List.of(OK)), ev(2, two()))).finalRank(), "đã đạt hết bằng chứng hiện có, chưa thử level kế");
        assertEquals("PARTIAL_EVIDENCE", early(1, List.of(ev(1, List.of(OK)), ev(2, two()))).reasonCode());
    }

    @Test
    void earlyFinish_withNothingEvidenced_cannotFinish() {
        BaselineResult r = early(2, List.of(ev(1, List.of(MISSING)), ev(2, List.of(MISSING, MISSING))));
        assertEquals(BaselineOutcome.INCOMPLETE, r.outcome());
        assertEquals("NO_EVIDENCE_FOR_EARLY_FINISH", r.reasonCode());
        assertEquals(BaselineOutcome.INCOMPLETE, early(2, List.of(ev(1, List.of(BAD)))).outcome());
    }

    @Test
    void earlyFinish_neverLowersTheProvisionalLevelOnMissingData() {
        // tự khai L2 nhưng mới đủ bằng chứng tới L1: thiếu dữ liệu không phải lý do để hạ xuống L1
        BaselineResult r = early(2, List.of(ev(1, List.of(OK)), ev(2, List.of(OK, MISSING))));
        assertEquals(BaselineOutcome.INCOMPLETE, r.outcome());
        assertEquals("PARTIAL_EVIDENCE_BELOW_PROVISIONAL", r.reasonCode());
        assertNull(r.finalRank());
    }

    @Test
    void earlyFinish_aGenuineFailIsStillAFailAndKeepsItsOwnReason() {
        BaselineResult r = early(1, List.of(ev(1, List.of(OK)), ev(2, List.of(BELOW))));
        assertEquals(BaselineOutcome.VERIFIED, r.outcome());
        assertEquals(1, r.finalRank());
        assertNotEquals("PARTIAL_EVIDENCE", r.reasonCode(), "đủ bằng chứng và không đạt là kết luận thật, không phải dữ liệu một phần");
    }

    @Test
    void earlyFinish_cannotCrossTheCoachGate_andFullEvidenceBehavesLikeTheNormalDecision() {
        List<LevelEvidence> all = List.of(ev(1, List.of(OK)), ev(2, two()), ev(3, two()), ev(4, two()));
        BaselineResult early = early(2, all), normal = run(2, all);
        assertEquals(normal.finalRank(), early.finalRank());
        assertEquals(normal.pendingCoachRank(), early.pendingCoachRank());
        assertEquals(3, early.finalRank());
    }
}
