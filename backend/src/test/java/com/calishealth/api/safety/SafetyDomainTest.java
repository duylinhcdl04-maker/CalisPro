package com.calishealth.api.safety;

import com.calishealth.api.safety.SafetyModels.*;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/** Nhóm G5 / G5+ / G9: status, ràng buộc, cờ sticky, clearance (acknowledgement KHÔNG phải clearance). */
class SafetyDomainTest {
    private final SafetyEvaluator evaluator = new SafetyEvaluator();
    private final ClearanceEvaluator clearance = new ClearanceEvaluator();

    private final List<FlagDef> defs = List.of(new FlagDef("EXISTING_CONDITION", true), new FlagDef("EXERTION_SYMPTOM", false), new FlagDef("INJURY_SHOULDER", false));
    private final List<SafetyRule> rules = List.of(
            new SafetyRule("SF_Q1", "EQ", "YES", "EXISTING_CONDITION", Severity.RESTRICT),
            new SafetyRule("SF_Q2", "EQ", "YES", "EXERTION_SYMPTOM", Severity.REVIEW),
            new SafetyRule("SF_INJ", "CONTAINS", "SHOULDER", "INJURY_SHOULDER", Severity.REVIEW));
    private final Map<String, Set<String>> constraints = Map.of(
            "EXISTING_CONDITION", Set.of("LOW_INTENSITY_ONLY", "NO_MAX_EFFORT_TEST"),
            "EXERTION_SYMPTOM", Set.of("NO_PLYOMETRIC", "NO_MAX_EFFORT_TEST"),
            "INJURY_SHOULDER", Set.of("REGION_LIMIT_SHOULDER"));
    private final Map<Status, Policy> policies = Map.of(Status.CLEARED, new Policy(Status.CLEARED, false),
            Status.REVIEW_REQUIRED, new Policy(Status.REVIEW_REQUIRED, false), Status.RESTRICTED, new Policy(Status.RESTRICTED, true));

    private Map<String, Set<String>> answers(String... kv) {
        Map<String, Set<String>> m = new HashMap<>();
        for (int i = 0; i < kv.length; i += 2) m.put(kv[i], Set.of(kv[i + 1].split(",")));
        return m;
    }

    private Evaluation eval(Map<String, Set<String>> a, PreviousSafety prev) {
        return evaluator.evaluate(rules, defs, constraints, a, prev, policies);
    }

    @Test
    void noFlags_isCleared_withoutConstraints() {
        Evaluation e = eval(answers("SF_Q1", "NO", "SF_Q2", "NO", "SF_INJ", "NONE"), null);
        assertEquals(Status.CLEARED, e.status());
        assertTrue(e.constraints().isEmpty());
    }

    @Test
    void reviewFlag_isReviewRequired_withConstraints() {
        Evaluation e = eval(answers("SF_Q1", "NO", "SF_Q2", "YES", "SF_INJ", "SHOULDER,KNEE"), null);
        assertEquals(Status.REVIEW_REQUIRED, e.status());
        assertEquals(Set.of("NO_PLYOMETRIC", "NO_MAX_EFFORT_TEST", "REGION_LIMIT_SHOULDER"), e.constraints());
    }

    @Test
    void restrictFlag_isRestricted_evenWithReviewFlags() {
        Evaluation e = eval(answers("SF_Q1", "YES", "SF_Q2", "YES"), null);
        assertEquals(Status.RESTRICTED, e.status());
    }

    @Test
    void stickyFlagSurvivesRescreenThatDoesNotReproduceIt() {
        Evaluation first = eval(answers("SF_Q1", "YES"), null);
        Evaluation second = eval(answers("SF_Q1", "NO"), new PreviousSafety(first.status(), first.activeFlags(), Set.of()));
        assertTrue(second.activeFlags().stream().anyMatch(f -> f.code().equals("EXISTING_CONDITION")));
        assertEquals(Status.RESTRICTED, second.status());
    }

    @Test
    void nonStickyFlagIsDeactivatedByRescreen_andStatusDrops() {
        Evaluation first = eval(answers("SF_Q2", "YES"), null);
        Evaluation second = eval(answers("SF_Q2", "NO"), new PreviousSafety(first.status(), first.activeFlags(), Set.of()));
        assertEquals(Status.CLEARED, second.status());
        assertTrue(second.events().stream().anyMatch(ev -> ev.flag().equals("EXERTION_SYMPTOM") && ev.event().equals("DEACTIVATED_BY_RESCREEN")));
    }

    @Test
    void policyRequiringClearanceToLeave_holdsStatusAndKeepsConstraints() {
        // RESTRICTED do cờ không sticky: rescreen không tái hiện nhưng policy yêu cầu clearance ⇒ vẫn RESTRICTED, ràng buộc còn
        List<FlagDef> nonSticky = List.of(new FlagDef("EXISTING_CONDITION", false), new FlagDef("EXERTION_SYMPTOM", false), new FlagDef("INJURY_SHOULDER", false));
        Evaluation first = evaluator.evaluate(rules, nonSticky, constraints, answers("SF_Q1", "YES"), null, policies);
        Evaluation second = evaluator.evaluate(rules, nonSticky, constraints, answers("SF_Q1", "NO"),
                new PreviousSafety(first.status(), first.activeFlags(), Set.of()), policies);
        assertEquals(Status.RESTRICTED, second.status());
        assertTrue(second.constraints().contains("LOW_INTENSITY_ONLY"));
        assertTrue(second.events().stream().noneMatch(ev -> ev.event().equals("DEACTIVATED_BY_RESCREEN")));
    }

    @Test
    void unknownFlagIsAConfigurationError() {
        assertThrows(IllegalStateException.class, () -> evaluator.evaluate(rules, List.of(), constraints, answers("SF_Q2", "YES"), null, policies));
    }

    // ---- clearance ----

    private final List<ActiveFlag> reviewFlags = List.of(new ActiveFlag("EXERTION_SYMPTOM", false, Severity.REVIEW));
    private final List<ClearanceRule> coachRules = List.of(
            new ClearanceRule(1, Status.REVIEW_REQUIRED, ScopeMode.ALL, Set.of(), ClearanceMethod.COACH_VERIFIED, Status.CLEARED, true),
            new ClearanceRule(2, Status.RESTRICTED, ScopeMode.ALL, Set.of(), ClearanceMethod.COACH_VERIFIED, Status.REVIEW_REQUIRED, true));

    @Test
    void selfAttestedWithoutPublishedRule_isDenied_statusUnchanged() {
        ClearanceDecision d = clearance.evaluate(Status.REVIEW_REQUIRED, reviewFlags, ClearanceMethod.SELF_ATTESTED, coachRules);
        assertFalse(d.granted());
        assertEquals("CLEARANCE_METHOD_NOT_ALLOWED", d.reasonCode());
    }

    @Test
    void explicitlyPublishedSelfAttestedRule_clearsTheNamedFlag() {
        List<ClearanceRule> withSelf = new ArrayList<>(coachRules);
        withSelf.add(new ClearanceRule(3, Status.REVIEW_REQUIRED, ScopeMode.FLAGS, Set.of("EXERTION_SYMPTOM"), ClearanceMethod.SELF_ATTESTED, Status.CLEARED, true));
        ClearanceDecision d = clearance.evaluate(Status.REVIEW_REQUIRED, reviewFlags, ClearanceMethod.SELF_ATTESTED, withSelf);
        assertTrue(d.granted());
        assertEquals(Status.CLEARED, d.resultingStatus());
        assertEquals(Set.of("EXERTION_SYMPTOM"), d.removedFlags());
        assertEquals(3L, d.ruleId());
    }

    @Test
    void restrictedPlusSelfAttested_isRejectedUnlessExplicitlyPermitted() {
        List<ActiveFlag> restricted = List.of(new ActiveFlag("INJURY_SHOULDER", false, Severity.RESTRICT));
        assertFalse(clearance.evaluate(Status.RESTRICTED, restricted, ClearanceMethod.SELF_ATTESTED, coachRules).granted());
        List<ClearanceRule> explicit = List.of(new ClearanceRule(9, Status.RESTRICTED, ScopeMode.FLAGS, Set.of("INJURY_SHOULDER"), ClearanceMethod.SELF_ATTESTED, Status.REVIEW_REQUIRED, true));
        assertTrue(clearance.evaluate(Status.RESTRICTED, restricted, ClearanceMethod.SELF_ATTESTED, explicit).granted());
    }

    @Test
    void stickyFlagCanOnlyBeRemovedByCoach_evenIfARuleWronglyCoversIt() {
        List<ActiveFlag> flags = List.of(new ActiveFlag("EXISTING_CONDITION", true, Severity.RESTRICT));
        List<ClearanceRule> wrong = List.of(new ClearanceRule(5, Status.RESTRICTED, ScopeMode.ALL, Set.of(), ClearanceMethod.SELF_ATTESTED, Status.CLEARED, true));
        assertFalse(clearance.evaluate(Status.RESTRICTED, flags, ClearanceMethod.SELF_ATTESTED, wrong).granted());
        ClearanceDecision coach = clearance.evaluate(Status.RESTRICTED, flags, ClearanceMethod.COACH_VERIFIED, coachRules);
        assertTrue(coach.granted());
        assertEquals(Set.of("EXISTING_CONDITION"), coach.removedFlags());
        assertEquals(Status.REVIEW_REQUIRED, coach.resultingStatus());
    }

    @Test
    void remainingStickyFlagKeepsStatusEvenWhenRuleSaysCleared() {
        List<ActiveFlag> flags = List.of(new ActiveFlag("EXERTION_SYMPTOM", false, Severity.REVIEW), new ActiveFlag("EXISTING_CONDITION", true, Severity.RESTRICT));
        List<ClearanceRule> rule = List.of(new ClearanceRule(7, Status.RESTRICTED, ScopeMode.ALL_NON_STICKY, Set.of(), ClearanceMethod.COACH_VERIFIED, Status.CLEARED, true));
        ClearanceDecision d = clearance.evaluate(Status.RESTRICTED, flags, ClearanceMethod.COACH_VERIFIED, rule);
        assertTrue(d.granted());
        assertEquals(Set.of("EXERTION_SYMPTOM"), d.removedFlags());
        assertEquals(Status.RESTRICTED, d.resultingStatus());          // cờ sticky RESTRICT còn lại
    }

    @Test
    void publishValidatorRejectsSelfAttestedOnStickyOrBroadScope() {
        List<ClearanceRule> bad = List.of(
                new ClearanceRule(1, Status.REVIEW_REQUIRED, ScopeMode.ALL, Set.of(), ClearanceMethod.SELF_ATTESTED, Status.CLEARED, true),
                new ClearanceRule(2, Status.REVIEW_REQUIRED, ScopeMode.ALL_NON_STICKY, Set.of(), ClearanceMethod.SELF_ATTESTED, Status.CLEARED, true),
                new ClearanceRule(3, Status.REVIEW_REQUIRED, ScopeMode.FLAGS, Set.of("EXISTING_CONDITION"), ClearanceMethod.SELF_ATTESTED, Status.CLEARED, true),
                new ClearanceRule(4, Status.REVIEW_REQUIRED, ScopeMode.FLAGS, Set.of("EXERTION_SYMPTOM"), ClearanceMethod.SELF_ATTESTED, Status.CLEARED, true));
        List<String> errors = clearance.validateRules(bad, defs);
        assertEquals(3, errors.size());
        assertTrue(clearance.validateRules(coachRules, defs).isEmpty());
    }
}
