I have reviewed the current Assessment Framework specification and the Motion Rule Engine specification.

I want to formally confirm and update 5 business/architecture decisions before implementation.

These decisions are intentional changes/refinements to the previous specification.

Do NOT treat them as optional suggestions.

From this point forward, these decisions become the authoritative business rules for the CalisHealth Assessment Framework.

Please update your understanding, architecture, algorithms, database model, API design, backend services, frontend behavior, validation rules, test cases, and documentation accordingly.

============================================================
DECISION 1 — TRAINING EXPERIENCE MUST NOT CONTRIBUTE DIRECTLY
TO COMPETENCY SCORE
============================================================

CONFIRMED DECISION:

Training experience does NOT contribute directly to PUSH, PULL, LEGS, CORE, MOBILITY, or SKILL competency scores.

Examples:

- Years of calisthenics experience
- Training frequency history
- Resistance training experience
- Previous training duration

must NOT be treated as performance evidence and must NOT receive a direct competency-scoring weight.

Therefore, remove the previous example where:

Training Experience = 0.15

from the competency scoring formula.

------------------------------------------------------------
RATIONALE
------------------------------------------------------------

Training experience and physical capability are different concepts.

For example:

User A:
- 3 years of calisthenics experience
- Push-up = 8 reps

User B:
- 6 months of calisthenics experience
- Push-up = 30 reps

The system must not automatically assign a higher PUSH competency to User A simply because she has trained longer.

Training experience is contextual information rather than direct evidence of current physical capability.

If training experience were included directly in competency scoring, it could double-count information already represented by measurable performance answers.

Therefore:

Training Experience ≠ Performance Evidence

------------------------------------------------------------
HOW TRAINING EXPERIENCE SHOULD BE USED
------------------------------------------------------------

Training experience should still be stored and used for:

1. Contradiction detection
2. Assessment confidence/reliability
3. Progression interpretation
4. Training-load progression
5. Expected adaptation/progression rate
6. Personalization
7. Roadmap generation
8. Detecting unusual self-reported combinations

Example:

Training experience:
"Never trained"

Pull-up:
"15 strict reps"

This should trigger a contradiction/data-quality check.

The system should NOT simply delete the answer.

Instead:

dataQuality = CONFLICTED

and reduce confidence or flag the result for future practical verification.

Training experience can also be used as context when determining how aggressively training load should progress.

However:

Training experience MUST NOT increase or decrease the competency score directly.

------------------------------------------------------------
IMPLEMENTATION RULE
------------------------------------------------------------

The competency scoring engine must exclude Training Experience from
performance competency scoring.

Training Experience belongs to:

Context / Reliability / Progression Strategy

NOT:

Direct Competency Evidence.

Please update:

- competency scoring algorithm
- question weighting
- answer rules
- assessment configuration
- DTOs
- database metadata
- unit tests
- contradiction detection
- roadmap logic where applicable

so that this rule is enforced consistently.

============================================================
DECISION 2 — WITHIN THE SAME PROGRESSION LADDER,
USE THE HIGHEST SUCCESSFULLY ACHIEVED LEVEL
============================================================

CONFIRMED DECISION:

When multiple exercises/questions belong to the SAME exercise progression ladder,
the system must NOT calculate their competency contribution using a simple weighted average.

Instead, the system should determine the highest progression stage that the user has successfully achieved.

Example:

PUSH progression:

Basic Push-up
    ↓
Advanced Push-up
    ↓
Dip
    ↓
Pike Push-up
    ↓
Higher progression

If the user successfully satisfies the configured requirements for:

Push-up → PASS
Dip → PASS
Pike Push-up → PASS

then the system should identify:

highestAchievedStage = PIKE_PUSH_UP

rather than calculating:

Average(
    Push-up Score,
    Dip Score,
    Pike Push-up Score
)

------------------------------------------------------------
IMPORTANT CLARIFICATION
------------------------------------------------------------

"Highest achieved" applies ONLY within the same progression ladder.

It does NOT mean:

"Always take the maximum score from every question."

We still need weighted evidence when combining DIFFERENT evidence categories or independent evidence groups.

For example:

PUSH competency may contain:

A. Progression Ladder Evidence
   → highest successfully achieved progression

B. Performance Evidence
   → repetitions / duration / measurable performance

C. Movement Quality Evidence
   → form quality / ROM / stability

D. Reliability Evidence
   → confidence / contradiction / data quality

These are conceptually different evidence types.

Therefore:

Within one progression ladder:
    highest valid progression stage

Across different evidence groups:
    configurable weighting may still be used.

------------------------------------------------------------
WHY THIS IS MORE LOGICAL
------------------------------------------------------------

Exercises such as Push-up, Dip, Pike Push-up, etc. are not necessarily independent measurements of the same thing.

They can represent different progression stages.

A user who has successfully demonstrated a harder progression has already demonstrated the prerequisite capability of lower stages, assuming the progression relationship is correctly configured.

Averaging the scores of progression stages could therefore dilute the meaning of the highest achieved capability.

Example:

Push-up = 90
Dip = 80
Pike Push-up = 75

Weighted average may produce a lower generic number.

But the more meaningful progression information is:

Highest achieved progression = Pike Push-up

The system can still retain all lower-stage measurements for historical analysis and evidence.

------------------------------------------------------------
IMPORTANT DATA REQUIREMENT
------------------------------------------------------------

Do NOT delete lower-stage evidence.

Store:

- exercise
- progression ladder
- progression stage
- result
- performance
- quality
- validity
- confidence
- assessment ID
- assessment version

Then derive:

highestAchievedStage

from valid evidence.

------------------------------------------------------------
IMPLEMENTATION RULE
------------------------------------------------------------

Create an explicit concept such as:

Progression Ladder

and:

Progression Stage

The Skill Readiness / Competency engine should be able to determine:

highestAchievedStage

based on configured prerequisites and minimum requirements.

Do not hardcode progression logic directly inside Java services.

Progression relationships must be configurable.

============================================================
DECISION 3 — USE A SHARED ASSESSMENT DATA MODEL
AND REMOVE INITIAL-SPECIFIC ASSESSMENT TABLES
============================================================

CONFIRMED DECISION:

Do NOT create:

initial_assessment_sessions
initial_assessment_answers
initial_assessment_results

as separate duplicated database structures.

Use the shared:

assessment_*

framework.

The existing Assessment Framework already establishes that INITIAL
and PERIODIC are two different assessment experiences but should use
a shared backend Assessment Framework.

Therefore the database should primarily use common entities such as:

assessment_templates
assessment_versions
assessment_sections
assessment_items
assessment_options
assessment_answer_rules
assessment_sessions
assessment_answers
assessment_results
assessment_metrics
assessment_evidence
assessment_reliability

------------------------------------------------------------
ASSESSMENT TYPE
------------------------------------------------------------

Differentiate assessment workflows through metadata.

For example:

assessment_type:

INITIAL
PERIODIC

execution_mode:

QUESTIONNAIRE
PRACTICAL

Therefore:

INITIAL:

assessmentType = INITIAL
executionMode = QUESTIONNAIRE
source = SELF_REPORTED

PERIODIC:

assessmentType = PERIODIC
executionMode = PRACTICAL
source = AI_MEASURED

------------------------------------------------------------
WHY
------------------------------------------------------------

The goal is to have one reusable Assessment Framework rather than two
separate systems.

The frontend can still have two completely different experiences:

/assessment/initial

/assessment/periodic

But the backend domain model should remain shared.

This avoids:

- duplicated entities
- duplicated repositories
- duplicated validation
- duplicated assessment versioning
- duplicated result handling
- duplicated audit logic
- duplicated future assessment types

The architecture should remain extensible for future:

COACH
REASSESSMENT
SKILL_SPECIFIC
CUSTOM

assessment types.

------------------------------------------------------------
IMPORTANT
------------------------------------------------------------

Do NOT force INITIAL and PERIODIC to have identical data requirements.

The shared model should be extensible.

For example:

INITIAL may primarily use:

assessment_answers

while PERIODIC may additionally use:

assessment_metrics
assessment_evidence
movement metrics
camera reliability
motion analysis results

The framework is shared, but execution-specific data can still be
represented through shared extensible concepts.

Only create a specialized table when there is a genuine domain need,
not simply because the assessment type is different.

============================================================
DECISION 4 — INITIAL ASSESSMENT HAS A TEMPORARY LEVEL CAP OF L2
============================================================

CONFIRMED DECISION:

The Initial Assessment may assign:

L0 Foundation
L1 Beginner
L2 Intermediate

but MUST NOT assign:

L3 Advanced
L4 Elite

as a verified initial level.

The maximum initial level is:

L2 — Intermediate

and the Initial result remains:

PROVISIONAL / TEMPORARY.

------------------------------------------------------------
EXAMPLE
------------------------------------------------------------

Suppose a user self-reports:

- 30+ push-ups
- 15+ pull-ups
- advanced calisthenics experience
- handstand
- muscle-up
- advanced skills

Even if the self-reported data mathematically appears sufficient for
L3 or L4, the Initial Assessment must return at most:

L2 — Intermediate

with status:

PROVISIONAL

or:

TEMPORARY

Example:

currentLevel = INTERMEDIATE

levelStatus = PROVISIONAL

verificationStatus = NOT_VERIFIED

------------------------------------------------------------
WHY
------------------------------------------------------------

The Initial Assessment is questionnaire-based.

It is self-reported.

It is not camera-measured.

Therefore the system cannot confidently verify:

- movement quality
- ROM
- technique
- rep validity
- stability
- control
- consistency
- actual skill execution

The Assessment Framework explicitly distinguishes:

INITIAL:
Self-reported + Provisional

PERIODIC:
Camera-measured + Objective

Therefore the Initial Assessment should provide a safe starting estimate,
not a high-confidence advanced classification.

------------------------------------------------------------
BASELINE / PERIODIC VERIFICATION
------------------------------------------------------------

L3 and L4 become available through practical assessment.

Example:

INITIAL:

Self-reported:
Advanced

System result:

Intermediate
(Provisional)

Then:

Baseline / Periodic Practical Assessment
        ↓
Camera
        ↓
MediaPipe
        ↓
Feature Engine
        ↓
Motion Rule Engine
        ↓
Movement Quality
        ↓
Performance
        ↓
Competency
        ↓
Skill Readiness
        ↓
Fitness Level Engine
        ↓
Potential L3 / L4

------------------------------------------------------------
IMPORTANT
------------------------------------------------------------

Do NOT interpret the cap as:

"Advanced users are not allowed."

It means:

"Advanced status cannot be VERIFIED using self-reported Initial
Assessment alone."

The user may have advanced real-world ability.

The system simply requires objective verification before assigning
L3/L4 as an official fitness level.

------------------------------------------------------------
UI REQUIREMENT
------------------------------------------------------------

If a user's self-reported capability would indicate L3 or L4,
show something like:

Current Level
INTERMEDIATE

Status
PROVISIONAL

Message:

"Your initial level is temporarily capped at Intermediate because
your current assessment is self-reported. Complete the Baseline
Practical Assessment to verify your actual fitness level."

Do NOT present the self-reported L3/L4 as a confirmed system level.

============================================================
DECISION 5 — ADD A SAFETY SCREENING STEP BEFORE ASSESSMENT
============================================================

CONFIRMED DECISION:

Add a safety screening step based on the PAR-Q+ concept before the
Initial Assessment.

This is a SAFETY SCREENING layer.

It is NOT part of competency scoring.

It is NOT part of fitness level scoring.

It must NOT increase or decrease:

- PUSH score
- PULL score
- LEGS score
- CORE score
- MOBILITY score
- SKILL score
- Overall Fitness Level

------------------------------------------------------------
NEW INITIAL FLOW
------------------------------------------------------------

Instead of:

Register
    ↓
First Login
    ↓
Initial Assessment

Use:

Register
    ↓
First Login
    ↓
Safety Screening
    ↓
Initial Fitness Questionnaire
    ↓
Initial Fitness State
    ↓
Initial Training Cycle

------------------------------------------------------------
SAFETY SCREENING PURPOSE
------------------------------------------------------------

The purpose is to identify whether the user should:

1. proceed normally
2. proceed with training constraints
3. require additional review / caution
4. be advised to seek appropriate professional evaluation before
   certain training activities

The exact safety logic should be conservative and configurable.

------------------------------------------------------------
IMPORTANT SEPARATION
------------------------------------------------------------

Safety Screening answers:

"Is it appropriate for the system to proceed with unrestricted
training recommendations?"

Fitness Assessment answers:

"What is the user's current physical capability?"

These are different questions.

Therefore:

Safety Status

must be independent from:

Fitness Level

------------------------------------------------------------
EXAMPLE
------------------------------------------------------------

User:

Safety screening:
Requires caution/review

Physical capability:
Push = 70
Pull = 60
Legs = 75
Core = 65

The system should NOT reduce:

Push = 70

to:

Push = 50

simply because of the safety screening.

Instead:

Fitness capability remains measured separately.

Safety constraints are applied later to:

Exercise Eligibility
Training Load
Training Recommendations
Assessment Participation
etc.

------------------------------------------------------------
POSSIBLE SAFETY STATUS
------------------------------------------------------------

Use a configurable status model such as:

CLEARED
REVIEW_REQUIRED
RESTRICTED

The exact names can be finalized during implementation.

Do not use a numerical "health score" as a substitute for safety
screening.

============================================================
IMPORTANT ARCHITECTURAL CONSEQUENCES
============================================================

After these 5 decisions, the architecture should be updated as follows:

------------------------------------------------------------
A. ASSESSMENT
------------------------------------------------------------

Shared Assessment Framework:

Assessment
AssessmentTemplate
AssessmentVersion
AssessmentSection
AssessmentItem
AssessmentOption
AssessmentAnswer
AssessmentSession
AssessmentResult
AssessmentMetric
AssessmentEvidence
AssessmentReliability

Assessment Types:

INITIAL
PERIODIC

Execution Modes:

QUESTIONNAIRE
PRACTICAL

------------------------------------------------------------
B. SAFETY
------------------------------------------------------------

Safety Screening
        ↓
Safety Status
        ↓
Training / Assessment Constraints

This is separate from competency scoring.

------------------------------------------------------------
C. INITIAL COMPETENCY
------------------------------------------------------------

Self-reported performance
        ↓
Normalize
        ↓
Detect contradictions
        ↓
Determine progression stages
        ↓
Highest achieved stage within each ladder
        ↓
Combine independent evidence groups
        ↓
Competency Score
        ↓
Confidence
        ↓
Provisional Level

Training Experience is NOT a direct scoring input.

------------------------------------------------------------
D. INITIAL LEVEL
------------------------------------------------------------

Initial Level Engine:

Candidate level
        ↓
Apply competency gates
        ↓
Apply confidence/data-quality checks
        ↓
Apply INITIAL LEVEL CAP
        ↓
Maximum = L2
        ↓
PROVISIONAL LEVEL

------------------------------------------------------------
E. PERIODIC LEVEL
------------------------------------------------------------

Periodic Assessment:

Camera
    ↓
MediaPipe
    ↓
Feature Engine
    ↓
Motion Rule Engine
    ↓
Movement Quality
    ↓
Measured Performance
    ↓
Competency Engine
    ↓
Skill Readiness
    ↓
Fitness Level Engine
    ↓
Performance Gate
Movement Quality Gate
Competency Gate
Skill Gate
Stability Gate
Reliability Gate
    ↓
PROMOTED / MAINTAINED / REGRESSED / RETEST_REQUIRED

L3/L4 can be assigned here if all configured requirements are satisfied.

------------------------------------------------------------
F. MOTION RULE ENGINE
------------------------------------------------------------

Keep the Motion Rule Engine separate from the Fitness Level Engine.

Motion Rule Engine answers:

"Is this movement execution within configured criteria?"

Movement Quality answers:

"How well was the movement executed?"

Competency Engine answers:

"How capable is the user in this physical domain?"

Fitness Level Engine answers:

"What is the user's current CalisHealth level?"

Do NOT merge these responsibilities.

------------------------------------------------------------
G. ROADMAP
------------------------------------------------------------

The roadmap must continue to use:

Current Fitness State
+
Goals
+
Skill Gaps
+
Prerequisites
+
Equipment
+
Availability
+
Safety Constraints
+
Recent Performance

The roadmap should NOT be generated from Level alone.

============================================================
UPDATED INITIAL ASSESSMENT ALGORITHM
============================================================

Use the following conceptual algorithm:

STEP 0
Safety Screening

IF safety status requires restriction/review:
    apply appropriate training/assessment constraints

STEP 1
Collect self-reported questionnaire data

STEP 2
Normalize performance answers

STEP 3
Detect contradictory answers

STEP 4
Evaluate progression ladders

For each progression ladder:

    determine highest stage
    for which configured requirements are satisfied

STEP 5
Evaluate independent evidence groups

STEP 6
Calculate competency scores

Training Experience is NOT included as direct competency evidence.

STEP 7
Calculate confidence/reliability

STEP 8
Calculate candidate level

STEP 9
Apply competency gates

STEP 10
Apply Initial Level Cap

    maxInitialLevel = L2

STEP 11
Return:

    provisionalLevel
    candidateLevel
    competencyScores
    confidence
    dataQuality
    progressionStages
    skillReadiness
    skillGaps
    safetyStatus
    reasons

STEP 12
Generate initial provisional training cycle.

============================================================
UPDATED PERIODIC ASSESSMENT ALGORITHM
============================================================

Periodic assessment remains objective/measured.

Flow:

Camera
    ↓
MediaPipe Pose
    ↓
Feature Engine
    ↓
Motion Rule Engine
    ↓
Valid / Invalid Reps
    ↓
Movement Quality
    ↓
Performance Metrics
    ↓
Competency Engine
    ↓
Skill Readiness
    ↓
Fitness Level Engine
    ↓
Level Decision
    ↓
Skill Gap
    ↓
Exercise Eligibility
    ↓
Roadmap
    ↓
NEW Training Cycle

The Motion Rule Engine remains deterministic and is the source of
truth for movement correctness.

Gemini must NOT determine:

- movement validity
- thresholds
- competency
- fitness level

Gemini may only explain validated results.

============================================================
UPDATED LEVEL RULE
============================================================

The level system must distinguish:

1. Candidate Level
2. Verified/Final Level
3. Level Status
4. Assessment Source

Example Initial:

candidateLevel = ADVANCED
finalLevel = INTERMEDIATE
status = PROVISIONAL
source = SELF_REPORTED
capApplied = true

Reason:

"Initial self-reported assessment cannot verify L3/L4."

Example Periodic:

candidateLevel = ADVANCED
finalLevel = ADVANCED
status = VERIFIED
source = AI_MEASURED
decision = PROMOTED

provided that all configured gates pass.

============================================================
UPDATED DATA MODEL REQUIREMENTS
============================================================

Please revise the ERD and database design accordingly.

Do NOT create:

initial_assessment_*
periodic_assessment_*

merely to separate assessment types.

Use shared assessment entities and type/execution metadata.

However, keep the domain extensible so that future specialized
assessment data can be added when genuinely necessary.

Add or ensure support for concepts such as:

assessment_type
execution_mode
source_type
assessment_version
algorithm_version
data_quality
confidence
progression_ladder
progression_stage
highest_achieved_stage
safety_screening
safety_status
level_status
level_cap
candidate_level
final_level

Use normalized relational design.

============================================================
UPDATED AUDITABILITY REQUIREMENTS
============================================================

The system must be able to explain:

1. Which answers contributed to competency?
2. Which answers were contextual only?
3. Which progression stage was highest achieved?
4. Why was a lower progression stage rejected?
5. Why was a competency score assigned?
6. What was the confidence?
7. Were contradictions detected?
8. Was the initial L2 cap applied?
9. Why could L3/L4 not be assigned initially?
10. Which practical assessment later verified the level?
11. Which Motion Rule versions contributed to periodic assessment?
12. Which Level Engine version was used?
13. Which Safety Screening status affected training eligibility?
14. Which assessment generated the current training cycle?

Do not overwrite historical decisions.

All assessment, rule, algorithm, and level decisions must remain
versioned and auditable.

============================================================
UPDATED TEST REQUIREMENTS
============================================================

Please add test cases for these 5 decisions.

TEST GROUP 1 — TRAINING EXPERIENCE

Test:

User with high training experience but low performance.

Expected:

Experience does NOT increase competency score.

Test:

User with no training experience but strong performance.

Expected:

Performance may produce high competency, while experience remains
context/reliability information.

Test:

Never trained + very high performance.

Expected:

Contradiction detected.

------------------------------------------------------------
TEST GROUP 2 — PROGRESSION LADDER

Test:

Push-up PASS
Dip PASS
Pike Push-up FAIL

Expected:

Highest achieved = Dip

Test:

Push-up PASS
Dip PASS
Pike Push-up PASS

Expected:

Highest achieved = Pike Push-up

Test:

Higher progression passes but prerequisite fails.

Expected:

Higher progression cannot be accepted unless prerequisite policy
explicitly permits it.

------------------------------------------------------------
TEST GROUP 3 — SHARED ASSESSMENT

Test:

INITIAL questionnaire creates Assessment with:

type = INITIAL
executionMode = QUESTIONNAIRE

Test:

PERIODIC practical test creates Assessment with:

type = PERIODIC
executionMode = PRACTICAL

Both must use the shared Assessment Framework.

------------------------------------------------------------
TEST GROUP 4 — INITIAL LEVEL CAP

Test:

Self-reported data mathematically qualifies for L3.

Expected:

finalLevel = L2
status = PROVISIONAL
capApplied = true

Test:

Self-reported data mathematically qualifies for L4.

Expected:

finalLevel = L2
status = PROVISIONAL
capApplied = true

Test:

Periodic practical assessment verifies L3.

Expected:

L3 can be assigned if all gates pass.

------------------------------------------------------------
TEST GROUP 5 — SAFETY SCREENING

Test:

Safety = CLEARED

Expected:

normal assessment flow.

Test:

Safety = REVIEW_REQUIRED

Expected:

appropriate review/constraint flow.

Test:

Safety status changes.

Expected:

fitness competency score remains independent from safety status.

============================================================
IMPORTANT: DO NOT REINTRODUCE THE OLD RULES
============================================================

The following old assumptions are now superseded:

1. Training Experience = direct competency weight
   → REMOVED

2. Weighted average across exercises in the same progression ladder
   → REPLACED by highest successfully achieved progression stage

3. Separate initial_assessment_* database tables
   → REMOVED in favor of shared assessment_* framework

4. Initial assessment can theoretically produce L3/L4
   → REPLACED by maximum initial level L2

5. No safety screening before initial assessment
   → REPLACED by Safety Screening as Step 0

These are intentional architecture decisions.

Do not silently reintroduce the previous behavior in another service,
database table, scoring formula, or UI.

============================================================
FINAL REQUEST
============================================================

Before implementing code, please provide an updated specification
showing how these 5 decisions affect:

1. Domain architecture
2. Assessment architecture
3. Safety screening architecture
4. Competency scoring
5. Progression ladder model
6. Fitness Level Engine
7. Initial Assessment algorithm
8. Periodic Assessment algorithm
9. Database ERD
10. Database tables
11. Spring Boot service architecture
12. React architecture
13. REST APIs
14. DTOs
15. Validation rules
16. Assessment state machine
17. Level state machine
18. Roadmap generation
19. Training Cycle generation
20. Audit/versioning
21. Unit tests
22. Integration tests
23. Edge cases

For every place where the old specification conflicts with these
decisions, explicitly identify:

OLD RULE
→ NEW RULE
→ IMPLEMENTATION IMPACT

Do not merely acknowledge the five decisions.

Update the entire Assessment Framework consistently so that there is
no contradiction between the written specification, database design,
business logic, backend services, frontend behavior, and tests.

After presenting the updated architecture and algorithms, wait for
confirmation before generating the implementation code.