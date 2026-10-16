You are a Senior Software Architect, Backend Engineer, Frontend Engineer,
AI Motion Analysis Architect, and UX/UI Designer.

You are designing and implementing the Exercise Motion Rule Engine module
for CalisHealth, an AI-powered calisthenics coaching platform.

TECH STACK
- Backend: Java Spring Boot
- Frontend: React
- Database: MySQL
- Motion Analysis: MediaPipe Pose
- AI Explanation Layer: Gemini
- Text-to-Speech: Viettel AI

============================================================
1. CORE OBJECTIVE
============================================================

Build a professional, configurable, deterministic Exercise Motion Rule Engine.

The system must allow Admin/Coach to configure how an exercise movement
is measured, what constitutes correct/incorrect movement, how severe
a violation is, how long the violation must persist before triggering,
whether the repetition becomes invalid, and what feedback should be
returned to the user.

The Rule Engine will be used during:

1. Real-time AI coaching
2. Exercise repetition validation
3. Movement quality scoring
4. Periodic Assessment
5. Fitness competency evaluation

The same Motion Rules must be reusable across all these contexts.

IMPORTANT:

The Rule Engine is NOT Gemini.

The Rule Engine is deterministic and must be the source of truth
for movement correctness.

Gemini must NOT:
- calculate joint angles
- determine thresholds
- invent movement standards
- override configured rules
- decide whether a movement is valid
- determine fitness level
- determine competency
- directly modify exercise rules

Gemini may only explain validated violations and generate
human-friendly coaching feedback when necessary.

Viettel AI is only responsible for Text-to-Speech.

============================================================
2. HIGH-LEVEL ARCHITECTURE
============================================================

Implement the following architecture:

USER CAMERA
    ↓
MediaPipe Pose
    ↓
33 Body Landmarks
    ↓
Landmark Mapper
    ↓
Feature Engine
    ↓
Motion Features
    ↓
Rule Engine
    ↓
Rule Evaluation Result
    ↓
Violation Aggregator
    ↓
Feedback Decision
    ↓
 ┌─────────────────────────────┐
 │                             │
Simple known violation     Complex/contextual violation
 │                             │
Pre-generated Audio            Gemini
 │                             ↓
 │                         Feedback Text
 │                             ↓
 │                         Viettel AI
 │                             ↓
 └─────────────── Audio ───────┘
                     ↓
                   USER

The system must NOT send every MediaPipe frame to Gemini.

MediaPipe and Feature Engine operate at high frequency.

Rule Engine evaluates locally/deterministically.

Only validated events should reach Gemini.

Common feedback should use pre-generated audio whenever possible.

============================================================
3. IMPORTANT DOMAIN DISTINCTION
============================================================

Separate these concepts:

A. Exercise
B. Motion Profile
C. Motion Phase
D. Metric
E. Rule
F. Threshold
G. Feedback
H. Audio
I. Rule Version

Relationship:

Exercise
    ↓
Motion Profile
    ↓
Phases
    ↓
Metrics
    ↓
Rules
    ↓
Thresholds + Evaluation Logic
    ↓
Feedback Code
    ↓
Feedback Template
    ↓
Audio Asset

Example:

Push-up
    ↓
Standard Push-up Motion Profile v1
    ↓
BOTTOM phase
    ↓
Elbow Angle metric
    ↓
Elbow ROM Rule
    ↓
Thresholds
    ↓
PUSHUP_ELBOW_ROM_ERROR
    ↓
Feedback Template
    ↓
Pre-generated Viettel AI Audio

============================================================
4. EXISTING UI TO PRESERVE
============================================================

The existing UI already contains a form similar to:

- Rule Code
- Rule Display Name
- Movement Phase
- Metric Type
- Landmark A
- Landmark B
- Landmark C
- Operator
- Minimum/Target Value
- Maximum Value
- Tolerance
- Severity
- Detailed UI Guidance
- Short Voice Prompt
- Invalid Rep flag
- Priority

Keep the useful concepts.

However, redesign the structure where necessary.

Do NOT blindly preserve the existing "Min/Val + Max + Tolerance"
concept because it is ambiguous.

Replace it with explicit threshold semantics.

============================================================
5. EXERCISE CONTEXT
============================================================

The Admin/Coach should first select an Exercise.

Example:

Exercise:
PUSH-UP

The Rule form is therefore created inside the selected exercise.

The Rule must not need a second exercise selector if the page context
already identifies the exercise.

Display the selected exercise clearly at the top:

Exercise:
Push-up

Motion Profile:
Standard Push-up v1.0

Rule Code:
PUSHUP_ELBOW_FLARE_001

============================================================
6. MOTION PROFILE
============================================================

Introduce a Motion Profile layer.

A Motion Profile defines the overall movement model of an exercise.

Example:

PUSH-UP
    ↓
Standard Push-up Motion Profile v1
    ↓
Required landmarks
Movement phases
Reference camera view
Supported metrics
Rep state machine
Motion rules

Motion Profile should contain:

- profile ID
- exercise ID
- profile name
- version
- description
- camera view
- required landmarks
- supported phases
- rep detection configuration
- active status
- version status

Example phases:

START
TOP
DESCENDING
BOTTOM
ASCENDING
HOLD
TRANSITION
END

Not every exercise needs every phase.

============================================================
7. RULE FORM STRUCTURE
============================================================

Redesign the current form into logical sections.

SECTION 1 — RULE INFORMATION

Fields:

- Rule Code
- Rule Display Name
- Description
- Phase
- Severity
- Priority
- Active status

Example:

Rule Code:
PUSHUP_ELBOW_FLARE_001

Rule Name:
Khuỷu tay xòe quá rộng

Phase:
BOTTOM

Severity:
WARNING

Priority:
8

============================================================
8. SECTION 2 — MEASUREMENT DEFINITION
============================================================

This section defines WHAT is being measured.

Fields:

Metric Type
Unit
Reference Landmarks
Camera View
Measurement Direction if applicable

Supported Metric Types should include:

1. ANGLE_3_POINT
2. DISTANCE
3. ROM
4. ALIGNMENT
5. SYMMETRY
6. VELOCITY
7. ACCELERATION
8. TEMPO
9. DURATION
10. STABILITY
11. LANDMARK_VISIBILITY
12. POSE_CONFIDENCE
13. REP_SEQUENCE
14. REP_VALIDATION

The UI must dynamically change based on Metric Type.

Example:

If Metric Type = ANGLE_3_POINT:

A = LEFT_SHOULDER
B = LEFT_ELBOW
C = LEFT_WRIST

The system calculates:

angle(A, B, C)

If Metric Type = DISTANCE:

Point A
Point B

The system calculates:

distance(A, B)

If Metric Type = ALIGNMENT:

Allow selection of:
- landmark set
- reference axis/plane
- deviation calculation method

If Metric Type = SYMMETRY:

Allow:
- left landmark
- right landmark
- reference point/axis

If Metric Type = ROM:

Allow:
- joint
- start position
- end position
- reference axis

Do not force A/B/C fields for every metric.

============================================================
9. LANDMARK SELECTION
============================================================

Use MediaPipe Pose landmark definitions.

Do not allow arbitrary text for landmarks.

Use structured selection.

Example:

A:
LEFT_SHOULDER

B:
LEFT_ELBOW

C:
LEFT_WRIST

The frontend must display both:

- landmark ID
- human-readable name

Example:

#11 — LEFT_SHOULDER
#13 — LEFT_ELBOW
#15 — LEFT_WRIST

The backend stores stable landmark identifiers.

Never let Gemini infer landmark IDs.

============================================================
10. SECTION 3 — STANDARD / TARGET RANGE
============================================================

This is the MOST IMPORTANT section.

The existing:

"Minimum / Target + Maximum + Tolerance"

must be replaced with explicit threshold semantics.

Use:

TARGET VALUE
NORMAL MIN
NORMAL MAX

Example:

Target:
60°

Normal Min:
45°

Normal Max:
70°

Meaning:

45° <= observed value <= 70°

is NORMAL.

Target represents the ideal/reference value.

Normal Range represents the acceptable technically correct range.

Do NOT automatically assume Target = Normal midpoint.

============================================================
11. WARNING / ERROR / CRITICAL THRESHOLDS
============================================================

Allow explicit configuration for:

NORMAL
WARNING
ERROR
CRITICAL

Example:

NORMAL:
45°–70°

WARNING:
40°–44°
71°–75°

ERROR:
30°–39°
76°–85°

CRITICAL:
<30°
>85°

The backend must NOT guess these values.

All thresholds must be explicitly configured.

The system must validate that threshold ranges do not overlap
unless overlapping behavior is explicitly supported.

Recommended UI:

Severity | Lower Bound | Upper Bound | Meaning

NORMAL
WARNING
ERROR
CRITICAL

For open-ended conditions, support:
- < value
- <= value
- > value
- >= value

============================================================
12. REMOVE AMBIGUOUS TOLERANCE
============================================================

Do not use:

Tolerance ±5

as the primary source of truth.

If a tolerance field is retained for UX convenience, it must have
explicit semantics.

Example:

Target = 60°
Tolerance = 5°

could automatically suggest:

55°–65°

BUT the generated values must still be displayed explicitly as:

Normal Min = 55°
Normal Max = 65°

The backend must store the actual threshold values.

Never make runtime evaluation depend on an ambiguous "tolerance"
field.

============================================================
13. OPERATOR
============================================================

Support:

EQUAL
NOT_EQUAL
LESS_THAN
LESS_THAN_OR_EQUAL
GREATER_THAN
GREATER_THAN_OR_EQUAL
BETWEEN
OUTSIDE
DEVIATION_FROM_TARGET
MINIMUM_REQUIRED
MAXIMUM_ALLOWED

The available operators must depend on Metric Type.

Example:

ANGLE:
BETWEEN
LESS_THAN
GREATER_THAN
DEVIATION_FROM_TARGET

ROM:
MINIMUM_REQUIRED

DURATION:
MINIMUM_REQUIRED

POSE_CONFIDENCE:
MINIMUM_REQUIRED

============================================================
14. UNIT
============================================================

Every numeric metric must have an explicit unit.

Examples:

ANGLE:
degrees

DISTANCE:
normalized distance / pixels / meters depending on implementation

ROM:
degrees

TEMPO:
seconds

VELOCITY:
normalized units per second

DURATION:
milliseconds or seconds

The frontend must display units clearly.

The backend must normalize units before rule evaluation.

============================================================
15. TEMPORAL LOGIC
============================================================

Add:

Persistence

Cooldown

Evaluation Frequency

Example:

Persistence:
5 frames

Meaning:

The violation must persist for at least 5 consecutive valid frames
before creating a violation event.

Example:

Frame 1 = ERROR
Frame 2 = ERROR
Frame 3 = ERROR
Frame 4 = ERROR
Frame 5 = ERROR

→ Trigger violation.

If:

ERROR
ERROR
PASS
ERROR

→ Do not trigger persistent ERROR.

Support either:

- frame-based persistence
- time-based persistence

Example:

Persistence:
300 ms

============================================================
16. COOLDOWN
============================================================

Add:

Feedback Cooldown

Example:

3 seconds

If the same violation remains active for 10 seconds,
do not repeatedly play the same audio every frame.

Example:

00:10 → feedback
00:11 → no feedback
00:12 → no feedback
00:13 → feedback allowed if condition persists

Cooldown should be configurable per rule.

============================================================
17. PRIORITY
============================================================

Keep the existing Priority field.

Use a numerical range, e.g.:

1–10

10 = highest priority.

Example:

Tempo issue:
3

Elbow flare:
7

Hip sag:
9

Critical instability:
10

When multiple rules trigger simultaneously,
the Feedback Aggregator should prioritize the highest-priority
active violation.

============================================================
18. SEVERITY
============================================================

Support:

INFO
WARNING
ERROR
CRITICAL

Definitions:

INFO:
Coaching information / optimization.

WARNING:
Minor form deviation.

ERROR:
Clear technical form violation.

CRITICAL:
Potentially unsafe movement or severe loss of control.

Do not automatically classify every large numerical deviation as
CRITICAL.

CRITICAL must be explicitly configured and may optionally trigger
Stop Exercise.

============================================================
19. INVALID REP
============================================================

Keep the existing:

"Invalid Rep"

but rename the UI label professionally:

"Mark Repetition as Invalid"

Boolean:

invalidRep = true / false

If true:

When this rule is violated during the required phase,
the current repetition is marked invalid.

Example:

Push-up:
ROM insufficient

→ rep detected
→ rule violated
→ invalidRep = true
→ validRepCount does not increase

The system should still store the invalid repetition for analytics.

Store:

- rep number
- violation codes
- observed metrics
- severity
- timestamp
- validity status

============================================================
20. STOP EXERCISE
============================================================

Add:

Stop Exercise on Critical Violation

Boolean:

stopExercise = true / false

Example:

CRITICAL instability

→ feedback
→ optionally pause/stop exercise

Do not automatically enable this for every CRITICAL rule.

============================================================
21. FEEDBACK CODE
============================================================

Add a structured Feedback Code.

Example:

PUSHUP_ELBOW_FLARE_WARNING

PUSHUP_ELBOW_FLARE_ERROR

PUSHUP_HIP_SAG_ERROR

PUSHUP_INSUFFICIENT_ROM_ERROR

The Rule Engine returns Feedback Code,
not raw natural language.

============================================================
22. FEEDBACK TEXT
============================================================

Keep the existing Detailed UI Guidance field.

Example:

"Khủy tay đang mở quá rộng, hãy khép vào thân người."

This is displayed in the UI.

This text must not be responsible for rule evaluation.

============================================================
23. VOICE CONFIGURATION
============================================================

Voice configuration already exists as a separate module.

Do NOT duplicate voice configuration inside the Rule module.

The Rule only references:

feedbackCode
voiceTemplateId
audioAssetId

The separate Voice module manages:

- language
- voice
- audio generation
- audio preview
- audio version
- audio asset
- Viettel AI configuration

Example:

Rule:
PUSHUP_ELBOW_FLARE_ERROR

↓

Feedback Template:
"Khép bớt khuỷu tay lại."

↓

Voice Configuration Module

↓

Viettel AI

↓

Stored Audio Asset

↓

audioAssetId

During realtime execution,
the system should play the existing audio whenever possible.

Do NOT call Viettel AI for every realtime violation.

============================================================
24. GEMINI ROLE
============================================================

Gemini is NOT the Rule Engine.

Gemini receives validated violations.

Example:

{
  "exercise": "PUSH_UP",
  "phase": "BOTTOM",
  "violations": [
    {
      "code": "INSUFFICIENT_ROM",
      "severity": "ERROR",
      "observed": 112,
      "target": 90
    },
    {
      "code": "HIP_SAG",
      "severity": "WARNING",
      "observed": 13,
      "threshold": 10
    }
  ]
}

Gemini may generate:

"Hạ người sâu hơn và giữ hông thẳng."

Gemini must NOT:
- change thresholds
- decide whether 112° is correct
- invent rules
- override severity
- change invalidRep
- determine level

============================================================
25. RULE ENGINE RUNTIME ALGORITHM
============================================================

Implement the runtime flow:

FUNCTION evaluateMotionFrame(exerciseContext, motionFeatures):

    profile
        = loadActiveMotionProfile(exerciseContext)

    rules
        = loadActiveRules(profile)

    applicableRules
        = filterByPhase(
              rules,
              motionFeatures.phase
          )

    results = []

    FOR each rule IN applicableRules:

        IF requiredLandmarksUnavailable(rule, motionFeatures):

            results.add(
                MEASUREMENT_UNRELIABLE
            )

            CONTINUE


        metricValue
            = getMetricValue(
                rule.metric,
                motionFeatures
              )

        IF metricValue is unavailable:

            results.add(
                MEASUREMENT_UNRELIABLE
            )

            CONTINUE


        evaluation
            = evaluateThreshold(
                rule,
                metricValue
              )

        updatePersistenceState(
            rule,
            evaluation
        )

        IF persistenceSatisfied(rule):

            results.add(
                createRuleViolation(
                    rule,
                    metricValue
                )
            )


    violations
        = prioritizeAndAggregate(results)

    RETURN violations


The engine must be deterministic.

============================================================
26. METRIC EVALUATOR ARCHITECTURE
============================================================

Use Strategy Pattern.

Do not create one giant RuleEngine class.

Architecture:

RuleEngine
    ↓
MetricEvaluatorFactory
    ↓
 ┌───────────────────────────────┐
 │ AngleEvaluator                │
 │ DistanceEvaluator             │
 │ RomEvaluator                  │
 │ AlignmentEvaluator            │
 │ SymmetryEvaluator             │
 │ VelocityEvaluator             │
 │ TempoEvaluator                │
 │ DurationEvaluator             │
 │ StabilityEvaluator            │
 │ ConfidenceEvaluator           │
 │ RepSequenceEvaluator          │
 └───────────────────────────────┘

Each evaluator receives:

- Motion features
- Rule configuration

and returns:

EvaluationResult

Example:

{
  "status": "ERROR",
  "observedValue": 112,
  "expected": {
    "normalMin": 45,
    "normalMax": 70
  },
  "severity": "ERROR"
}

============================================================
27. MEDIA PIPE DATA FLOW
============================================================

MediaPipe Pose provides landmarks.

Do not directly put MediaPipe calculations inside RuleEngine.

Separate:

MediaPipe
    ↓
Landmark Mapper
    ↓
Feature Engine
    ↓
Motion Features
    ↓
Rule Engine

Feature Engine is responsible for:

- joint angle calculation
- distance calculation
- ROM
- alignment
- symmetry
- velocity
- acceleration
- tempo
- phase
- rep state
- confidence aggregation

Rule Engine only evaluates the resulting values.

============================================================
28. DATA RELIABILITY
============================================================

The Rule Engine must support measurement reliability.

Possible inputs:

- pose confidence
- landmark visibility
- camera quality
- required landmark availability
- exercise recognition confidence
- data completeness

Example rule:

POSE_CONFIDENCE >= 0.70

If confidence is too low:

Do NOT classify the user as having bad form.

Instead:

measurementStatus = UNRELIABLE

The system should not generate an incorrect coaching warning
from unreliable MediaPipe data.

============================================================
29. RULE EVALUATION RESULT
============================================================

Return structured results.

Example:

{
  "ruleId": "123",
  "ruleCode": "PUSHUP_ELBOW_FLARE_001",
  "status": "ERROR",
  "severity": "ERROR",
  "priority": 8,
  "metric": "ELBOW_ANGLE",
  "observedValue": 112,
  "unit": "DEGREE",
  "targetValue": 60,
  "normalRange": {
    "min": 45,
    "max": 70
  },
  "feedbackCode": "PUSHUP_ELBOW_FLARE_ERROR",
  "invalidRep": true,
  "stopExercise": false,
  "timestamp": "...",
  "ruleVersion": "1.0"
}

============================================================
30. MULTIPLE VIOLATION AGGREGATION
============================================================

A user may violate multiple rules simultaneously.

Example:

- elbow flare
- hip sag
- tempo too fast

Do NOT immediately play three audio messages.

Use:

Violation Aggregator

Steps:

1. group similar violations
2. remove duplicates
3. apply cooldown
4. rank by priority
5. consider severity
6. select the most important feedback
7. optionally send complex combinations to Gemini

Example:

Tempo:
priority 3

Elbow:
priority 7

Hip:
priority 9

Output:

HIP_SAG_ERROR

Only one immediate audio should play.

============================================================
31. SIMPLE VS COMPLEX FEEDBACK
============================================================

Implement two feedback paths.

PATH A — SIMPLE KNOWN VIOLATION

Rule Engine
    ↓
Feedback Code
    ↓
Pre-generated Audio
    ↓
User

No Gemini.

PATH B — COMPLEX / COMBINED / CONTEXTUAL

Rule Engine
    ↓
Validated violations
    ↓
Gemini
    ↓
Concise feedback
    ↓
Viettel AI
    ↓
Audio

This minimizes token usage and latency.

============================================================
32. DATABASE DESIGN
============================================================

Design normalized MySQL tables.

Recommended tables:

exercises

exercise_motion_profiles

motion_profile_phases

motion_profile_landmarks

motion_rules

motion_rule_thresholds

motion_rule_conditions

motion_rule_execution_configs

feedback_templates

feedback_audio_assets

rule_versions

rule_audit_logs

Suggested relationships:

exercises
    1
    |
    N
exercise_motion_profiles
    |
    N
motion_profile_phases
    |
    N
motion_rules
    |
    1
motion_rule_thresholds

motion_rules
    |
    1
feedback_templates
    |
    N
feedback_audio_assets

============================================================
33. MOTION_RULES TABLE
============================================================

Suggested fields:

id
motion_profile_id
rule_code
rule_name
description
phase_id
metric_type
unit
operator
target_value
active
priority
severity
invalid_rep
stop_exercise
feedback_code
rule_version
status
created_by
updated_by
created_at
updated_at

Do not store all threshold logic as unstructured text.

============================================================
34. MOTION_RULE_THRESHOLDS
============================================================

Suggested fields:

id
rule_id
severity
min_value
max_value
comparison_operator
inclusive_min
inclusive_max

Example:

rule_id = 123
severity = NORMAL
min = 45
max = 70

rule_id = 123
severity = WARNING
min = 40
max = 75

rule_id = 123
severity = ERROR
min = 30
max = 85

Critical can support open-ended values.

============================================================
35. EXECUTION CONFIGURATION
============================================================

Suggested fields:

rule_id
persistence_type
persistence_value
cooldown_ms
evaluation_interval_ms
priority
invalid_rep
stop_exercise

Example:

persistence_type = FRAME
persistence_value = 5

cooldown_ms = 3000

============================================================
36. RULE VERSIONING
============================================================

Rules must be versioned.

Example:

PUSHUP_ELBOW_FLARE_001
v1.0
v1.1
v2.0

Never silently modify a published rule.

If Coach changes:

Normal:
45–70

to:

Normal:
50–70

create a new version.

Historical assessments must continue referencing the rule version
that was active at the time.

============================================================
37. RULE STATUS
============================================================

Support:

DRAFT
PENDING_REVIEW
PUBLISHED
ARCHIVED

Only PUBLISHED rules are allowed in realtime execution.

============================================================
38. APPROVAL WORKFLOW
============================================================

Recommended:

Coach/Admin creates rule
    ↓
DRAFT
    ↓
Test Rule
    ↓
Submit for review
    ↓
PENDING_REVIEW
    ↓
Approved
    ↓
PUBLISHED

Do not let an unfinished rule immediately affect users.

============================================================
39. TEST RULE FEATURE
============================================================

The UI must include:

[Test Rule]

The Admin can input:

Observed Value:
78°

The system evaluates the current configuration.

Example result:

Observed:
78°

Normal:
45–70°

Result:
ERROR

Feedback:
"Khép bớt khuỷu tay lại."

Also support replay testing with historical motion feature data.

============================================================
40. FRONTEND UX
============================================================

Use the current visual style as the foundation.

The current design is dark, professional, dashboard-oriented.

Preserve:

- dark background
- grouped cards
- strong section hierarchy
- compact professional controls
- severity color semantics
- clear labels

But reorganize the form into:

1. Rule Information
2. Measurement Definition
3. Standard / Target
4. Severity Thresholds
5. Execution Logic
6. Feedback Reference
7. Test & Preview
8. Version / Publishing

============================================================
41. DYNAMIC FORM BEHAVIOR
============================================================

The frontend must be dynamic.

Example:

Metric Type:
ANGLE_3_POINT

Show:

A
B
C

Metric Type:
DISTANCE

Show:

A
B

Metric Type:
ALIGNMENT

Show:

Landmark Set
Reference Axis/Plane

Metric Type:
ROM

Show:

Joint
Start
End
Reference Axis

Metric Type:
POSE_CONFIDENCE

Hide landmark selection.

============================================================
42. FORM VALIDATION
============================================================

Frontend validation:

- required fields
- valid threshold ordering
- no overlapping severity ranges unless explicitly allowed
- valid phase
- valid landmark combination
- compatible metric type
- valid unit
- persistence > 0
- cooldown >= 0
- priority within allowed range
- feedback code exists
- published rule must have approved version

Backend must repeat all important validations.

Never rely only on frontend validation.

============================================================
43. EXAMPLE RULE
============================================================

Exercise:
Push-up

Motion Profile:
Standard Push-up v1.0

Rule Code:
PUSHUP_ELBOW_FLARE_001

Rule Name:
Khuỷu tay xòe quá rộng

Phase:
BOTTOM

Metric:
ANGLE_3_POINT

A:
LEFT_SHOULDER

B:
LEFT_ELBOW

C:
LEFT_WRIST

Target:
60°

Normal:
45°–70°

Warning:
40°–44°
71°–75°

Error:
30°–39°
76°–85°

Critical:
<30°
>85°

Persistence:
5 frames

Cooldown:
3000 ms

Priority:
8

Invalid Rep:
true

Stop Exercise:
false

Feedback Code:
PUSHUP_ELBOW_FLARE_ERROR

UI Feedback:
"Khủy tay đang mở quá rộng, hãy khép vào thân người."

Voice Feedback:
Managed by separate Voice Configuration module.

============================================================
44. REALTIME EXAMPLE
============================================================

MediaPipe:
Shoulder = ...
Elbow = ...
Wrist = ...

Feature Engine:

elbowAngle = 78°

Rule Engine:

78° > 75°
78° <= 85°

→ ERROR

Persistence:
5 consecutive frames satisfied

→ create violation event

Feedback Aggregator:

PUSHUP_ELBOW_FLARE_ERROR

Check cached audio:

YES

→ play audio immediately.

Gemini:
NOT CALLED.

============================================================
45. COMPLEX EXAMPLE
============================================================

Suppose:

elbowAngle = 78°
hipDeviation = 14°
tempo = 0.4 seconds

Rules return:

ERROR
WARNING
WARNING

Violation Aggregator:

highest priority:
HIP_SAG
ELBOW_FLARE

Because multiple violations are related,
send structured event to Gemini.

Gemini generates one concise instruction:

"Hạ người sâu hơn và giữ hông thẳng."

Then:

Gemini
    ↓
Feedback Text
    ↓
Viettel AI
    ↓
Audio

The generated feedback may be cached if appropriate.

============================================================
46. API DESIGN
============================================================

Provide REST APIs.

Motion Profiles:

GET
/api/admin/exercises/{exerciseId}/motion-profiles

POST
/api/admin/exercises/{exerciseId}/motion-profiles

PUT
/api/admin/motion-profiles/{profileId}

POST
/api/admin/motion-profiles/{profileId}/publish

Rules:

GET
/api/admin/motion-profiles/{profileId}/rules

POST
/api/admin/motion-profiles/{profileId}/rules

GET
/api/admin/motion-rules/{ruleId}

PUT
/api/admin/motion-rules/{ruleId}

POST
/api/admin/motion-rules/{ruleId}/test

POST
/api/admin/motion-rules/{ruleId}/submit-review

POST
/api/admin/motion-rules/{ruleId}/publish

Version:

GET
/api/admin/motion-rules/{ruleId}/versions

GET
/api/admin/motion-rules/{ruleId}/audit

============================================================
47. RUNTIME API
============================================================

Realtime motion analysis should NOT require a REST request for
every frame.

Use:

WebSocket
or
WebRTC/data channel
or
streaming architecture

Recommended:

Camera
→ Motion Analysis Client/Service
→ Feature Stream
→ Rule Engine

The Rule Engine should process motion features continuously.

Do not send raw video to Spring Boot for every frame if avoidable.

============================================================
48. BACKEND SERVICE ARCHITECTURE
============================================================

Use separate services/classes.

Recommended:

ExerciseMotionProfileService

MotionRuleService

MotionRuleValidationService

RuleEngine

MetricEvaluatorFactory

AngleEvaluator

RomEvaluator

AlignmentEvaluator

SymmetryEvaluator

TempoEvaluator

StabilityEvaluator

ConfidenceEvaluator

RepValidationService

RulePersistenceTracker

ViolationAggregator

FeedbackResolver

AudioAssetService

RuleVersionService

RuleAuditService

Do NOT implement all logic in one giant service.

============================================================
49. DESIGN PATTERNS
============================================================

Use:

Strategy Pattern
Specification Pattern
Factory Pattern
State Machine
Repository Pattern

Strategy Pattern:
Metric evaluators

Factory:
MetricEvaluatorFactory

State Machine:
Exercise phases / rep detection

Specification:
Rule conditions

Repository:
Rule/profile persistence

============================================================
50. RULE ENGINE OUTPUT
============================================================

The Rule Engine should return structured domain objects.

Example:

{
  "exerciseId": "push-up",
  "phase": "BOTTOM",
  "timestamp": 1720000000,

  "measurementStatus": "RELIABLE",

  "violations": [
    {
      "ruleId": "123",
      "ruleCode": "PUSHUP_ELBOW_FLARE_001",
      "severity": "ERROR",
      "priority": 8,
      "metricType": "ANGLE_3_POINT",
      "observedValue": 78,
      "unit": "DEGREE",
      "targetValue": 60,
      "feedbackCode": "PUSHUP_ELBOW_FLARE_ERROR",
      "invalidRep": true,
      "stopExercise": false
    }
  ]
}

============================================================
51. AUDITABILITY
============================================================

The system must be able to answer:

Why was this rep invalid?

Which rule triggered?

What was the observed value?

What was the expected range?

Which rule version was used?

Which Motion Profile version was used?

Who created the rule?

Who approved the rule?

Which feedback was triggered?

Which audio asset was played?

Store enough information for debugging and assessment audit.

============================================================
52. SCIENTIFIC / DOMAIN SAFETY
============================================================

Do not invent scientific thresholds.

Thresholds may originate from:

SCIENTIFIC_EVIDENCE
COACHING_BENCHMARK
PRODUCT_RULE
COACH_CONFIGURED
DATA_DERIVED

Store:

sourceType
sourceReference
ruleVersion

Exact thresholds must be configurable.

Do not claim that a particular angle is universally correct for
all users unless supported by appropriate evidence.

The system must allow exercise-specific and phase-specific rules.

============================================================
53. IMPORTANT DISTINCTION
============================================================

Do NOT confuse:

Motion Rule
Movement Quality
Competency
Fitness Level

Motion Rule:
"Is this movement execution within configured criteria?"

Movement Quality:
"How well was the movement executed?"

Competency:
"How capable is the user in this physical domain?"

Fitness Level:
"What is the user's current overall level according to
CalisHealth's level framework?"

Example:

User performs 20 push-ups.

Motion Rules:
18 valid
2 invalid

Movement Quality:
91

Push Competency:
78

Overall Level:
Intermediate

These are different outputs.

============================================================
54. PERIODIC ASSESSMENT INTEGRATION
============================================================

The same Rule Engine should be usable in Periodic Assessment.

Example:

Periodic Assessment
    ↓
Push-up Test
    ↓
MediaPipe
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
    ↓
Competency Engine
    ↓
Level Engine

Do not create a completely separate definition of "correct form"
for Periodic Assessment.

Reuse the Motion Profile and Rule configuration.

============================================================
55. REALTIME VS ASSESSMENT
============================================================

Realtime:

Goal:
Immediate coaching.

Use:
- low latency
- persistence
- cooldown
- pre-generated audio
- simple rule feedback

Periodic Assessment:

Goal:
Reliable measurement.

Use:
- full metrics
- all violations
- valid/invalid reps
- movement quality
- reliability
- trend comparison
- detailed logging

The same rules may be used,
but the output behavior can differ by context.

============================================================
56. PERFORMANCE OPTIMIZATION
============================================================

Do NOT:

MediaPipe
→ Gemini
→ Viettel AI

for every frame.

Instead:

MediaPipe
→ Feature Engine
→ Rule Engine
→ Feedback Cache

for common errors.

Gemini is called only when:
- multiple violations need to be combined
- contextual coaching is needed
- repeated mistakes need explanation
- personalized coaching is useful

This dramatically reduces:
- token usage
- API calls
- latency
- cost
- dependency on external AI services

============================================================
57. FRONTEND SCREEN OUTPUT
============================================================

Create the final React UI with the following sections:

HEADER

Exercise:
Push-up

Motion Profile:
Standard Push-up v1.0

------------------------------------------------

SECTION 1
RULE INFORMATION

Rule Code
Rule Name
Phase
Severity
Priority

------------------------------------------------

SECTION 2
MEASUREMENT

Metric Type
Unit
Dynamic Landmark Configuration
Camera View

------------------------------------------------

SECTION 3
STANDARD / TARGET

Target Value
Normal Min
Normal Max

Clearly label:

"Biên độ chuẩn / Normal Range"

------------------------------------------------

SECTION 4
SEVERITY THRESHOLDS

Normal
Warning
Error
Critical

Use clear visual distinction.

------------------------------------------------

SECTION 5
EXECUTION

Persistence
Persistence Type
Cooldown
Evaluation Frequency
Invalid Rep
Stop Exercise

------------------------------------------------

SECTION 6
FEEDBACK

Feedback Code
UI Feedback
Voice Reference

Do not duplicate voice configuration UI.

Show linked voice/audio asset status:

Generated
Not Generated
Outdated

Buttons:

Preview Audio

------------------------------------------------

SECTION 7
RULE TESTER

Observed Value

[Test Rule]

Result:
NORMAL / WARNING / ERROR / CRITICAL

Observed:
78°

Expected:
45°–70°

Feedback:
Khép bớt khuỷu tay lại.

------------------------------------------------

SECTION 8
VERSION & PUBLISHING

Version
Status
Created By
Updated By
Created At
Approved By

Buttons:

Save Draft
Submit Review
Publish
Archive

============================================================
58. UX REQUIREMENTS
============================================================

Make the interface professional and understandable even for
non-technical Coaches.

Use Vietnamese labels with English technical identifiers where
useful.

Example:

"Biên độ chuẩn (Normal Range)"

"Giá trị mục tiêu (Target Value)"

"Thời gian duy trì lỗi (Persistence)"

"Thời gian chờ phản hồi lại (Cooldown)"

"Đánh dấu Rep không hợp lệ"

"Điểm ưu tiên"

"Ngưỡng cảnh báo"

"Ngưỡng lỗi"

"Ngưỡng nghiêm trọng"

Do not overwhelm the user with raw technical implementation details.

Use tooltips for:
- Persistence
- Cooldown
- Target
- Normal Range
- Camera View
- Metric Type

============================================================
59. BACKEND VALIDATION EXAMPLES
============================================================

Reject rule if:

- required metric missing
- required landmarks missing
- invalid landmark combination
- normal range invalid
- warning overlaps normal incorrectly
- error overlaps warning incorrectly
- critical range invalid
- unsupported unit
- unsupported operator
- persistence <= 0
- priority outside allowed range
- referenced feedback code does not exist

Return clear validation messages.

============================================================
60. IMPORTANT BUSINESS RULE
============================================================

The system must always distinguish:

Observed Value

from:

Expected Value

from:

Severity Threshold

Example:

Observed:
78°

Target:
60°

Normal:
45–70°

Result:
ERROR

Never store only:

"Wrong angle"

Store the actual measured value and configured expectation.

============================================================
61. TEST CASES
============================================================

Generate unit tests for:

1. normal angle
2. warning angle
3. error angle
4. critical angle
5. exact boundary
6. inclusive boundary
7. invalid landmark
8. low pose confidence
9. persistence not satisfied
10. persistence satisfied
11. cooldown active
12. cooldown expired
13. multiple violations
14. priority resolution
15. invalid rep
16. critical stop exercise
17. different movement phases
18. different rule versions
19. draft rule not executed
20. archived rule not executed

============================================================
62. DELIVERABLES
============================================================

Provide:

1. System architecture
2. Domain model
3. Database ERD
4. MySQL schema
5. Backend package structure
6. Entity classes
7. DTOs
8. Repositories
9. Services
10. Rule Engine architecture
11. Metric evaluator interfaces
12. Strategy implementations
13. Rule evaluation algorithm
14. Persistence mechanism
15. Violation aggregation algorithm
16. REST API specification
17. WebSocket/realtime architecture
18. React component structure
19. Form state model
20. Dynamic form behavior
21. Validation rules
22. Rule Tester design
23. Versioning design
24. Audit log design
25. Sample JSON rule configuration
26. Sample Push-up configuration
27. Unit test examples
28. Integration test examples
29. Error handling
30. Security/authorization
31. Performance considerations
32. Gemini integration boundary
33. Viettel AI integration boundary

============================================================
63. FINAL ARCHITECTURAL PRINCIPLE
============================================================

The final implementation must follow this responsibility separation:

MediaPipe:
"Where are the user's body landmarks?"

Feature Engine:
"What measurable motion features can be calculated?"

Rule Engine:
"Does the measured movement satisfy the configured criteria?"

Violation Aggregator:
"Which violations are important enough to report now?"

Feedback Resolver:
"What predefined feedback should be shown/played?"

Gemini:
"How can validated violations be explained naturally and
contextually?"

Viettel AI:
"How can the feedback text be converted to speech?"

Level Engine:
"What does the accumulated performance and movement quality
mean for the user's competency and fitness level?"

Never allow Gemini to replace the deterministic Rule Engine.

Never allow the Rule Engine to calculate raw MediaPipe landmarks.

Never allow the Voice module to contain movement correctness logic.

Build the system so that one Motion Profile and its Rules can be
reused consistently by:

REALTIME COACHING
+
REP VALIDATION
+
PERIODIC ASSESSMENT
+
MOVEMENT QUALITY SCORING
+
COMPETENCY EVALUATION

The resulting architecture must be scalable to hundreds of
calisthenics exercises without hardcoding exercise-specific
if/else logic throughout the Spring Boot backend.