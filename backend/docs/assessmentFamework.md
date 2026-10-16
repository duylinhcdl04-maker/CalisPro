You are a Senior Software Architect, Senior Java Spring Boot Backend Engineer,
Senior React Frontend Engineer, Database Architect, Fitness Assessment System
Designer, and AI Fitness System Architect.

You are designing and implementing the Assessment Framework for CalisHealth,
an AI-powered progressive Calisthenics training web application.

============================================================
1. PROJECT CONTEXT
============================================================

CalisHealth is a web-based personalized calisthenics training platform.

Technology stack:

Backend:
- Java
- Spring Boot
- Spring Data JPA
- REST API
- MySQL

Frontend:
- React
- TypeScript
- Modern component-based architecture

AI / Motion:
- MediaPipe Pose
- Rule Engine
- Gemini
- Viettel AI TTS

The Assessment Framework is responsible for:

1. Initial user assessment
2. Periodic practical assessment
3. Competency scoring
4. Fitness level evaluation
5. Skill readiness evaluation
6. Skill gap identification
7. Training roadmap generation
8. Training cycle generation
9. Adaptive training updates

============================================================
2. MOST IMPORTANT BUSINESS PRINCIPLE
============================================================

CalisHealth has TWO fundamentally different assessment types:

A. INITIAL ASSESSMENT

A questionnaire-based assessment.

The user does NOT perform exercises physically.

All performance information is self-reported.

Therefore:

INITIAL ASSESSMENT = PROVISIONAL ASSESSMENT

It estimates the user's starting point.

It must NOT pretend that self-reported data is objectively measured.

B. PERIODIC ASSESSMENT

A practical assessment performed with camera-based motion analysis.

The system uses:

Camera
→ MediaPipe Pose
→ Feature Engine
→ Rule Engine
→ Measured Performance
→ Movement Quality
→ Competency
→ Fitness Level

Therefore:

PERIODIC ASSESSMENT = OBJECTIVE / MEASURED ASSESSMENT

The system must clearly distinguish these two sources.

============================================================
3. DO NOT BUILD TWO COMPLETELY SEPARATE ASSESSMENT SYSTEMS
============================================================

Frontend should have TWO different user experiences:

1. Initial Fitness Questionnaire
2. Periodic Practical Assessment

However, Backend must use a shared Assessment Framework.

Architecture:

                    ASSESSMENT FRAMEWORK
                            |
              +-------------+-------------+
              |                           |
              v                           v
      INITIAL ASSESSMENT          PERIODIC ASSESSMENT
              |                           |
        Questionnaire                 Camera Test
              |                           |
       Self-reported data          MediaPipe + Rules
              |                           |
              +-------------+-------------+
                            |
                            v
                 Competency Evaluation
                            |
                            v
                    Fitness Level Engine
                            |
                            v
                    Current Fitness State
                            |
                            v
                       Skill Gap
                            |
                            v
                    Recommendation
                            |
                            v
                       Roadmap
                            |
                            v
                    Training Cycle

Use shared domain concepts and engines where possible.

Do NOT duplicate scoring, competency, level, skill gap,
or roadmap logic between Initial and Periodic Assessment.

============================================================
4. ASSESSMENT FRAMEWORK CORE MODEL
============================================================

Create a reusable Assessment Framework.

Core concepts:

Assessment
Assessment Type
Assessment Template
Assessment Version
Assessment Section
Assessment Item
Assessment Option
Assessment Answer
Assessment Session
Assessment Result
Assessment Metric
Assessment Evidence
Assessment Reliability
Assessment Status

Assessment types:

INITIAL
PERIODIC

Future extensibility should be possible for:

COACH
REASSESSMENT
SKILL_SPECIFIC
CUSTOM

Do not hardcode the architecture to only INITIAL and PERIODIC.

============================================================
5. INITIAL ASSESSMENT PURPOSE
============================================================

The Initial Assessment should answer:

1. What is the user's current self-reported physical capability?
2. What training experience do they have?
3. What are their current calisthenics skills?
4. What are their goals?
5. What equipment do they have?
6. How often can they train?
7. How long can they train per session?
8. What are their strongest competency areas?
9. What are their weakest competency areas?
10. What skills are currently ready / not ready?
11. What is the user's provisional fitness level?
12. How confident is the system in this estimate?
13. What should the user train first?

Initial Assessment must produce a STARTING STATE,
not a permanent long-term roadmap.

============================================================
6. INITIAL ASSESSMENT QUESTION GROUPS
============================================================

Design the questionnaire using logical sections.

SECTION 1 — BASIC PROFILE

Fields:

- Age
- Sex
- Height
- Weight
- Activity level

These values are contextual.

IMPORTANT:

Do NOT use:
- BMI
- height
- weight
- sex

as direct determinants of Push/Pull/Legs/Core fitness level.

They may influence:
- training recommendations
- exercise constraints
- workload
- context
- personalization

but they must not directly determine competency level.

============================================================
7. TRAINING EXPERIENCE
============================================================

Questions may include:

How long have you trained calisthenics?

Options:

- Never
- Less than 3 months
- 3–6 months
- 6–12 months
- More than 1 year

Training frequency:

- 0 days/week
- 1 day
- 2 days
- 3 days
- 4 days
- 5+
 
Resistance training experience:

- Never
- Rarely
- Sometimes
- Regularly
- Very regularly

These questions provide context and confidence,
but should not dominate competency scoring.

============================================================
8. SELF-REPORTED PERFORMANCE
============================================================

The questionnaire should estimate physical competencies.

Do NOT ask only:

"What is your level?"

Instead, ask measurable performance questions.

Examples:

PUSH:

Push-up maximum continuous reps:
- 0
- 1–5
- 6–10
- 11–20
- 21–30
- 31+

Dip:
- Cannot perform
- 1–3
- 4–6
- 7–10
- 11+

Pike Push-up:
- Cannot perform
- 1–3
- 4–6
- 7–10
- 11+

PULL:

Pull-up:
- 0
- 1–2
- 3–5
- 6–8
- 9–12
- 13+

Dead Hang:
- <10 sec
- 10–20 sec
- 21–30 sec
- 31–60 sec
- 61–90 sec
- 90+

Australian Row:
- Cannot perform
- 1–5
- 6–10
- 11–15
- 16+

LEGS:

Bodyweight Squat:
- 0–10
- 11–20
- 21–30
- 31–40
- 40+

Bulgarian Split Squat:
- Cannot perform
- 1–5
- 6–10
- 11–15
- 16+

CORE:

Plank:
- <20 sec
- 20–40
- 41–60
- 61–90
- 91–120
- 120+

Hollow Body Hold:
- Cannot perform
- <20 sec
- 20–40
- 41–60
- 60+

The actual thresholds must be configurable.

Do not hardcode these examples as scientific universal standards.

============================================================
9. MOBILITY QUESTIONS
============================================================

Mobility should not rely only on:

"Are you flexible?"

Use functional self-report questions.

Examples:

Can you perform a deep squat while keeping your heels on the floor?

Can you raise your arms overhead without discomfort and without
excessive trunk compensation?

Can you maintain a stable overhead position?

Answers may use:

- Cannot
- Difficult
- Can perform
- Easy
- Very easy

Mobility scores must have lower confidence than objective
camera-measured mobility unless validated later.

============================================================
10. SKILL QUESTIONS
============================================================

Calisthenics skills must be evaluated separately from general strength.

Examples:

Pull-up:
- Not started
- Assisted
- Negative
- 1–2 strict reps
- 3–5 strict reps
- 5+

Handstand:
- Not started
- Wall-assisted
- 10–20 sec
- 20–40 sec
- 40–60 sec
- 60+

L-sit:
- Not started
- Tuck
- 5–10 sec
- 10–20 sec
- 20+

Muscle-up:
- Not started
- Working on prerequisites
- Band-assisted
- Transition practice
- 1 strict rep
- 2–3+
 
Skill readiness must NOT be calculated simply by averaging
skill questions.

Use prerequisite relationships.

============================================================
11. FORM CONFIDENCE
============================================================

Add questions that estimate how confident the user is in their form.

Example:

"How confident are you that your Push-up form is technically correct?"

Options:

- Not confident
- Slightly confident
- Moderately confident
- Very confident
- Extremely confident

This should affect reliability/confidence,
not directly inflate physical ability.

============================================================
12. GOAL PROFILE
============================================================

The Initial Assessment must collect goals.

Examples:

- General fitness
- Strength
- Muscle gain
- Fat loss
- Pull-up
- Handstand
- L-sit
- Muscle-up
- Planche
- Front Lever
- Other

Allow:

Primary Goal
Secondary Goals

Also collect:

- Training days/week
- Session duration
- Equipment
- Preferred training style

These values are critical for roadmap generation.

============================================================
13. DATA NORMALIZATION
============================================================

All answer values must be normalized to a common scale.

Recommended:

0–100

Example:

Push-up:
0 reps → 0
5 reps → configured score
10 reps → configured score
20 reps → configured score
30 reps → configured score

Do not hardcode normalization logic directly inside controllers.

Create:

AnswerNormalizationService

and configurable:

assessment_answer_rules

The system must support:

- range answers
- categorical answers
- boolean answers
- duration answers
- repetition answers
- skill states

============================================================
14. QUESTION WEIGHTS
============================================================

Each assessment item should support:

questionWeight

Example:

Push-up performance:
0.40

Dip:
0.25

Pike Push-up:
0.20

Training experience:
0.15

The weights must be configurable.

Do not hardcode them inside Java services.

============================================================
15. RELIABILITY
============================================================

Every answer should have a reliability contribution.

Possible source reliability categories:

HIGH
MEDIUM
LOW

Examples:

Self-reported measurable performance:
HIGH/MEDIUM

Training experience:
MEDIUM

Subjective confidence:
LOW/MEDIUM

General subjective self-assessment:
LOW

Do NOT present these as universal scientific constants.

They are configurable product parameters.

============================================================
16. COMPETENCY SCORING
============================================================

The system must calculate competency scores separately.

Recommended competencies:

PUSH
PULL
LEGS
CORE
MOBILITY
SKILL

Future extensibility:

ENDURANCE
POWER
BALANCE
CONTROL

Formula:

CompetencyScore =
Σ(
    NormalizedAnswerScore
    × QuestionWeight
    × Reliability
)
/
Σ(
    QuestionWeight
    × Reliability
)

Return:

score
confidence
source
trend
lastAssessedAt
assessmentId

Example:

Push:
score = 65
confidence = 0.72
source = SELF_REPORTED

Pull:
score = 38
confidence = 0.70
source = SELF_REPORTED

============================================================
17. CONTRADICTION DETECTION
============================================================

The system must detect inconsistent answers.

Example:

Training experience:
"Never trained"

Pull-up:
"15 strict reps"

This should not silently pass.

Mark:

dataQuality = CONFLICTED

and reduce confidence.

Possible actions:

- request clarification
- flag for future practical assessment
- keep provisional score but lower confidence

Do NOT simply delete the answer.

============================================================
18. INITIAL FITNESS LEVEL
============================================================

Initial level must be:

PROVISIONAL

Recommended CalisHealth taxonomy:

L0 Foundation
L1 Beginner
L2 Intermediate
L3 Advanced
L4 Elite

These are CalisHealth product levels,
NOT universal scientific standards.

Do not claim that ACSM or another organization defines these
exact five calisthenics levels.

Scientific literature should inform training principles,
not falsely define exact CalisHealth thresholds.

============================================================
19. OVERALL SCORE
============================================================

Calculate:

OverallScore =
Push × W_push
+
Pull × W_pull
+
Legs × W_legs
+
Core × W_core
+
Mobility × W_mobility
+
Skill × W_skill

Weights must be configurable.

Do NOT use simple average only.

============================================================
20. LEVEL GATES
============================================================

Never determine level using:

OverallScore >= threshold

alone.

Use:

Overall Score
+
Competency Gates
+
Skill Gates
+
Data Confidence

Example:

Intermediate may require:

OverallScore >= configured threshold

AND:

Push >= required threshold
Pull >= required threshold
Legs >= required threshold
Core >= required threshold

The exact values must be configurable.

Example values are product configuration,
not universal scientific standards.

============================================================
21. PROVISIONAL LEVEL OUTPUT
============================================================

Example:

OverallScore:
57

Candidate Level:
INTERMEDIATE

But:

Pull:
38

Required Pull:
45

Therefore:

Final Provisional Level:
BEGINNER

Reason:

"Overall score is sufficient for Intermediate,
but Pull competency does not meet the minimum requirement."

Return:

{
  "level": "BEGINNER",
  "status": "PROVISIONAL",
  "overallScore": 57,
  "confidence": 0.68,
  "candidateLevel": "INTERMEDIATE",
  "gates": {
      "overall": "PASS",
      "push": "PASS",
      "pull": "FAIL",
      "legs": "PASS",
      "core": "PASS"
  }
}

============================================================
22. CURRENT FITNESS STATE
============================================================

Do not treat Level as the complete user state.

Create:

CurrentFitnessState

containing:

- overallLevel
- overallScore
- competencyScores
- competencyLevels
- confidence
- skillReadiness
- skillGaps
- strengths
- weaknesses
- trainingExperience
- goalProfile
- equipment
- availability
- recentAssessment
- assessmentSource
- assessmentDate

This state becomes the main input for roadmap generation.

============================================================
23. SKILL READINESS
============================================================

Create a separate Skill Readiness Engine.

Example progression:

Dead Hang
    ↓
Scapular Pull-up
    ↓
Australian Row
    ↓
Negative Pull-up
    ↓
Assisted Pull-up
    ↓
Pull-up
    ↓
Chest-to-Bar
    ↓
Explosive Pull-up
    ↓
Straight Bar Dip
    ↓
Transition
    ↓
Band Muscle-up
    ↓
Muscle-up

Do not allow a user to directly receive an advanced skill
if prerequisites are not satisfied.

Example:

Overall Level:
Intermediate

Muscle-up:
NOT READY

Reason:
Explosive Pull prerequisite not satisfied.

============================================================
24. SKILL GAP ENGINE
============================================================

Compare:

Current State
vs
Goal Requirements

Example:

Goal:
Muscle-up

Current:
Pull-up = not ready
Explosive pull = not ready
Straight bar dip = ready
Core = ready

Skill gaps:

1. Vertical pulling strength
2. Explosive pulling
3. Transition control

The system must rank skill gaps by importance.

============================================================
25. EXERCISE ELIGIBILITY
============================================================

Before recommending an exercise, check:

1. Goal relevance
2. Skill gap relevance
3. Prerequisites
4. Difficulty
5. Current competency
6. Equipment
7. Recent performance
8. Training load
9. Recovery considerations
10. User availability

An exercise with failed prerequisites should be excluded.

============================================================
26. RECOMMENDATION SCORE
============================================================

Use configurable weighted scoring.

Example:

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

Do not randomly recommend exercises.

============================================================
27. ROADMAP GENERATION
============================================================

Initial roadmap must be generated from:

Primary Goal
+
Current Fitness State
+
Competency Profile
+
Skill Gaps
+
Prerequisites
+
Equipment
+
Training Days
+
Session Duration

Hierarchy:

Long-Term Goal
    ↓
Roadmap
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

============================================================
28. INITIAL ROADMAP SHOULD BE PROVISIONAL
============================================================

Do NOT generate a permanent 6–12 month rigid plan
based only on a questionnaire.

Generate an initial training cycle.

Example:

Initial Assessment
    ↓
Initial Roadmap
    ↓
Training Cycle 1
    ↓
2–4 weeks
    ↓
Periodic Assessment
    ↓
Measured Fitness State
    ↓
NEW Training Cycle

The initial questionnaire determines the starting direction,
not the final long-term progression.

============================================================
29. PERIODIC ASSESSMENT
============================================================

Periodic Assessment must be a separate practical workflow.

Example:

User starts:

Push Assessment

Camera
    ↓
MediaPipe Pose
    ↓
Feature Engine
    ↓
Rule Engine
    ↓
Valid / Invalid Reps
    ↓
Movement Quality
    ↓
Performance Metrics

Metrics may include:

- total reps
- valid reps
- invalid reps
- ROM
- form score
- tempo
- stability
- alignment
- symmetry
- hold duration
- pose confidence
- landmark visibility
- rep consistency

============================================================
30. PERIODIC ASSESSMENT RELIABILITY
============================================================

If:

- pose confidence is too low
- landmarks are not visible
- camera angle is invalid
- exercise recognition is unreliable
- data is incomplete

do NOT automatically promote or regress the user.

Return:

RETEST_REQUIRED

Example:

{
  "status": "RETEST_REQUIRED",
  "reason": "Insufficient landmark visibility"
}

============================================================
31. PERIODIC ASSESSMENT LEVEL ENGINE
============================================================

Periodic level evaluation must use:

Performance Gate
+
Movement Quality Gate
+
Competency Gate
+
Skill Gate
+
Stability Gate
+
Reliability Gate

Do not use:

OverallScore >= threshold

alone.

Example:

IF all gates PASS:

    candidateLevel = new level

ELSE:

    maintain current level

Regression requires persistent decline,
not one bad session.

Use hysteresis.

Example concept:

Promotion threshold:
70

Regression threshold:
60

These are configurable examples,
not universal scientific thresholds.

============================================================
32. INITIAL VS PERIODIC DATA PRIORITY
============================================================

Data source priority:

COACH_VERIFIED
    >
AI_MEASURED
    >
SELF_REPORTED

If objective measured data exists,
it should take precedence over self-reported estimates.

Do NOT simply average:

Initial Score
+
Periodic Score

Instead:

Periodic assessment should update the current measured state.

Historical initial data remains stored for comparison.

============================================================
33. EVERY PERIODIC ASSESSMENT MUST TRIGGER A NEW STATE
============================================================

This is a mandatory business rule.

Every completed Periodic Assessment must:

1. Recalculate current competencies
2. Recalculate fitness level
3. Recalculate skill readiness
4. Recalculate skill gaps
5. Recalculate exercise eligibility
6. Generate/update roadmap
7. Generate a NEW training cycle

This must happen even if:

- Level stays the same
- Level decreases
- Level increases

Level is only one output.

Current Fitness State is the main input to the new training cycle.

============================================================
34. TRAINING CYCLE VERSIONING
============================================================

Each training cycle must reference:

- assessmentId
- previousCycleId
- algorithmVersion
- generationReason
- startDate
- endDate
- status

Example:

Training Cycle #1
assessmentId = INITIAL_001

Training Cycle #2
assessmentId = PERIODIC_001
previousCycleId = CYCLE_001

Training Cycle #3
assessmentId = PERIODIC_002
previousCycleId = CYCLE_002

============================================================
35. DATABASE DESIGN
============================================================

Create a normalized MySQL schema.

Core assessment tables:

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

Initial-specific:

initial_assessment_sessions
initial_assessment_answers
initial_assessment_results

Periodic-specific:

periodic_assessment_sessions
periodic_assessment_tests
periodic_assessment_metrics
periodic_assessment_results

Competency:

competencies
fitness_levels
fitness_level_requirements
user_competencies
user_competency_history

Skills:

skills
skill_progressions
skill_prerequisites
user_skill_progress

Roadmap:

training_goals
training_roadmaps
training_phases
training_cycles
training_weeks
workout_sessions
workout_exercises
workout_sets

Versioning:

assessment_versions
algorithm_versions
rule_versions
level_evaluation_results

============================================================
36. SHARED ASSESSMENT DATA MODEL
============================================================

Use common concepts:

AssessmentTemplate
AssessmentVersion
AssessmentSection
AssessmentItem
AssessmentSession
AssessmentResult

But allow different execution modes.

Example:

executionMode:

QUESTIONNAIRE
PRACTICAL

Assessment Type:

INITIAL
PERIODIC

Example:

INITIAL:
executionMode = QUESTIONNAIRE

PERIODIC:
executionMode = PRACTICAL

============================================================
37. SPRING BOOT SERVICE ARCHITECTURE
============================================================

Use separate services.

Initial:

InitialAssessmentService
AnswerNormalizationService
InitialCompetencyScoringService
InitialLevelEvaluationService

Periodic:

PeriodicAssessmentService
PeriodicAssessmentEvaluationService
MovementAssessmentService

Shared:

AssessmentTemplateService
AssessmentVersionService
CompetencyScoringEngine
FitnessLevelEngine
SkillReadinessEngine
SkillGapEngine
ExerciseEligibilityEngine
RecommendationEngine
TrainingRoadmapEngine
TrainingCycleGenerator
AssessmentReliabilityService

Do NOT create one giant:

AssessmentService

============================================================
38. FRONTEND ARCHITECTURE
============================================================

Create separate experiences.

Initial:

/assessment/initial

Periodic:

/assessment/periodic

Shared components:

AssessmentProgress
AssessmentSection
QuestionRenderer
AssessmentSummary
CompetencyResult
LevelResult
SkillGapResult

Initial-specific:

QuestionnaireRenderer
SelfReportedPerformanceInput

Periodic-specific:

CameraAssessment
ExerciseTest
LiveMotionFeedback
AssessmentMetrics

Do not force both workflows into one giant React component.

============================================================
39. INITIAL QUESTIONNAIRE UX
============================================================

Recommended flow:

Welcome
    ↓
Basic Profile
    ↓
Training Experience
    ↓
Push
    ↓
Pull
    ↓
Legs
    ↓
Core
    ↓
Mobility
    ↓
Skills
    ↓
Goals
    ↓
Equipment
    ↓
Training Availability
    ↓
Review Answers
    ↓
Complete Assessment
    ↓
Assessment Result
    ↓
Initial Roadmap

Show progress:

Step 4 of 10

Allow save/resume.

============================================================
40. INITIAL RESULT SCREEN
============================================================

Show:

Overall Level:
BEGINNER

Status:
PROVISIONAL

Confidence:
Medium

Competencies:

Push:
65

Pull:
38

Legs:
70

Core:
60

Mobility:
65

Skill:
30

Strengths:
- Legs
- Push

Areas to improve:
- Pull
- Skill

Goal:
Muscle-up

Skill Gap:
- Pulling strength
- Explosive pulling

Then:

"Your first training cycle"

Do not overstate certainty.

Use language:

"Based on your answers..."

"Initial estimate..."

"Your level will be refined through practical assessments."

============================================================
41. PERIODIC RESULT SCREEN
============================================================

Show:

Previous State
vs
Current Measured State

Example:

Push:
65 → 72

Pull:
38 → 55

Core:
60 → 67

Level:

BEGINNER → INTERMEDIATE

Decision:

PROMOTED

or:

MAINTAINED

or:

REGRESSED

or:

RETEST_REQUIRED

Then explain:

Which gates passed/failed.

============================================================
42. EXPLAINABILITY
============================================================

The system must be able to answer:

Why was the user assigned this level?

Which competencies contributed?

Which gate prevented promotion?

Which assessment produced the decision?

Which algorithm version was used?

Which rules were used?

Why was this exercise recommended?

Why was another exercise excluded?

Store reasons.

Example:

"Intermediate was not assigned because Pull competency
did not meet the minimum requirement."

============================================================
43. ASSESSMENT VERSIONING
============================================================

Every assessment template must be versioned.

Example:

Initial Assessment v1.0

If questions change:

v1.1

Do not silently modify existing assessment versions.

Historical results must reference the exact assessment version.

============================================================
44. ALGORITHM VERSIONING
============================================================

Store:

algorithmVersion

Example:

FITNESS_LEVEL_ENGINE_V1

ROADMAP_ENGINE_V1

COMPETENCY_ENGINE_V1

This allows future changes without invalidating historical results.

============================================================
45. COACH OVERRIDE
============================================================

Future Coach functionality must be supported.

If Coach changes a system decision:

Store:

systemDecision
coachDecision
coachId
reason
timestamp

Do not overwrite the original algorithm result.

============================================================
46. REST API
============================================================

Initial:

POST /api/assessments/initial/start

GET /api/assessments/initial/questions

POST /api/assessments/initial/answers

POST /api/assessments/initial/complete

GET /api/users/{userId}/fitness-profile

Periodic:

POST /api/assessments/periodic/start

GET /api/assessments/periodic/tests

POST /api/assessments/periodic/test-result

POST /api/assessments/periodic/complete

Results:

GET /api/users/{userId}/competencies

GET /api/users/{userId}/level

GET /api/users/{userId}/level-history

GET /api/users/{userId}/skill-readiness

GET /api/users/{userId}/skill-gaps

Roadmap:

GET /api/users/{userId}/roadmap

GET /api/users/{userId}/training-cycle

POST /api/users/{userId}/training-cycle/regenerate

============================================================
47. SAMPLE INITIAL ASSESSMENT RESULT
============================================================

Example:

{
  "assessmentType": "INITIAL",
  "executionMode": "QUESTIONNAIRE",
  "source": "SELF_REPORTED",
  "status": "PROVISIONAL",

  "overallScore": 48,

  "level": {
    "candidate": "INTERMEDIATE",
    "final": "BEGINNER",
    "status": "PROVISIONAL"
  },

  "competencies": {
    "PUSH": 65,
    "PULL": 38,
    "LEGS": 70,
    "CORE": 60,
    "MOBILITY": 65,
    "SKILL": 30
  },

  "confidence": 0.68,

  "strengths": [
    "LEGS",
    "PUSH"
  ],

  "weaknesses": [
    "PULL",
    "SKILL"
  ],

  "goal": "MUSCLE_UP",

  "skillGaps": [
    "PULLING_STRENGTH",
    "EXPLOSIVE_PULL",
    "TRANSITION_CONTROL"
  ]
}

============================================================
48. SAMPLE PERIODIC ASSESSMENT RESULT
============================================================

{
  "assessmentType": "PERIODIC",
  "executionMode": "PRACTICAL",
  "source": "AI_MEASURED",

  "reliability": "HIGH",

  "competencies": {
    "PUSH": 72,
    "PULL": 55,
    "LEGS": 74,
    "CORE": 67,
    "MOBILITY": 64,
    "SKILL": 48
  },

  "previousLevel": "BEGINNER",

  "candidateLevel": "INTERMEDIATE",

  "finalLevel": "INTERMEDIATE",

  "decision": "PROMOTED",

  "gates": {
    "performance": "PASS",
    "quality": "PASS",
    "competency": "PASS",
    "skill": "PASS",
    "stability": "PASS",
    "reliability": "PASS"
  },

  "algorithmVersion": "FITNESS_LEVEL_ENGINE_V1"
}

============================================================
49. SECURITY AND PERMISSIONS
============================================================

Member:

- complete own assessment
- view own results
- view own fitness profile
- view own roadmap

Coach:

- view assigned users
- review assessments
- verify results
- optionally override system decision

Admin:

- manage assessment templates
- manage assessment versions
- manage scoring rules
- manage level requirements
- manage question weights
- manage normalization rules
- manage algorithm configuration

Do not allow normal users to modify scoring rules.

============================================================
50. EDGE CASES
============================================================

Handle:

1. User abandons questionnaire
2. User resumes questionnaire
3. User changes answer
4. User submits contradictory answers
5. User skips optional question
6. No equipment
7. Very low experience
8. Very high self-reported performance
9. Invalid periodic camera data
10. Low pose confidence
11. Missing landmarks
12. Assessment version changed
13. Rule version changed
14. User has no previous assessment
15. User has multiple goals
16. User changes goals
17. User stops training for a long period
18. User regresses
19. User maintains level
20. User cannot complete a periodic test

============================================================
51. IMPORTANT NON-GOALS
============================================================

Do NOT:

- use BMI as a direct fitness level formula
- use age alone to determine level
- use gender alone to determine level
- use a single exercise to determine overall level
- use self-reported level as truth
- use a simple average as the final level decision
- permanently lock the user to the initial roadmap
- allow Gemini to decide fitness level
- allow Gemini to define movement thresholds
- randomly recommend advanced exercises
- promote users after one unreliable practical assessment

============================================================
52. COMPLETE END-TO-END FLOW
============================================================

INITIAL:

Register
    ↓
First Login
    ↓
Mandatory Initial Questionnaire
    ↓
Normalize Answers
    ↓
Check Contradictions
    ↓
Calculate Competencies
    ↓
Calculate Provisional Level
    ↓
Calculate Confidence
    ↓
Determine Skill Readiness
    ↓
Determine Skill Gaps
    ↓
Check Exercise Eligibility
    ↓
Generate Initial Roadmap
    ↓
Generate Training Cycle #1
    ↓
User Trains

PERIODIC:

Training
    ↓
Periodic Assessment
    ↓
Camera
    ↓
MediaPipe
    ↓
Feature Engine
    ↓
Rule Engine
    ↓
Measured Performance
    ↓
Movement Quality
    ↓
Competency Engine
    ↓
Fitness Level Engine
    ↓
Skill Readiness
    ↓
Skill Gap
    ↓
Exercise Eligibility
    ↓
Roadmap Generator
    ↓
NEW Training Cycle

This new cycle must be generated even if:

Level = MAINTAINED

or:

Level = REGRESSED

or:

Level = PROMOTED

because the user's current fitness state may have changed
without changing the overall level.

============================================================
53. OUTPUT REQUIREMENTS
============================================================

Before writing code, provide:

1. Architecture diagram
2. Domain model
3. ERD
4. Assessment state machine
5. Initial assessment flow
6. Periodic assessment flow
7. Competency scoring algorithm
8. Initial level calculation algorithm
9. Periodic level calculation algorithm
10. Skill readiness algorithm
11. Skill gap algorithm
12. Exercise eligibility algorithm
13. Recommendation algorithm
14. Roadmap generation algorithm
15. Training cycle generation algorithm
16. Database schema
17. REST API specification
18. Spring Boot package structure
19. React component structure
20. DTO definitions
21. Validation rules
22. Example JSON
23. Unit tests
24. Integration tests
25. Edge case handling

Then implement incrementally.

Do not generate a superficial CRUD-only implementation.

The system must represent real domain logic.

============================================================
54. FINAL ARCHITECTURAL PRINCIPLE
============================================================

Remember these distinctions:

INITIAL ASSESSMENT
=
Self-reported
+
Provisional
+
Starting point

PERIODIC ASSESSMENT
=
Camera-measured
+
Rule Engine
+
Objective performance

FITNESS LEVEL
=
Not a single score

CURRENT FITNESS STATE
=
More important than level for roadmap generation

ROADMAP
=
Goal + Current State + Skill Gap + Constraints

TRAINING CYCLE
=
A temporary adaptive plan generated from the current state

Every Periodic Assessment
=
Re-evaluate current state
+
Generate new training cycle

The system must be explainable, configurable, versioned,
auditable, deterministic where appropriate, and extensible.