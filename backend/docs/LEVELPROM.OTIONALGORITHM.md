============================================================
LEVEL PROMOTION CALCULATION ALGORITHM
============================================================

Design a complete, deterministic, explainable algorithm for deciding whether a user should:

1. PROMOTE to the next level
2. MAINTAIN the current level
3. REGRESS to a lower level

The algorithm must NOT simply use:

Overall Score >= threshold

Instead, it must evaluate multiple independent gates.

------------------------------------------------------------
1. INPUT DATA
------------------------------------------------------------

The Level Evaluation Engine receives:

- current_level
- candidate_level
- competency_scores
- performance_metrics
- movement_quality_metrics
- skill_progress
- prerequisite_status
- assessment_reliability
- assessment_history
- training_consistency
- recent_performance_trend
- previous_level_evaluations
- active_goal
- level_requirements
- promotion_rules
- regression_rules
- hysteresis_rules

------------------------------------------------------------
2. STEP 1 — CALCULATE COMPETENCY SCORES
------------------------------------------------------------

For each competency:

PUSH
PULL
LEGS
CORE
MOBILITY
SKILL

calculate a score from 0–100.

The calculation must distinguish:

A. SELF_REPORTED DATA
B. AI_MEASURED DATA
C. COACH_VERIFIED DATA

When objective measured data exists, it should have higher priority than self-reported data.

The engine must also calculate:

confidence_score

Example:

competency_result = {
    score: 68,
    confidence: 0.91,
    source: "AI_MEASURED",
    trend: "IMPROVING"
}

------------------------------------------------------------
3. STEP 2 — CALCULATE OVERALL SCORE
------------------------------------------------------------

Calculate an Overall Score from competency scores.

Do NOT simply use an unweighted average.

Design a configurable weighted model.

Example:

OverallScore =
    PushScore × W_push
  + PullScore × W_pull
  + LegsScore × W_legs
  + CoreScore × W_core
  + MobilityScore × W_mobility
  + SkillScore × W_skill

The weights must be configurable.

The system must validate that:

Σ weights = 1.0

IMPORTANT:

OverallScore alone MUST NOT determine promotion.

------------------------------------------------------------
4. STEP 3 — DETERMINE CANDIDATE LEVEL
------------------------------------------------------------

Based on:

OverallScore
+
competency scores

determine the highest level for which the user potentially qualifies.

Example:

IF OverallScore >= AdvancedOverallThreshold
AND required competencies >= AdvancedCompetencyThreshold
THEN candidateLevel = ADVANCED

ELSE IF OverallScore >= IntermediateOverallThreshold
AND required competencies >= IntermediateCompetencyThreshold
THEN candidateLevel = INTERMEDIATE

ELSE IF ...

The candidate level is only a POTENTIAL level.

It is NOT the final promotion decision.

------------------------------------------------------------
5. STEP 4 — PERFORMANCE GATE
------------------------------------------------------------

Evaluate whether objective performance meets the requirements of candidateLevel.

For each required competency:

check:

- valid repetitions
- hold duration
- ROM
- exercise-specific performance
- strength performance
- performance benchmark

Example:

performance_gate = PASS

only if all mandatory performance requirements are satisfied.

If any mandatory requirement fails:

performance_gate = FAIL

------------------------------------------------------------
6. STEP 5 — MOVEMENT QUALITY GATE
------------------------------------------------------------

Evaluate:

- form score
- ROM quality
- valid repetition ratio
- movement consistency
- stability
- major form violations
- MediaPipe confidence
- landmark visibility

Example:

Quality Gate:

FormScore >= configured threshold
AND
ROM >= configured threshold
AND
ValidRepRatio >= configured threshold
AND
MajorViolations = 0
AND
PoseConfidence >= configured threshold

If all required criteria pass:

quality_gate = PASS

Otherwise:

quality_gate = FAIL

------------------------------------------------------------
7. STEP 6 — COMPETENCY GATE
------------------------------------------------------------

Check whether all mandatory competencies for candidateLevel satisfy their thresholds.

Example:

Intermediate requires:

OverallScore >= X
AND
Push >= Y
AND
Pull >= Y
AND
Core >= Y

Advanced requires:

OverallScore >= X
AND
Push >= Y
AND
Pull >= Y
AND
Core >= Y
AND
Skill >= Y

All thresholds must be configurable.

Output:

competency_gate = PASS / FAIL

------------------------------------------------------------
8. STEP 7 — SKILL PREREQUISITE GATE
------------------------------------------------------------

Evaluate required skill prerequisites for candidateLevel.

For each prerequisite:

check:

- prerequisite skill status
- minimum performance
- minimum form score
- required competency
- readiness status

Example:

Muscle-up prerequisites:

Pull-up = PASS
Chest-to-bar = PASS
Straight-bar dip = PASS
Explosive pull = PASS
Core = PASS
Transition = PASS

If any mandatory prerequisite fails:

skill_gate = FAIL

Otherwise:

skill_gate = PASS

IMPORTANT:

A user must NOT unlock an advanced skill simply because their OverallScore is high.

------------------------------------------------------------
9. STEP 8 — STABILITY GATE
------------------------------------------------------------

Evaluate whether the user's performance is stable enough for promotion.

Do not promote based on one abnormal assessment.

Possible configurable strategies:

Strategy A:
Require 2 consecutive successful assessments.

Strategy B:
Require N successful sessions within the last M sessions.

Strategy C:
Use rolling average.

Strategy D:
Use both recent performance and historical trend.

Design and compare these strategies.

Recommend the most appropriate strategy for CalisHealth.

Output:

stability_gate = PASS / FAIL

------------------------------------------------------------
10. STEP 9 — RELIABILITY GATE
------------------------------------------------------------

The assessment itself must be sufficiently reliable.

Evaluate:

- pose confidence
- landmark visibility
- camera quality
- valid rep detection confidence
- exercise recognition confidence
- data completeness

Example:

IF reliability < minimum_required_reliability

THEN:

assessment_status = INVALID_FOR_LEVEL_PROMOTION

Do NOT promote or regress the user from unreliable assessment data.

Instead:

assessment_status = RETEST_REQUIRED

This is critical.

------------------------------------------------------------
11. STEP 10 — PROMOTION DECISION
------------------------------------------------------------

Promotion should occur only when:

candidateLevel > currentLevel

AND

performance_gate = PASS

AND

quality_gate = PASS

AND

competency_gate = PASS

AND

skill_gate = PASS

AND

stability_gate = PASS

AND

reliability_gate = PASS

THEN:

promotion_status = PROMOTED

newLevel = candidateLevel

------------------------------------------------------------
12. MAINTAIN DECISION
------------------------------------------------------------

If the user does not satisfy all promotion gates:

newLevel = currentLevel

promotion_status = MAINTAINED

Do NOT automatically regress because promotion criteria were not satisfied.

------------------------------------------------------------
13. REGRESSION DECISION
------------------------------------------------------------

Regression must use different criteria from promotion.

Example:

IF:

persistent performance decline
AND
quality decline
AND
regression threshold breached
AND
decline is confirmed across multiple observations

THEN:

newLevel = currentLevel - 1

promotion_status = REGRESSED

Do NOT regress from one bad assessment.

------------------------------------------------------------
14. HYSTERESIS
------------------------------------------------------------

Use different thresholds for promotion and regression.

Example:

Promotion:
OverallScore >= 70

Regression:
OverallScore < 60

These values are examples only.

Make them configurable.

This prevents level oscillation.

Example:

69 → remain current level
70 → eligible for promotion
68 → remain current level
65 → remain current level
59 → regression evaluation

------------------------------------------------------------
15. FINAL DECISION MATRIX
------------------------------------------------------------

Generate a decision matrix such as:

| Condition | Performance | Quality | Competency | Skill | Stability | Reliability | Result |
|-----------|-------------|---------|------------|-------|-----------|-------------|--------|
| All PASS | PASS | PASS | PASS | PASS | PASS | PASS | PROMOTE |
| Performance fail | FAIL | PASS | PASS | PASS | PASS | PASS | MAINTAIN |
| Quality fail | PASS | FAIL | PASS | PASS | PASS | PASS | MAINTAIN |
| Skill fail | PASS | PASS | PASS | FAIL | PASS | PASS | MAINTAIN |
| Stability fail | PASS | PASS | PASS | PASS | FAIL | PASS | MAINTAIN |
| Reliability fail | PASS | PASS | PASS | PASS | PASS | FAIL | RETEST |
| Persistent decline | FAIL | FAIL | FAIL | - | FAIL | PASS | REGRESS |

Generate the complete decision matrix for all major combinations.

------------------------------------------------------------
16. FINAL LEVEL EVALUATION OBJECT
------------------------------------------------------------

The algorithm must produce a structured result:

{
    "userId": "...",
    "previousLevel": "BEGINNER",
    "candidateLevel": "INTERMEDIATE",
    "finalLevel": "INTERMEDIATE",

    "overallScore": 67,

    "competencies": {
        "push": 68,
        "pull": 62,
        "legs": 71,
        "core": 64,
        "mobility": 55,
        "skill": 48
    },

    "gates": {
        "performance": "PASS",
        "quality": "PASS",
        "competency": "PASS",
        "skill": "PASS",
        "stability": "PASS",
        "reliability": "PASS"
    },

    "decision": "PROMOTED",

    "reasons": [
        "...",
        "...",
        "..."
    ],

    "algorithmVersion": "LEVEL_ENGINE_V1"
}

------------------------------------------------------------
17. PSEUDOCODE
------------------------------------------------------------

Provide complete implementation-ready pseudocode:

evaluateUserLevel(userId, assessmentId)

The pseudocode must explicitly show:

1. Load current level
2. Load latest assessment
3. Validate assessment reliability
4. Calculate competencies
5. Calculate overall score
6. Determine candidate level
7. Evaluate performance gate
8. Evaluate quality gate
9. Evaluate competency gate
10. Evaluate skill gate
11. Evaluate stability gate
12. Evaluate promotion
13. Evaluate regression
14. Apply hysteresis
15. Save level evaluation result
16. Update user level
17. Trigger Skill Gap Engine
18. Trigger Recommendation Engine
19. Generate NEW Training Roadmap
20. Generate NEW Training Cycle

------------------------------------------------------------
18. NUMERICAL EXAMPLE
------------------------------------------------------------

Provide at least 3 numerical examples.

Example:

Current Level:
BEGINNER

Assessment:

Push = 68
Pull = 62
Legs = 70
Core = 64
Mobility = 55
Skill = 48

Overall Score = calculate using configured weights.

Then show:

Performance Gate = PASS
Quality Gate = PASS
Competency Gate = PASS
Skill Gate = PASS
Stability Gate = PASS
Reliability Gate = PASS

Therefore:

BEGINNER → INTERMEDIATE

Then provide another example where:

Overall Score is high

but:

Pull prerequisite fails

Therefore:

MAINTAIN CURRENT LEVEL

Then provide another example where:

performance and quality decline across multiple assessments

Therefore:

REGRESS

------------------------------------------------------------
19. LEVEL EVALUATION MUST TRIGGER NEW TRAINING CYCLE
------------------------------------------------------------

After final level evaluation:

IF decision = PROMOTED
OR
decision = MAINTAINED
OR
decision = REGRESSED

the system should still recalculate:

- current competencies
- skill gaps
- skill readiness
- exercise eligibility
- exercise ranking
- training roadmap

because the user's CURRENT STATE may have changed even when their overall level did not.

Therefore:

Periodic Assessment
→ Level Evaluation
→ Skill Gap Recalculation
→ Exercise Recommendation
→ NEW / UPDATED Training Roadmap
→ NEW Training Cycle

Do NOT only generate a new plan when the user levels up.

A new training cycle may be generated even when:

PROMOTED
MAINTAINED
REGRESSED

because the user's detailed weaknesses and performance may have changed.

------------------------------------------------------------
20. AUDITABILITY
------------------------------------------------------------

Every evaluation must store:

- previous level
- candidate level
- final level
- overall score
- competency scores
- every gate result
- reasons
- assessment ID
- rule version
- algorithm version
- timestamp

The system must be able to answer:

"Why was this user promoted?"

"Why was this user not promoted?"

"Why was this user regressed?"

"Which assessment caused this decision?"

"Which rule version was used?"

"Which competency prevented promotion?"

============================================================
END OF LEVEL PROMOTION ALGORITHM
============================================================