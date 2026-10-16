You are a Senior Software Architect, Business Analyst, Sports Science Researcher, Calisthenics Coach, Data Architect, and AI System Designer.

You are designing a production-oriented subsystem for a web application called:

CALISHEALTH

CalisHealth is an AI-assisted personalized calisthenics coaching platform.

Technology stack:

Backend:
- Java
- Spring Boot
- RESTfull API
- MySQL

Frontend:
- React

Computer Vision:
- Google MediaPipe Pose
- Optional MediaPipe Hand Landmarker

AI:
- Gemini
- Viettel AI Text-to-Speech

Human Coach:
- Online Coach who can review, adjust, and verify training plans and user performance.

Your task is to design a COMPLETE, PROFESSIONAL, SCIENTIFICALLY INFORMED, CONFIGURABLE, EXPLAINABLE, AND IMPLEMENTABLE:

CALISHEALTH LEVEL & ADAPTIVE TRAINING SYSTEM

Do not give a superficial conceptual answer.

The result must be detailed enough for:
- SRS documentation
- Software architecture
- Database design
- UML diagrams
- Spring Boot implementation
- React implementation
- AI integration
- Future academic/project defense

============================================================
1. CORE BUSINESS CONCEPT
============================================================

CalisHealth must NOT be designed as a simple:

Questionnaire
→ Beginner / Intermediate / Advanced
→ Fixed workout plan

Instead, it must be an adaptive closed-loop training system.

The intended lifecycle is:

Initial Questionnaire
        ↓
Initial Fitness Profile
        ↓
Provisional Competency
        ↓
Provisional Level
        ↓
Initial Training Orientation
        ↓
Training
        ↓
Periodic Practical Assessment
        ↓
MediaPipe + Motion Analysis
        ↓
Measured Performance
        ↓
Competency Evaluation
        ↓
Level Evaluation
        ↓
Skill Gap Evaluation
        ↓
Exercise Prerequisite Evaluation
        ↓
NEW Training Roadmap
        ↓
NEW Training Cycle
        ↓
NEW Weekly Plan
        ↓
NEW Workout Sessions
        ↓
Training
        ↓
Next Periodic Assessment
        ↓
Repeat

IMPORTANT:

Every completed Periodic Assessment must trigger a new evaluation of the user's current fitness state and must be capable of generating a NEW training roadmap/training cycle.

Do NOT design the system so that the user receives one permanent roadmap from the Initial Assessment and follows it indefinitely.

============================================================
2. INITIAL ASSESSMENT VS PERIODIC ASSESSMENT
============================================================

CalisHealth has TWO fundamentally different assessment types.

------------------------------------------------------------
2.1 INITIAL FITNESS QUESTIONNAIRE
------------------------------------------------------------

The Initial Assessment occurs after the user's first login.

The user MUST complete it before entering personalized training.

It is questionnaire-based.

It does NOT use practical physical performance measurement.

Examples:

- Age
- Sex
- Height
- Weight
- Training experience
- Current training frequency
- Push-up ability
- Pull-up ability
- Dead hang ability
- Squat ability
- Plank duration
- Current calisthenics skills
- Training goals
- Available training days
- Session duration
- Equipment
- Training environment
- Self-reported limitations

Note: nên cấu hình Body Profile ở User Profile, nhưng dữ liệu được ghi nhận/cập nhật thông qua Assessment. Không nên nhét Body Profile trực tiếp vào bảng Assessment như một dữ liệu chỉ tồn tại của một lần đánh giá.

The user answers these questions themselves.

Therefore:

INITIAL ASSESSMENT DATA = SELF-REPORTED DATA

It MUST be considered:

PROVISIONAL

and NOT objectively verified.

The Initial Assessment should generate:

- Initial Physical Profile
- Initial Competency Profile
- Provisional Overall Level
- Initial Goal Profile
- Initial Skill Gaps
- Initial Training Orientation

It should NOT be treated as the final verified fitness level.

------------------------------------------------------------
2.2 PERIODIC PRACTICAL ASSESSMENT
------------------------------------------------------------

Periodic Assessment is a practical physical assessment.

The user performs exercises in front of the camera.

Pipeline:

Camera
→ MediaPipe Pose
→ Landmark Mapper
→ Feature Engine
→ Motion Analysis
→ Rule Engine
→ Performance Metrics
→ Assessment Result

Possible metrics:

- Total repetitions
- Valid repetitions
- Invalid repetitions
- Range of Motion
- Form Score
- Joint angles
- Alignment
- Tempo
- Stability
- Movement control
- Hold duration
- Rep consistency
- Pose confidence
- Landmark visibility
- Camera quality

Periodic Assessment provides more objective evidence than self-reported questionnaire data.

Therefore:

OBJECTIVE MEASURED DATA > SELF-REPORTED DATA

when both are available.

============================================================
3. BODY PROFILE
============================================================

The Initial Assessment must include a Body Profile.

Example:

- Age
- Sex
- Height
- Weight
- BMI
- Activity level

BMI should be CALCULATED by the system rather than entered manually.

IMPORTANT:

Body measurements are contextual information.

Do NOT directly use:

Height
Weight
BMI

as direct determinants of:

Push Level
Pull Level
Overall Level

They may be used as contextual inputs for personalization, training constraints, and certain recommendation decisions.

Do NOT use BMI as a direct measure of calisthenics ability.

Create a separate data model such as:

user_physical_profiles

Do NOT mix body measurements with competency records.

============================================================
4. MULTI-DIMENSIONAL FITNESS MODEL
============================================================

Do NOT use only one global level.

CalisHealth must maintain separate competency dimensions.

Minimum competencies:

1. PUSH
2. PULL
3. LEGS
4. CORE
5. MOBILITY
6. SKILL

Optional future competencies:

7. ENDURANCE
8. POWER
9. BALANCE
10. CONTROL

Each competency should have:

- score: 0–100
- competency level
- confidence
- source
- trend
- last assessment date
- assessment reference

Example:

Push = 72
Pull = 38
Legs = 75
Core = 61
Mobility = 52
Skill = 35

The user may therefore be:

Overall:
Intermediate

while:

Push:
Advanced

Pull:
Beginner

Legs:
Advanced

Skill:
Beginner

This is valid.

Do NOT force every competency to have the same level.

============================================================
5. THREE LEVEL CONCEPTS
============================================================

Design three different concepts.

------------------------------------------------------------
5.1 OVERALL LEVEL
------------------------------------------------------------

Represents the user's general proficiency.

Suggested taxonomy:

L0 Foundation
L1 Beginner
L2 Intermediate
L3 Advanced
L4 Elite

IMPORTANT:

These levels are CalisHealth's product framework.

Do NOT falsely claim that ACSM or another organization officially defines these exact five calisthenics levels.

------------------------------------------------------------
5.2 COMPETENCY LEVEL
------------------------------------------------------------

Each competency can have its own level.

Example:

Push = Advanced
Pull = Beginner
Legs = Intermediate
Core = Intermediate
Mobility = Beginner
Skill = Beginner

------------------------------------------------------------
5.3 SKILL LEVEL / SKILL READINESS
------------------------------------------------------------

A specific skill has its own progression status.

Example:

Pull-up progression:

Dead Hang
→ Scapular Pull-up
→ Australian Row
→ Assisted Pull-up
→ Negative Pull-up
→ Pull-up
→ Chest-to-Bar
→ Explosive Pull-up
→ Muscle-up

A user can be:

Overall Intermediate

but:

Muscle-up = NOT READY

This distinction MUST be preserved.

============================================================
6. COMPETENCY SCORING
============================================================

Design a professional scoring system.

For each competency, identify:

- Relevant questionnaire questions
- Relevant practical assessment tests
- Performance metrics
- Movement quality metrics
- Weights
- Reliability
- Normalization
- Missing-data handling
- Contradiction handling

Initial Assessment:

Use self-reported information.

Periodic Assessment:

Use objectively measured performance.

A conceptual formula may be:

Competency Score =
Σ(Measurement Score × Weight × Reliability)
/
Σ(Weight × Reliability)

But do NOT blindly adopt this formula.

Analyze whether it is appropriate.

If you propose another formula, explain why.

All thresholds and weights MUST be configurable.

============================================================
7. DATA SOURCE AND RELIABILITY
============================================================

Every assessment result must have a source.

Possible sources:

SELF_REPORTED
AI_MEASURED
COACH_VERIFIED

Also store:

- confidence
- reliability
- timestamp
- assessment ID
- assessment version

Self-reported data should generally have lower confidence.

AI-measured data should generally have higher confidence if:

- pose confidence is sufficient
- landmark visibility is sufficient
- camera conditions are valid
- exercise detection is valid
- form rules are successfully evaluated

Coach-verified data may have high confidence.

IMPORTANT:

Do not treat example reliability values as universal scientific constants.

Make them configurable.

============================================================
8. QUESTIONNAIRE DESIGN
============================================================

The questionnaire must be database-driven.

Do NOT hard-code questions into Java.

Design:

assessment_templates
assessment_questions
assessment_options
assessment_answer_rules
initial_assessment_sessions
initial_assessment_answers

Question types:

- Single choice
- Multiple choice
- Numeric
- Boolean
- Duration
- Experience level
- Frequency
- Equipment selection

Each question may contain:

- competency mapping
- score mapping
- weight
- reliability
- required/optional
- order
- validation
- active status
- version

============================================================
9. CONTRADICTORY OR UNREALISTIC ANSWERS
============================================================

The system must detect suspicious or contradictory questionnaire answers.

Example:

User says:

"I have never trained calisthenics."

but:

"I can perform 20 strict pull-ups."

The system should:

1. Detect inconsistency.
2. Lower confidence.
3. Mark affected competency as provisional.
4. Optionally request clarification.
5. Recommend practical verification.

Create:

data_quality_status:

HIGH
MEDIUM
LOW
CONFLICTED

============================================================
10. INITIAL LEVEL
============================================================

The Initial Assessment should create:

PROVISIONAL LEVEL

not a final verified level.

The system may use:

- competency scores
- self-reported performance
- training experience
- goal
- physical profile
- data reliability

But the Initial Level must be clearly marked:

PROVISIONAL

Example:

Overall Level:
BEGINNER

Status:
PROVISIONAL

Source:
SELF_REPORTED

Confidence:
LOW

============================================================
11. OVERALL LEVEL MUST NOT BE BASED ONLY ON AVERAGE SCORE
============================================================

Do NOT implement:

Average Score >= X
→ Intermediate

Instead:

OVERALL LEVEL =
Overall Score
+
Mandatory Competency Gates
+
Skill Gates where applicable
+
Quality Requirements
+
Stability Requirements

Example conceptual rule:

Intermediate requires:

Overall Score >= X

AND

Push >= Y

AND

Pull >= Y

AND

Core >= Y

The exact thresholds must be configurable.

============================================================
12. LEVEL-UP GATE
============================================================

Design a formal Level-Up Gate.

A user should only move to the next overall level when required gates are satisfied.

Minimum gates:

1. Performance Gate
2. Movement Quality Gate
3. Competency Gate
4. Skill Prerequisite Gate
5. Stability Gate

Conceptually:

LEVEL UP

IF:

Performance = PASS
AND
Quality = PASS
AND
Competency = PASS
AND
Skill Prerequisites = PASS
AND
Stability = PASS

Otherwise:

MAINTAIN CURRENT LEVEL

============================================================
13. PERFORMANCE GATE
============================================================

Performance Gate evaluates objective performance.

Examples:

- Valid repetitions
- Hold duration
- Strength performance
- ROM
- Exercise-specific benchmark

Do NOT use total repetitions blindly.

Example:

Total reps = 15
Valid reps = 8

The system should use:

Valid reps = 8

for objective progression.

All benchmarks must be configurable.

============================================================
14. MOVEMENT QUALITY GATE
============================================================

Movement quality is critical.

Possible requirements:

- Form Score >= threshold
- ROM >= threshold
- Valid Rep Ratio >= threshold
- Major Form Violations = 0
- Pose confidence >= threshold
- Landmark visibility >= threshold

Example conceptual rule:

Valid Rep Ratio >= 80%
AND
Form Score >= 85
AND
ROM >= 85
AND
Major Violations = 0

These values are examples only.

Do NOT present them as universal scientific standards.

Store them as configurable exercise/level requirements.

============================================================
15. SKILL PREREQUISITE GATE
============================================================

Build a Skill / Exercise Progression Graph.

Example:

Pull-up
→ Chest-to-Bar
→ Explosive Pull-up
→ Muscle-up

Muscle-up may require configurable prerequisites such as:

- Pull-up strength
- Chest-to-bar performance
- Explosive pulling
- Straight-bar dip
- Core control
- Transition competency

Do NOT hard-code these directly into Java.

Store them in the database.

If prerequisites are not satisfied:

The user must NOT be promoted to the corresponding skill progression.

============================================================
16. STABILITY GATE
============================================================

Do not promote a user based on a single abnormal high-performance assessment.

Use trend/history.

Possible approaches:

- two consecutive successful assessments
- N successful sessions within a time window
- rolling average
- performance consistency

Analyze and recommend the most suitable approach.

============================================================
17. HYSTERESIS
============================================================

Implement hysteresis to prevent:

Intermediate
→ Beginner
→ Intermediate
→ Beginner

from small score fluctuations.

For example:

Promotion threshold:
70

Regression threshold:
60

These are examples only.

All thresholds must be configurable.

Explain the mathematical and business reason for hysteresis.

============================================================
18. REGRESSION
============================================================

The system must support:

PROMOTE
MAINTAIN
REGRESS

A user should not immediately regress because of one bad session.

Regression should consider:

- repeated decline
- persistent low quality
- repeated failed assessments
- significant performance decline
- prolonged inactivity

Use trend-based rules.

============================================================
19. COMPETENCY LEVEL-UP VS OVERALL LEVEL-UP
============================================================

These are separate.

Example:

Pull:

Beginner
→ Intermediate

while:

Overall:
Beginner

This is allowed.

Similarly:

Push:
Advanced

while:

Overall:
Intermediate

This is allowed.

Implement separate evaluation logic for:

- Overall Level
- Competency Level
- Skill Readiness

============================================================
20. GOAL-SPECIFIC READINESS
============================================================

The user's training goal must affect recommendation.

Example:

Goal:
Muscle-up

Overall:
Intermediate

But:

Muscle-up Readiness:
NOT READY

because:

Pull-up prerequisite = PASS
Chest-to-bar = PASS
Straight-bar dip = PASS
Explosive pull = FAIL
Transition = FAIL

Therefore:

Do NOT recommend full muscle-up training yet.

Recommend exercises that close the missing gaps.

============================================================
21. SKILL GAP ENGINE
============================================================

After every Periodic Assessment:

1. Determine current competencies.
2. Determine current skills.
3. Determine target skill.
4. Retrieve prerequisites.
5. Compare current state vs required state.
6. Identify missing prerequisites.
7. Rank gaps by importance.

Output:

Skill Gap List

Example:

1. Explosive pulling
2. Chest-to-bar height
3. Transition control

============================================================
22. EXERCISE ELIGIBILITY ENGINE
============================================================

Before an exercise can be recommended, check:

- prerequisite satisfied
- current competency
- difficulty
- equipment
- goal relevance
- training history
- current training load
- recent performance
- user constraints

Output:

ELIGIBLE
or
NOT ELIGIBLE

with reasons.

============================================================
23. EXERCISE RECOMMENDATION ENGINE
============================================================

Do not randomly recommend exercises.

Each eligible exercise should receive a recommendation score.

Consider:

- Goal relevance
- Skill gap relevance
- Prerequisite compatibility
- Difficulty fit
- Weakness relevance
- Equipment compatibility
- Session duration
- Training frequency
- Recent performance
- Training load
- Recovery
- Exercise diversity

Conceptual:

RecommendationScore =
GoalFit × W1
+
SkillGapFit × W2
+
PrerequisiteFit × W3
+
DifficultyFit × W4
+
WeaknessFit × W5
+
EquipmentFit × W6
+
RecentPerformance × W7
-
OverloadRisk × W8

All weights must be configurable.

============================================================
24. TRAINING ROADMAP
============================================================

The Roadmap is NOT permanent.

The roadmap is generated from the CURRENT FITNESS STATE.

Every completed Periodic Assessment should trigger:

CURRENT STATE
→ NEW SKILL GAPS
→ NEW ELIGIBLE EXERCISES
→ NEW PROGRESSION
→ NEW TRAINING ROADMAP

Example:

Cycle 1:

Scapular Pull-up
Australian Row
Negative Pull-up
Assisted Pull-up

After assessment:

Pull-up prerequisite achieved.

Cycle 2 may become:

Pull-up
Chest-to-Bar
Explosive Pull-up
Straight-Bar Dip

After another assessment:

Muscle-up prerequisites achieved.

Cycle 3 may become:

Transition Drill
Band-assisted Muscle-up
Low-bar Transition
Muscle-up Practice

The system must be capable of changing the roadmap completely when the user's state changes.

============================================================
25. TRAINING CYCLE
============================================================

Use hierarchy:

Long-Term Goal
    ↓
Training Roadmap
    ↓
Training Phase
    ↓
Training Cycle
    ↓
Training Week
    ↓
Workout Session
    ↓
Exercise
    ↓
Sets / Reps / Duration

Every new Periodic Assessment should be able to create a new:

Training Cycle

with:

- cycle ID
- assessment ID
- previous cycle ID
- current level
- current competencies
- goal
- skill gaps
- roadmap
- algorithm version
- start date
- end date
- generation reason

============================================================
26. TRAINING LOAD
============================================================

Track:

- sets
- reps
- duration
- exercise difficulty
- volume
- frequency
- weekly load
- adherence

Do not assume one universal training-load formula.

Create an extensible model.

The system must prevent excessive volume.

============================================================
27. PROGRESSION RULE
============================================================

Progression should consider:

- valid reps
- form
- ROM
- consistency
- performance trend
- number of successful sessions
- training load

Example:

A user should not automatically progress:

Assisted Pull-up
→ Pull-up

just because they completed the target reps once.

Instead require configurable criteria.

============================================================
28. INITIAL VS PERIODIC DATA PRIORITY
============================================================

When only Initial Assessment exists:

Use:

SELF_REPORTED DATA

When Periodic Assessment exists:

Use:

OBJECTIVE MEASURED DATA

with higher priority.

Do NOT delete historical self-reported data.

Maintain assessment history.

Store:

source
confidence
timestamp
assessment_id
version

============================================================
29. MEDIA PIPE ARCHITECTURE
============================================================

MediaPipe is responsible for body landmark extraction.

It should NOT independently determine:

- user level
- training roadmap
- exercise progression

Architecture:

Camera
→ MediaPipe Pose
→ Landmark Mapper
→ Feature Engine
→ Rule Engine
→ Performance Metrics
→ Assessment Engine

Feature Engine may calculate:

- joint angles
- ROM
- velocity
- tempo
- repetitions
- movement phases
- alignment
- stability

============================================================
30. GEMINI ROLE
============================================================

Gemini MUST NOT:

- determine official level
- invent thresholds
- invent prerequisites
- override Level Engine
- independently choose exercises
- override Rule Engine
- make medical diagnoses

Gemini SHOULD:

- explain assessment results
- explain why a user was promoted/maintained/regressed
- explain why exercises were recommended
- summarize progress
- generate user-friendly coaching text
- provide motivational explanations

Example input:

{
  "previousLevel": "BEGINNER",
  "newLevel": "INTERMEDIATE",
  "pullScore": 65,
  "formScore": 89,
  "performanceGate": "PASS",
  "skillGate": "PASS"
}

Gemini can generate:

"You have progressed to the Intermediate level because your pulling performance, movement quality, and required skill prerequisites have reached the configured criteria."

The decision itself MUST come from the deterministic Level Engine.

============================================================
31. HUMAN COACH ROLE
============================================================

Coach can:

- review assessment
- review competency
- review level decision
- review roadmap
- review training cycle
- modify training plan
- verify performance
- override recommendation

If Coach overrides an automatic recommendation, store:

- original decision
- coach decision
- coach ID
- reason
- timestamp

============================================================
32. LEVEL CONFIGURATION
============================================================

Design an Admin/Coach configuration system.

Admin/authorized Coach should be able to configure:

- level names
- level rank
- score ranges
- competency requirements
- performance thresholds
- quality thresholds
- skill requirements
- promotion criteria
- regression criteria
- stability criteria
- hysteresis thresholds
- exercise difficulty
- exercise prerequisites
- progression rules
- recommendation weights

Do NOT hard-code business rules into Java.

============================================================
33. DATABASE DESIGN
============================================================

Design a normalized MySQL schema.

At minimum include:

PHYSICAL PROFILE:

user_physical_profiles
physical_profile_history

ASSESSMENT:

assessment_templates
assessment_questions
assessment_options
assessment_answer_rules
initial_assessment_sessions
initial_assessment_answers

PERIODIC ASSESSMENT:

periodic_assessment_sessions
periodic_assessment_tests
periodic_assessment_results
periodic_assessment_metrics

COMPETENCY:

competencies
fitness_levels
fitness_level_requirements
user_competencies
user_competency_history

SKILL:

skills
skill_progressions
skill_prerequisites
user_skill_progress

EXERCISES:

exercises
exercise_competencies
exercise_difficulty
exercise_prerequisites
exercise_progressions
exercise_regressions

LEVEL EVALUATION:

level_evaluation_rules
level_evaluation_results

RECOMMENDATION:

recommendation_rules
recommendation_weights
recommendation_results
recommendation_reasons

TRAINING:

training_goals
training_roadmaps
training_phases
training_cycles
training_weeks
workout_sessions
workout_exercises
workout_sets

PERFORMANCE:

performance_records
performance_metrics

AUDIT:

rule_versions
assessment_versions
recommendation_versions

============================================================
34. IMPORTANT DATABASE RELATION
============================================================

The system must be able to prove:

"Training Cycle #2 was generated from Periodic Assessment #2."

Therefore:

training_cycles
must reference:

assessment_id

and:

previous_cycle_id

Also store:

algorithm_version

This is important for auditability and academic documentation.

============================================================
35. LEVEL EVALUATION RESULT
============================================================

Create a persistent record of every level evaluation.

Example:

level_evaluation_results

Fields:

id
user_id
assessment_id
previous_level
candidate_level
final_level

performance_gate
quality_gate
competency_gate
skill_gate
stability_gate

promotion_status
reason

algorithm_version
created_at

Possible promotion status:

PROMOTED
MAINTAINED
REGRESSED

This allows the system to explain exactly why a level changed.

============================================================
36. SPRING BOOT ARCHITECTURE
============================================================

Design clean Spring Boot architecture.

Suggested services:

InitialAssessmentService
AnswerNormalizationService
CompetencyScoringEngine
FitnessLevelEngine
LevelEvaluationService
SkillGapEngine
SkillReadinessEngine
ExerciseEligibilityEngine
RecommendationEngine
TrainingRoadmapEngine
TrainingCycleGenerator
ProgressionEngine
RegressionEngine
TrainingLoadEngine
PeriodicAssessmentService
AdaptiveTrainingService

Use appropriate patterns:

- Strategy Pattern
- Specification Pattern
- Rule Engine Pattern
- Factory Pattern where useful

Do NOT create one giant service containing all logic.

============================================================
37. REST API DESIGN
============================================================

Design APIs for:

Initial Assessment:

POST /api/assessments/initial/start
GET /api/assessments/initial/questions
POST /api/assessments/initial/answers
POST /api/assessments/initial/complete

Profile:

GET /api/users/{id}/fitness-profile
GET /api/users/{id}/competencies
GET /api/users/{id}/skills

Level:

GET /api/users/{id}/level
GET /api/users/{id}/level-history

Periodic Assessment:

POST /api/assessments/periodic/start
POST /api/assessments/periodic/results
POST /api/assessments/periodic/complete

Training:

GET /api/users/{id}/roadmap
GET /api/users/{id}/training-cycle
GET /api/users/{id}/workout

Adaptation:

POST /api/users/{id}/training-cycle/regenerate

Provide:

- HTTP method
- request DTO
- response DTO
- validation
- error handling
- authorization

============================================================
38. PSEUDOCODE
============================================================

Provide detailed pseudocode for:

A. Initial Assessment
B. Answer Normalization
C. Initial Competency Calculation
D. Initial Provisional Level
E. Periodic Assessment Processing
F. Competency Recalculation
G. Overall Level Evaluation
H. Competency Level Evaluation
I. Skill Readiness Evaluation
J. Performance Gate
K. Quality Gate
L. Skill Gate
M. Stability Gate
N. Hysteresis
O. Regression
P. Skill Gap Calculation
Q. Exercise Eligibility
R. Exercise Recommendation
S. Roadmap Generation
T. New Training Cycle Generation

============================================================
39. EXAMPLE END-TO-END SCENARIOS
============================================================

Provide at least 5 detailed scenarios.

SCENARIO 1:
New user with questionnaire only.

Show:

Answers
→ Competencies
→ Provisional Level
→ Goal
→ Initial orientation

SCENARIO 2:
User completes first Periodic Assessment.

Show:

MediaPipe data
→ Performance
→ Form
→ Competencies
→ Level evaluation
→ Skill gaps
→ NEW roadmap
→ NEW training cycle

SCENARIO 3:
User improves significantly.

Show:

Beginner
→ Intermediate

and explain all gates.

SCENARIO 4:
User has high overall score but weak Pull.

Show why:

Overall = Intermediate

but:

Pull = Beginner

and why advanced Pull skills remain locked.

SCENARIO 5:
User fails one assessment.

Show why the system does NOT immediately regress the user.

============================================================
40. EDGE CASES
============================================================

Handle:

- missing answers
- contradictory questionnaire answers
- unrealistic self-reported performance
- insufficient practical assessment data
- poor camera quality
- low MediaPipe confidence
- low landmark visibility
- invalid exercise detection
- sudden performance decline
- one bad session
- prolonged inactivity
- rapid improvement
- plateau
- no equipment
- limited training days
- short session duration
- goal change
- coach override
- rule version change

============================================================
41. SCIENTIFIC EVIDENCE POLICY
============================================================

This is a research-oriented academic project.

Clearly distinguish:

A. Scientific evidence
B. Coaching practice
C. CalisHealth product rules
D. User self-reported data
E. AI-generated explanation

Use high-quality sources where possible:

- ACSM
- NSCA
- PubMed
- systematic reviews
- peer-reviewed research
- relevant calisthenics literature

Do NOT invent scientific sources.

Do NOT claim:

"ACSM defines Calisthenics Intermediate as X pull-ups"

unless a source actually supports it.

If exact performance thresholds are not universally established:

- state that clearly
- make the threshold configurable
- document the source/type of rule
- allow Coach/Admin validation
- version the rule

============================================================
42. RULE SOURCE TYPE
============================================================

Each important rule should have a source type.

Example:

SCIENTIFIC_EVIDENCE
COACHING_BENCHMARK
PRODUCT_RULE
COACH_CONFIGURED
DATA_DERIVED

Store:

source_type
source_reference
rule_version

This allows CalisHealth to distinguish evidence from product configuration.

============================================================
43. EXPLAINABILITY
============================================================

Every Level decision must be explainable.

Example:

User:

Previous Level:
Beginner

New Level:
Intermediate

Reasons:

Performance Gate:
PASS

Movement Quality Gate:
PASS

Competency Gate:
PASS

Skill Gate:
PASS

Stability Gate:
PASS

Therefore:

PROMOTED

The system should be able to generate a structured explanation before sending it to Gemini.

============================================================
44. ADAPTIVE TRAINING PRINCIPLE
============================================================

The most important principle is:

The training plan must be generated from the user's CURRENT STATE, not permanently inherited from the Initial Assessment.

Therefore:

Initial Assessment
→ creates starting state.

Periodic Assessment
→ creates updated state.

Updated state
→ creates new training cycle.

Every new cycle must be traceable to its assessment.

============================================================
45. REQUIRED ARCHITECTURE DIAGRAMS
============================================================

Provide Mermaid diagrams for:

1. Overall system architecture
2. Initial Assessment flow
3. Periodic Assessment flow
4. Level Evaluation flow
5. Skill progression graph
6. Recommendation flow
7. Adaptive training loop
8. Database ERD
9. Sequence diagram for Periodic Assessment → New Training Cycle
10. Sequence diagram for Level Promotion
11. Activity diagram for Level Evaluation

============================================================
46. REQUIRED OUTPUT STRUCTURE
============================================================

Your final response MUST contain:

1. Executive Summary
2. Business Objectives
3. Design Principles
4. Assessment Model
5. Initial Questionnaire Design
6. Physical Profile
7. Competency Framework
8. Overall Level Framework
9. Competency Level Framework
10. Skill Readiness Framework
11. Level-Up Criteria
12. Performance Gate
13. Movement Quality Gate
14. Competency Gate
15. Skill Gate
16. Stability Gate
17. Regression Logic
18. Hysteresis
19. Skill Tree
20. Skill Gap Engine
21. Exercise Eligibility
22. Recommendation Engine
23. Roadmap Generator
24. Training Cycle Generator
25. Periodic Assessment Integration
26. MediaPipe Integration
27. Gemini Integration
28. Coach Integration
29. Database Design
30. ERD
31. Spring Boot Architecture
32. API Design
33. Pseudocode
34. End-to-End Examples
35. Edge Cases
36. Scientific Evidence Strategy
37. Rule Versioning
38. Auditability
39. Testing Strategy
40. Future Extensions

============================================================
47. CRITICAL RULES
============================================================

The final design MUST satisfy all of these:

1. Initial Assessment is SELF-REPORTED.
2. Initial Level is PROVISIONAL.
3. Periodic Assessment is PRACTICAL.
4. MediaPipe provides movement measurements.
5. Rule Engine evaluates objective movement criteria.
6. Measured performance has higher priority than self-reported data.
7. Overall Level is NOT determined only by average score.
8. Competencies are multi-dimensional.
9. Skills have prerequisites.
10. Advanced skills cannot be unlocked without prerequisites.
11. Level promotion requires multiple gates.
12. One bad session should not immediately reduce level.
13. Hysteresis must prevent level oscillation.
14. Level evaluation must be deterministic and explainable.
15. Gemini does NOT decide the level.
16. Gemini does NOT invent thresholds.
17. Every Periodic Assessment can generate a NEW training cycle.
18. Training Cycle #N must reference the assessment that generated it.
19. Historical assessments must never be overwritten.
20. Important rules must be configurable.
21. Important rules must be versioned.
22. Coach overrides must be auditable.
23. Training plans must respect user constraints.
24. The system must support future scientific refinement.
25. The architecture must be extensible to new exercises, skills, competencies, and assessment types.

============================================================
48. FINAL DESIGN PHILOSOPHY
============================================================

The final CalisHealth system should be summarized by this principle:

ASSESS
→ MEASURE
→ EVALUATE
→ IDENTIFY GAPS
→ PROGRESS
→ TRAIN
→ REASSESS
→ ADAPT

More specifically:

INITIAL QUESTIONNAIRE
=
Estimate starting point

PERIODIC PRACTICAL ASSESSMENT
=
Measure current ability

COMPETENCY ENGINE
=
Determine current physical capabilities

LEVEL ENGINE
=
Determine current proficiency

SKILL GAP ENGINE
=
Determine what prevents the user from progressing

RECOMMENDATION ENGINE
=
Determine what should be trained next

ROADMAP ENGINE
=
Determine the progression path

TRAINING CYCLE GENERATOR
=
Create the next concrete training program

GEMINI
=
Explain and communicate the decisions

HUMAN COACH
=
Review, validate, and override when necessary

The final result must be a professional adaptive calisthenics coaching architecture rather than a simple AI chatbot or fixed workout recommendation system.