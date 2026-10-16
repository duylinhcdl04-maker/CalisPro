package com.calishealth.api.engine.v2;

import com.calishealth.api.engine.v2.level.LevelModelsV2.*;
import com.calishealth.api.engine.v2.level.PeriodicDecisionEngine;
import com.calishealth.api.engine.v2.level.PeriodicModels.*;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/** Hysteresis + regression theo xu hướng của Periodic thường kỳ; I19: không tin cậy/thiếu ⇒ không đổi level, EWMA, chuỗi suy giảm. */
class PeriodicDecisionEngineTest {
    private final PeriodicDecisionEngine engine = new PeriodicDecisionEngine();
    private static final GateStatus P = GateStatus.PASS;
    private static final TargetGates ALL_PASS = new TargetGates(P, P, P, P, P);

    private static final List<PeriodicLevel> LEVELS = List.of(
            new PeriodicLevel(0, "L0", 0, 0, List.of()),
            new PeriodicLevel(1, "L1", 25, 17, List.of(new CompetencyReq("PUSH", 20))),
            new PeriodicLevel(2, "L2", 50, 42, List.of(new CompetencyReq("PUSH", 45), new CompetencyReq("PULL", 40))),
            new PeriodicLevel(3, "L3", 72, 64, List.of(new CompetencyReq("PUSH", 65))),
            new PeriodicLevel(4, "L4", 88, 80, List.of(new CompetencyReq("PUSH", 80))));

    private static PeriodicInput in(int rank, Double overall, Double prevEwma, int streak) {
        return new PeriodicInput(rank, UserLevelStatus.VERIFIED, overall, GateStatus.PASS, Map.of("PUSH", 60.0, "PULL", 60.0),
                prevEwma, streak, false, false, LEVELS, Map.of(rank + 1, ALL_PASS, rank + 2, ALL_PASS));
    }

    private static PeriodicInput custom(UserLevelStatus st, Double overall, GateStatus rel, Map<String, Double> comps, Double ewma, int streak,
                                        boolean illness, boolean coach, Map<Integer, TargetGates> gates) {
        return new PeriodicInput(2, st, overall, rel, comps, ewma, streak, illness, coach, LEVELS, gates);
    }

    private PeriodicResult run(PeriodicInput i) { return engine.decide(i, V2TestFixtures.params()); }

    // ---------- lên level ----------
    @Test
    void promotes_whenOverallReachesNextMin_andAllGatesPass() {
        PeriodicResult r = run(in(2, 73.0, 60.0, 0));
        assertEquals(PeriodicOutcome.DECIDED, r.outcome());
        assertEquals(Decision.PROMOTED, r.decision());
        assertEquals(3, r.finalRank());
        assertEquals(66.5, r.ewma());
    }

    @Test
    void neverSkipsMoreThanMaxPromotionStep_unlikeBaseline() {
        assertEquals(2, run(in(1, 95.0, 90.0, 0)).finalRank());   // đủ điểm cho L4 nhưng chỉ +1
    }

    @Test
    void anyGateFailing_blocksPromotion_withoutRegressionEffect() {
        for (int g = 0; g < 5; g++) {
            GateStatus[] s = {P, P, P, P, P};
            s[g] = GateStatus.FAIL;
            PeriodicResult r = run(custom(UserLevelStatus.VERIFIED, 73.0, P, Map.of(), 60.0, 1, false, false,
                    Map.of(3, new TargetGates(s[0], s[1], s[2], s[3], s[4]))));
            assertEquals(Decision.MAINTAINED, r.decision(), "gate #" + g);
            assertEquals(2, r.finalRank());
            assertEquals("PROMOTION_GATE_FAILED", r.reasonCode());
            assertEquals(0, r.consecutiveBelow());
        }
    }

    @Test
    void gateWithInsufficientEvidenceBlocksPromotion_butIsNotAFail() {
        PeriodicResult r = run(custom(UserLevelStatus.VERIFIED, 73.0, P, Map.of(), 60.0, 0, false, false,
                Map.of(3, new TargetGates(P, P, GateStatus.INSUFFICIENT_EVIDENCE, P, GateStatus.NOT_EVALUATED))));
        assertEquals(Decision.MAINTAINED, r.decision());
        assertEquals("PROMOTION_EVIDENCE_INCOMPLETE", r.reasonCode());
        assertEquals(2, r.blockedGates().size());
    }

    @Test
    void selfReportedGateDoesNotCountAsMeasuredEvidenceForPeriodic() {
        PeriodicResult r = run(custom(UserLevelStatus.VERIFIED, 73.0, P, Map.of(), 60.0, 0, false, false,
                Map.of(3, new TargetGates(P, P, P, GateStatus.PASS_SELF_REPORTED, P))));
        assertEquals(Decision.MAINTAINED, r.decision());
    }

    @Test
    void missingGatesForTarget_areNotEvaluated_notPass() {
        assertEquals(Decision.MAINTAINED, run(custom(UserLevelStatus.VERIFIED, 73.0, P, Map.of(), 60.0, 0, false, false, Map.of())).decision());
    }

    // ---------- chuyên cần (EXP): cổng + điểm cộng ----------
    private static PeriodicInput withAttendance(int rank, double overall, Attendance att, Map<Integer, TargetGates> gates) {
        return new PeriodicInput(rank, UserLevelStatus.VERIFIED, overall, GateStatus.PASS, Map.of("PUSH", 60.0, "PULL", 60.0), 60.0, 0, false, false, LEVELS, gates, att);
    }

    private static final Attendance GOOD = new Attendance(80, true, 60, 3);

    @Test
    void attendanceBonusLiftsOverall_onlyWhenEveryGatePasses() {
        PeriodicResult r = run(withAttendance(2, 70.0, GOOD, Map.of(3, ALL_PASS)));    // 70 < 72 nhưng 70 + 2,4 ≥ 72
        assertEquals(Decision.PROMOTED, r.decision());
        assertEquals(3, r.finalRank());
        assertEquals("PROMOTED_WITH_ATTENDANCE_BONUS", r.reasonCode());
    }

    @Test
    void attendanceBonusNeverReplacesAGate() {
        for (int g = 0; g < 5; g++) {
            GateStatus[] s = {P, P, P, P, P};
            s[g] = GateStatus.FAIL;
            PeriodicResult r = run(withAttendance(2, 70.0, GOOD, Map.of(3, new TargetGates(s[0], s[1], s[2], s[3], s[4]))));
            assertEquals(Decision.MAINTAINED, r.decision(), "gate #" + g);
            assertEquals(2, r.finalRank());
            assertEquals("WITHIN_STABLE_BAND", r.reasonCode(), "điểm chưa đủ + cổng chưa đạt: báo là chưa đủ điểm, không đổ lỗi cho cổng");
        }
    }

    @Test
    void attendanceBonusIsCapped_soAttendanceCannotCoverALargeShortfall() {
        PeriodicResult r = run(withAttendance(2, 68.0, new Attendance(100, true, 60, 3), Map.of(3, ALL_PASS)));   // 68 + 3 = 71 < 72
        assertEquals(Decision.MAINTAINED, r.decision());
        assertEquals(2, r.finalRank());
    }

    @Test
    void lowAttendanceBlocksPromotionEvenWithEnoughOverallAndGates() {
        PeriodicResult r = run(withAttendance(2, 75.0, new Attendance(40, true, 60, 3), Map.of(3, ALL_PASS)));
        assertEquals(Decision.MAINTAINED, r.decision());
        assertEquals("PROMOTION_GATE_FAILED", r.reasonCode());
        assertEquals(GateStatus.FAIL, r.blockedGates().get("attendance"));
    }

    @Test
    void noAttendanceEvidenceIsInsufficientEvidence_notAFail() {
        PeriodicResult r = run(withAttendance(2, 75.0, new Attendance(0, false, 60, 3), Map.of(3, ALL_PASS)));
        assertEquals(Decision.MAINTAINED, r.decision());
        assertEquals("PROMOTION_EVIDENCE_INCOMPLETE", r.reasonCode());
        assertEquals(GateStatus.INSUFFICIENT_EVIDENCE, r.blockedGates().get("attendance"));
        assertEquals(0, r.consecutiveBelow());
    }

    @Test
    void bonusDoesNotApplyWhenAttendanceBelowGate() {
        PeriodicResult r = run(withAttendance(2, 70.0, new Attendance(55, true, 60, 3), Map.of(3, ALL_PASS)));
        assertEquals(Decision.MAINTAINED, r.decision());
        assertEquals(2, r.finalRank());
    }

    @Test
    void attendanceIsIrrelevantWhenFeatureIsOff() {
        assertEquals(Decision.PROMOTED, run(withAttendance(2, 73.0, null, Map.of(3, ALL_PASS))).decision());
        assertEquals(2, run(withAttendance(2, 70.0, null, Map.of(3, ALL_PASS))).finalRank());
    }

    @Test
    void bonusStillNeedsCoachForL4() {
        PeriodicResult r = engine.decide(withAttendance(3, 86.0, GOOD, Map.of(4, ALL_PASS)), V2TestFixtures.params());   // 86 + 2,4 ≥ 88
        assertEquals(Decision.MAINTAINED, r.decision());
        assertEquals(4, r.pendingCoachRank());
    }

    // ---------- L4 cần Coach xác nhận ----------
    @Test
    void l4_allGatesPass_staysL3_withPendingCoach_andNoStreakEffect() {
        PeriodicResult r = run(in(3, 90.0, 85.0, 1));
        assertEquals(PeriodicOutcome.DECIDED, r.outcome());
        assertEquals(Decision.MAINTAINED, r.decision());
        assertEquals(3, r.finalRank());
        assertEquals(4, r.pendingCoachRank());
        assertEquals("L4_AWAITING_COACH_VERIFICATION", r.reasonCode());
        assertEquals(0, r.consecutiveBelow());
    }

    @Test
    void l4_withoutCoachRequirement_promotesByCamera() {
        RuleParams noCoach = V2TestFixtures.params("level.L4.requiresCoachVerified", 0);
        PeriodicResult r = engine.decide(in(3, 90.0, 85.0, 0), noCoach);
        assertEquals(Decision.PROMOTED, r.decision());
        assertEquals(4, r.finalRank());
        assertNull(r.pendingCoachRank());
    }

    @Test
    void l4_gateFailing_isNormalBlock_notPending() {
        PeriodicResult r = run(custom(UserLevelStatus.VERIFIED, 90.0, P, Map.of(), 85.0, 0, false, false,
                Map.of(4, new TargetGates(P, GateStatus.FAIL, P, P, P))));
        PeriodicResult at3 = engine.decide(new PeriodicInput(3, UserLevelStatus.VERIFIED, 90.0, P, Map.of(), 85.0, 0, false, false, LEVELS,
                Map.of(4, new TargetGates(P, GateStatus.FAIL, P, P, P))), V2TestFixtures.params());
        assertEquals("PROMOTION_GATE_FAILED", at3.reasonCode());
        assertNull(at3.pendingCoachRank());
        assertEquals(2, r.finalRank());   // người dùng L2 không có gate cho L3 ⇒ không đổi
    }

    @Test
    void currentL4_isNotAffected_andNeverRegresses() {
        PeriodicResult r = run(in(4, 60.0, 70.0, 1));              // EWMA 65 < 80: vẫn không hạ level
        assertEquals(Decision.MAINTAINED, r.decision());
        assertEquals(4, r.finalRank());
        assertNull(r.pendingCoachRank());
    }

    @Test
    void missingCoachParameter_isConfigurationError() {
        Map<String, Double> p = V2TestFixtures.baseParams();
        p.remove("level.L4.requiresCoachVerified");
        assertThrows(IllegalStateException.class, () -> engine.decide(in(3, 90.0, 85.0, 0), new RuleParams(p)));
    }

    // ---------- hysteresis ----------
    @Test
    void deadZone_noPromotionNoRegression_streakResets() {
        PeriodicResult r = run(in(2, 45.0, 46.0, 1));            // 42 ≤ EWMA < 72 và Overall < 72
        assertEquals(Decision.MAINTAINED, r.decision());
        assertEquals("WITHIN_STABLE_BAND", r.reasonCode());
        assertEquals(0, r.consecutiveBelow());
    }

    @Test
    void oscillatingAroundThreshold_neverRegresses() {
        Double ewma = 50.0; int streak = 0;
        for (double score : new double[]{49, 51, 49, 51, 49, 51}) {   // quanh promote_min(L2)=50, xa regress_below=42
            PeriodicResult r = run(custom(UserLevelStatus.VERIFIED, score, P, Map.of(), ewma, streak, false, false, Map.of()));
            assertEquals(2, r.finalRank());
            ewma = r.ewma(); streak = r.consecutiveBelow();
        }
        assertEquals(0, streak);
    }

    // ---------- regression ----------
    @Test
    void belowThreshold_keepsTheLevelAndExplainsWhy() {
        PeriodicResult r = run(in(2, 30.0, 40.0, 0));            // EWMA = 35 < 42
        assertEquals(Decision.MAINTAINED, r.decision());
        assertEquals("BELOW_LEVEL_STANDARD", r.reasonCode());
        assertEquals(0, r.consecutiveBelow());
        assertEquals(2, r.finalRank());
    }

    @Test
    void repeatedlyBelow_neverRegresses() {
        PeriodicResult r = run(in(2, 20.0, 30.0, 1));            // điểm rất thấp, nhiều lần liên tiếp: vẫn không hạ level
        assertEquals(Decision.MAINTAINED, r.decision());
        assertEquals(2, r.finalRank());
        assertEquals("BELOW_LEVEL_STANDARD", r.reasonCode());
        assertEquals(0, r.consecutiveBelow());
    }

    @Test
    void recovery_resetsTheStreak() {
        assertEquals(0, run(in(2, 60.0, 50.0, 1)).consecutiveBelow());
    }

    @Test
    void mandatoryCompetencyFarBelow_isFlaggedButNeverRegresses() {
        PeriodicResult r = run(custom(UserLevelStatus.VERIFIED, 55.0, P, Map.of("PUSH", 30.0), 55.0, 1, false, false, Map.of()));   // 30 < 45 − 10
        assertEquals(Decision.MAINTAINED, r.decision());
        assertEquals(2, r.finalRank());
        assertEquals("BELOW_LEVEL_STANDARD", r.reasonCode());
    }

    @Test
    void competencyWithoutEvidence_isNeverCountedAsLow() {
        PeriodicResult r = run(custom(UserLevelStatus.VERIFIED, 55.0, P, Map.of(), 55.0, 1, false, false, Map.of()));
        assertEquals(Decision.MAINTAINED, r.decision());
        assertEquals(0, r.consecutiveBelow());
    }

    @Test
    void competencyJustInsideMargin_isNotDecline() {
        assertEquals(0, run(custom(UserLevelStatus.VERIFIED, 55.0, P, Map.of("PUSH", 35.0), 55.0, 1, false, false, Map.of())).consecutiveBelow());   // 35 = 45 − 10
    }

    @Test
    void illnessOrCoachBlock_neverChangeTheLevelEither() {
        PeriodicResult ill = run(custom(UserLevelStatus.VERIFIED, 20.0, P, Map.of(), 30.0, 1, true, false, Map.of()));
        assertEquals(Decision.MAINTAINED, ill.decision());
        assertEquals(2, ill.finalRank());
        PeriodicResult coach = run(custom(UserLevelStatus.VERIFIED, 20.0, P, Map.of(), 30.0, 1, false, true, Map.of()));
        assertEquals(Decision.MAINTAINED, coach.decision());
        assertEquals(2, coach.finalRank());
    }

    @Test
    void lowestLevel_cannotRegress() {
        PeriodicResult r = run(in(0, 0.0, 0.0, 5));
        assertEquals(Decision.MAINTAINED, r.decision());
        assertEquals(0, r.finalRank());
    }

    // ---------- I19 ----------
    @Test
    void unreliableMeasurement_isRetest_andChangesNothing() {
        for (GateStatus g : List.of(GateStatus.UNRELIABLE, GateStatus.FAIL)) {
            PeriodicResult r = run(custom(UserLevelStatus.VERIFIED, 5.0, g, Map.of("PUSH", 1.0), 40.0, 1, false, false, Map.of()));
            assertEquals(PeriodicOutcome.RETEST_REQUIRED, r.outcome());
            assertNull(r.decision());
            assertEquals(2, r.finalRank());
            assertEquals(40.0, r.ewma());                         // EWMA không bị kéo xuống bởi dữ liệu xấu
            assertEquals(1, r.consecutiveBelow());                // chuỗi không tăng
        }
    }

    @Test
    void unknownReliabilityOrIncompleteCoverage_isInsufficientEvidence_notDecline() {
        PeriodicResult a = run(custom(UserLevelStatus.VERIFIED, 10.0, GateStatus.INSUFFICIENT_EVIDENCE, Map.of(), 40.0, 1, false, false, Map.of()));
        PeriodicResult b = run(custom(UserLevelStatus.VERIFIED, null, P, Map.of(), 40.0, 1, false, false, Map.of()));
        for (PeriodicResult r : List.of(a, b)) {
            assertEquals(PeriodicOutcome.INSUFFICIENT_EVIDENCE, r.outcome());
            assertNull(r.decision());
            assertEquals(2, r.finalRank());
            assertEquals(40.0, r.ewma());
            assertEquals(1, r.consecutiveBelow());
        }
    }

    @Test
    void repeatedUnreliableMeasurements_neverAccumulateIntoARegression() {
        int streak = 1; Double ewma = 40.0;
        for (int n = 0; n < 5; n++) {
            PeriodicResult r = run(custom(UserLevelStatus.VERIFIED, 5.0, GateStatus.UNRELIABLE, Map.of(), ewma, streak, false, false, Map.of()));
            assertEquals(2, r.finalRank());
            streak = r.consecutiveBelow(); ewma = r.ewma();
        }
        assertEquals(1, streak);
    }

    // ---------- RETURNING ----------
    @Test
    void returning_keepsLevelWhateverTheScore_andBecomesVerified() {
        for (double score : new double[]{95.0, 5.0}) {
            PeriodicResult r = run(custom(UserLevelStatus.RETURNING, score, P, Map.of(), 50.0, 1, false, false, Map.of(3, ALL_PASS)));
            assertEquals(Decision.MAINTAINED, r.decision());
            assertEquals(2, r.finalRank());
            assertEquals(UserLevelStatus.VERIFIED, r.statusAfter());
            assertEquals(0, r.consecutiveBelow());
        }
    }

    @Test
    void returningButUnreliable_staysReturning() {
        PeriodicResult r = run(custom(UserLevelStatus.RETURNING, 50.0, GateStatus.UNRELIABLE, Map.of(), 50.0, 0, false, false, Map.of()));
        assertEquals(PeriodicOutcome.RETEST_REQUIRED, r.outcome());
        assertEquals(UserLevelStatus.RETURNING, r.statusAfter());
    }

    // ---------- cấu hình ----------
    @Test
    void ewmaStartsFromOverall_whenThereIsNoPreviousValue() {
        assertEquals(58.0, run(in(2, 58.0, null, 0)).ewma());
    }

    @Test
    void missingRuleParameter_isConfigurationError_notSilentDefault() {
        Map<String, Double> p = V2TestFixtures.baseParams();
        p.remove("max_promotion_step");
        assertThrows(IllegalStateException.class, () -> engine.decide(in(2, 30.0, 40.0, 1), new RuleParams(p)));
    }

    @Test
    void unknownCurrentLevel_isRejected() {
        assertThrows(IllegalArgumentException.class, () -> run(in(9, 50.0, 50.0, 0)));
    }
}
