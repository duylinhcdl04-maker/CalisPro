You are a Senior Software Architect, Fitness Science Researcher, Calisthenics Coach, Business Analyst, and AI System Designer.

You are working on a web-based Calisthenics AI Coaching platform called "CalisHealth".

Your task is to design a professional, explainable, configurable, and extensible algorithm for determining a user's initial fitness level and generating a personalized training roadmap immediately after the user completes the Initial Fitness Questionnaire during their first login.

IMPORTANT:
Do NOT design this as a simple "questionnaire → beginner/intermediate/advanced → random exercises" system.

The system must be designed as a scientific, rule-based, data-driven recommendation system that can later integrate with real practical assessments using MediaPipe Pose, motion analysis, AI feedback, and periodic reassessment.

==================================================
1. SYSTEM CONTEXT
==================================================

CalisHealth is a personalized calisthenics training platform.

Technology stack:

Backend:
- Java
- Spring Boot
- REST API
- MySQL

Frontend:
- React

AI / Computer Vision:
- Google MediaPipe Pose
- Optional MediaPipe Hand Landmarker when necessary
- Gemini for AI reasoning/explanation
- Viettel AI for Text-to-Speech

The system has several actors:

- Guest
- Member/User
- Coach
- Admin
- AI Coach

The current task focuses on the Member/User training recommendation system.

==================================================
2. VERY IMPORTANT DISTINCTION BETWEEN TWO TYPES OF ASSESSMENT
==================================================

CalisHealth has TWO fundamentally different assessment mechanisms.

--------------------------------------------------
2.1 INITIAL FITNESS QUESTIONNAIRE
--------------------------------------------------

The first assessment happens immediately after the user's first login.

The user MUST complete this questionnaire before entering the personalized training system.

This assessment is NOT a practical physical test.

It is based entirely on self-reported answers.

Examples:

- How many push-ups can you currently perform?
- How many pull-ups can you perform?
- How long can you hold a plank?
- How long have you trained calisthenics?
- Can you perform a dip?
- Can you perform a handstand?
- What is your current training frequency?
- What is your experience level?
- What is your primary goal?
- How many days per week can you train?
- How much time can you train per session?
- Do you have equipment?
- Which skills do you want to achieve?
- What is your current physical condition?
- Which movements/exercises are currently difficult for you?

The answers are NOT guaranteed to be accurate.

Therefore:

INITIAL QUESTIONNAIRE DATA MUST BE TREATED AS:

"SELF-REPORTED / PROVISIONAL DATA"

and NOT as objectively measured performance.

The system should therefore generate:

- Initial Fitness Profile
- Provisional Competency
- Provisional Level
- Initial Skill Gaps
- Initial Training Roadmap

but should NOT treat this level as permanently verified.

--------------------------------------------------
2.2 PERIODIC PRACTICAL ASSESSMENT
--------------------------------------------------

Later, the user periodically performs practical assessments.

These assessments use:

Camera
→ MediaPipe Pose
→ Landmark Extraction
→ Feature Engine
→ Motion Analysis
→ Rule Engine
→ Performance Metrics
→ AI Feedback

Examples of measured metrics:

- Total repetitions
- Valid repetitions
- Invalid repetitions
- Range of Motion
- Form Score
- Tempo
- Stability
- Body alignment
- Joint angles
- Hold duration
- Movement consistency
- Pose confidence
- Landmark visibility
- Rep quality

These measured results have higher reliability than self-reported data.

Therefore:

MEASURED PRACTICAL PERFORMANCE > SELF-REPORTED PERFORMANCE

when both types of data exist.

==================================================
3. CORE OBJECTIVE
==================================================

Design an algorithm that performs the following pipeline:

Initial Questionnaire
        ↓
Validate Questionnaire
        ↓
Normalize Answers
        ↓
Build Initial Fitness Profile
        ↓
Calculate Competencies
        ↓
Determine Provisional Level
        ↓
Determine User Goal
        ↓
Determine Skill Gaps
        ↓
Check Exercise / Skill Prerequisites
        ↓
Select Appropriate Exercises
        ↓
Select Progression Path
        ↓
Generate Training Roadmap
        ↓
Generate Training Plan
        ↓
Generate Weekly Structure
        ↓
Generate Workout Sessions
        ↓
Track Performance
        ↓
Periodic Practical Assessment
        ↓
Update Competencies
        ↓
Update Level
        ↓
Recalculate Skill Gaps
        ↓
Adapt Training Plan

The system must therefore be a CLOSED-LOOP ADAPTIVE TRAINING SYSTEM.

==================================================
4. DO NOT USE ONLY ONE GLOBAL LEVEL
==================================================

Do NOT design the system using only:

Beginner
Intermediate
Advanced

Instead, create a multi-dimensional fitness profile.

At minimum, the user should have separate competency scores for:

1. PUSH
2. PULL
3. LEGS
4. CORE
5. MOBILITY
6. SKILL

Optionally support:

7. ENDURANCE
8. POWER
9. BALANCE
10. CONTROL

Each competency should have a score from 0–100.

Example:

Push: 62
Pull: 38
Legs: 70
Core: 55
Mobility: 48
Skill: 30

Overall Level:
Beginner / Intermediate

This means the user may be:

- Intermediate in Legs
- Beginner in Pull
- Beginner in Skill

The system must NOT assume that all body areas have the same level.

==================================================
5. INITIAL QUESTIONNAIRE DATA MODEL
==================================================

Design a structured questionnaire system.

Do NOT hard-code questionnaire questions directly into Java code.

Questions must be configurable from the database.

Design entities/tables such as:

- assessment_templates
- assessment_questions
- assessment_options
- assessment_answer_rules
- initial_assessment_sessions
- initial_assessment_answers

Each question should support:

- Question ID
- Category
- Question type
- Answer type
- Weight
- Competency mapping
- Score mapping
- Reliability level
- Required/optional
- Display order
- Active/inactive

Support question types such as:

- Single choice
- Multiple choice
- Numeric
- Boolean
- Duration
- Experience level
- Frequency
- Equipment availability

==================================================
6. NORMALIZATION OF USER ANSWERS
==================================================

Design a normalization layer.

Raw answers should NOT directly determine fitness scores.

Example:

User says:

"I can do 15 push-ups."

The system should transform this into a normalized performance value.

Example:

15 reps
→ normalized score
→ Push competency contribution

Do NOT hard-code the exact thresholds unless you explicitly make them configurable.

Thresholds must be stored in the database.

For example:

performance_thresholds

Fields may include:

- exercise_id
- competency
- min_value
- max_value
- score
- gender applicability if scientifically justified
- age range if scientifically justified
- confidence
- active

Avoid arbitrary or unsupported physiological assumptions.

==================================================
7. SELF-REPORTED DATA RELIABILITY
==================================================

Because the Initial Questionnaire is self-reported, the system must track reliability.

Create a concept such as:

assessment_source:

SELF_REPORTED
AI_MEASURED
COACH_VERIFIED

And:

reliability_score

Example:

SELF_REPORTED:
0.4–0.7

AI_MEASURED:
0.8–0.95

COACH_VERIFIED:
0.9–1.0

IMPORTANT:

These numbers are examples only.

Make them configurable.

Do not claim that these values are scientifically universal.

The system should store:

- source
- reliability
- timestamp
- evidence
- assessment version

==================================================
8. INITIAL COMPETENCY CALCULATION
==================================================

Design the algorithm for calculating:

Push Score
Pull Score
Legs Score
Core Score
Mobility Score
Skill Score

Each competency may be calculated from multiple questionnaire answers.

Example:

PULL competency:

Pull-up ability
+
Australian row ability
+
Dead hang
+
Training experience
+
Self-reported difficulty

The system should use weighted scoring.

Example conceptual formula:

CompetencyScore =
Σ(NormalizedAnswerScore × Weight × Reliability)
/
Σ(Weight × Reliability)

However:

Do NOT assume this exact formula is final.

Evaluate whether a better formula should be used.

Explain:

- Why the formula is appropriate
- How weights are selected
- How missing answers are handled
- How contradictory answers are handled
- How unreliable answers are handled

==================================================
9. CONTRADICTORY ANSWERS
==================================================

The system must detect inconsistent answers.

Example:

User says:

"I have never trained calisthenics."

but:

"I can perform 15 strict pull-ups."

The system should NOT blindly accept both answers.

Instead:

1. Detect inconsistency.
2. Lower confidence in the self-reported profile.
3. Mark the relevant competency as provisional.
4. Optionally request clarification.
5. Recommend practical assessment later.

Create an:

assessment_confidence

and optionally:

data_quality_status:

HIGH
MEDIUM
LOW
CONFLICTED

==================================================
10. INITIAL LEVEL CALCULATION
==================================================

Design a provisional level engine.

Do NOT use only:

Average score >= X → Intermediate.

Use both:

1. Overall competency score
2. Competency gates / prerequisites

Example conceptual structure:

Foundation
Beginner
Intermediate
Advanced
Elite

But make all thresholds configurable.

Example:

Intermediate may require:

Overall Score >= X

AND

Push >= Y
Pull >= Y
Core >= Y

The system must prevent a user from being classified as Advanced just because they have extremely strong Legs while having very weak Pull and Skill competencies.

Therefore:

LEVEL = OVERALL SCORE + REQUIRED COMPETENCY GATES

Explain and implement this concept.

==================================================
11. USER GOALS
==================================================

The recommendation algorithm must consider the user's goal.

Examples:

- General fitness
- Build strength
- Build muscle
- Learn Pull-up
- Learn Muscle-up
- Learn Handstand
- Improve Push-up
- Improve Dips
- Improve Mobility
- Improve Endurance
- Fat loss
- General calisthenics progression

Goals must be configurable.

Create:

training_goals

Each goal should contain:

- goal_id
- name
- description
- target competencies
- priority
- required skills
- recommended training emphasis
- progression path

==================================================
12. SKILL TREE / PROGRESSION GRAPH
==================================================

Design a progression graph.

Exercises and skills must NOT be isolated.

Example:

PULL:

Dead Hang
    ↓
Scapular Pull-up
    ↓
Australian Row
    ↓
Assisted Pull-up
    ↓
Negative Pull-up
    ↓
Pull-up
    ↓
Chest-to-Bar Pull-up
    ↓
Muscle-up

PUSH:

Incline Push-up
    ↓
Push-up
    ↓
Diamond Push-up
    ↓
Dip
    ↓
Straight Bar Dip
    ↓
Pseudo Planche Push-up
    ↓
Planche progression

SKILL:

Handstand preparation
    ↓
Wall Handstand
    ↓
Freestanding Handstand
    ↓
Handstand Push-up

The system must support:

- prerequisites
- progressions
- regressions
- alternative exercises
- difficulty level
- competency mapping

Create database structures such as:

exercise_prerequisites
exercise_progressions
exercise_regressions
skill_paths

==================================================
13. SKILL GAP ENGINE
==================================================

After determining the user's current competency and goal, calculate:

CURRENT STATE
vs
TARGET STATE

Example:

Goal:
Pull-up

Current:
Pull competency = 35
Pull-up = unavailable
Dead Hang = 35 sec
Australian Row = 8 reps

Required:

Dead Hang >= X
Scapular Pull >= X
Australian Row >= X
Negative Pull-up >= X

The system should identify:

Missing prerequisites
Weak competencies
Missing skills
Insufficient performance

Output:

Skill Gap List

Example:

1. Grip endurance
2. Scapular control
3. Pulling strength
4. Core stability

The algorithm should prioritize gaps by importance.

==================================================
14. EXERCISE RECOMMENDATION ENGINE
==================================================

The recommendation engine should NOT simply choose exercises randomly.

Each candidate exercise should be scored.

Consider factors such as:

1. Goal relevance
2. Skill gap relevance
3. Prerequisite compatibility
4. Current competency
5. Exercise difficulty
6. User experience
7. Equipment availability
8. Training frequency
9. Session duration
10. Recent performance
11. Training load
12. Recovery
13. Injury/limitation information if collected
14. Progression position

Create an explainable recommendation score.

Example conceptual formula:

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

Make all weights configurable.

Do NOT allow Gemini to directly select exercises.

The deterministic Recommendation Engine must select the exercises.

==================================================
15. EXERCISE ELIGIBILITY
==================================================

Before recommending an exercise, the system must check:

- prerequisite satisfied?
- difficulty appropriate?
- required equipment available?
- user level compatible?
- competency sufficient?
- current training load acceptable?
- exercise already overused?
- progression stage appropriate?

Example:

User wants Muscle-up.

The system must NOT immediately recommend Muscle-up.

It should evaluate prerequisites.

For example:

Pull-up quality reps >= threshold
Chest-to-bar >= threshold
Straight Bar Dip >= threshold
Core competency >= threshold
Pull competency >= threshold

If prerequisites are not met:

Recommend prerequisite exercises.

==================================================
16. TRAINING ROADMAP
==================================================

The system should generate a LONG-TERM roadmap.

Example:

Goal:
First Pull-up

12-week roadmap:

Phase 1:
Foundation

Weeks 1–4:
- Dead Hang
- Scapular Pull-up
- Australian Row
- Core

Phase 2:
Strength Development

Weeks 5–8:
- Assisted Pull-up
- Negative Pull-up
- Australian Row progression
- Core

Phase 3:
Skill Acquisition

Weeks 9–12:
- Assisted Pull-up
- Pull-up attempts
- Negative Pull-up
- Scapular control

However, the roadmap MUST be dynamically generated from the user's actual profile.

Do NOT hard-code this exact roadmap.

==================================================
17. TRAINING PLAN HIERARCHY
==================================================

Design the following hierarchy:

Long-Term Goal
    ↓
Training Roadmap
    ↓
Training Phase / Mesocycle
    ↓
Training Cycle
    ↓
Weekly Plan
    ↓
Workout Session
    ↓
Exercise
    ↓
Sets
    ↓
Repetitions / Duration
    ↓
Performance

Support:

- progression
- regression
- deload
- rest
- recovery
- volume adjustment

==================================================
18. TRAINING FREQUENCY
==================================================

The recommendation engine must consider:

- days available per week
- session duration
- user's experience
- training goal
- current workload

Example:

User can train 3 days/week.

The system should not generate a 6-day plan.

If user can train 30 minutes:

Do not generate a 90-minute session.

Training plan must fit the user's real constraints.

==================================================
19. TRAINING LOAD
==================================================

Design a basic training load system.

Track:

- sets
- reps
- duration
- difficulty
- volume
- exercise intensity
- weekly load
- adherence

Possible conceptual formula:

TrainingLoad =
Sets × Reps × DifficultyFactor

For isometric exercises:

TrainingLoad =
Sets × Duration × DifficultyFactor

Do NOT claim this is a universal scientific formula.

Make the model extensible.

The system must prevent excessive training volume.

==================================================
20. PROGRESSION RULES
==================================================

Do NOT promote users merely because they completed an exercise.

Progression should consider:

- valid repetitions
- form score
- ROM
- consistency
- completion rate
- recent performance
- number of successful sessions
- training load

Example:

User should not automatically progress from Assisted Pull-up → Pull-up simply because they completed the target number of reps.

They should satisfy progression gates.

Example:

Valid reps >= X
AND
Form score >= Y
AND
ROM >= Z
AND
No major form violation
AND
Criteria achieved for N sessions

All thresholds must be configurable.

==================================================
21. REGRESSION RULES
==================================================

The system must also support regression.

If:

Form score decreases significantly
OR
performance decreases repeatedly
OR
user cannot complete target volume
OR
major form violations occur

then:

- maintain current progression
OR
- reduce difficulty
OR
- reduce volume
OR
- recommend regression exercise

Do NOT immediately downgrade the user's entire global level because of one bad session.

Use trend-based logic.

==================================================
22. HYSTERESIS
==================================================

Implement hysteresis for level changes.

Avoid:

Intermediate → Beginner → Intermediate → Beginner

because of small score fluctuations.

Example conceptual rule:

Promotion threshold:
>= 70

Regression threshold:
< 60

These are examples only.

Make thresholds configurable.

Explain how hysteresis prevents level oscillation.

==================================================
23. PERIODIC ASSESSMENT INTEGRATION
==================================================

The system must be designed so that the Initial Questionnaire can later be replaced or updated by practical measured data.

Architecture:

Initial Questionnaire
        ↓
Provisional Profile
        ↓
Training
        ↓
Periodic Practical Assessment
        ↓
MediaPipe
        ↓
Motion Analysis
        ↓
Measured Metrics
        ↓
Verified Performance
        ↓
Competency Update
        ↓
Level Update
        ↓
Skill Gap Update
        ↓
Training Plan Adaptation

When practical data exists:

MEASURED DATA SHOULD HAVE HIGHER PRIORITY THAN SELF-REPORTED DATA.

Do not delete the original questionnaire data.

Keep assessment history.

==================================================
24. MEDIA PIPE INTEGRATION
==================================================

Do not ask MediaPipe to decide whether an exercise is scientifically correct by itself.

Use:

Camera
→ MediaPipe Pose
→ Landmark Mapper
→ Feature Engine
→ Rule Engine
→ Performance Metrics

MediaPipe provides body landmarks.

Feature Engine calculates:

- joint angles
- ROM
- body alignment
- movement velocity
- repetitions
- hold duration
- stability
- phase

Rule Engine evaluates form against configurable exercise rules.

==================================================
25. GEMINI ROLE
==================================================

Gemini MUST NOT:

- determine the user's official fitness level
- invent exercise thresholds
- invent prerequisites
- override Rule Engine
- independently choose exercises
- diagnose medical conditions
- change training rules

Gemini SHOULD:

- explain why an exercise was recommended
- summarize progress
- explain assessment results
- convert structured recommendation data into natural language
- provide motivational coaching
- generate concise user-friendly feedback

Example:

System determines:

Pull competency = 42
Goal = Pull-up
Missing prerequisite = Scapular Pull-up
Recommended exercise = Scapular Pull-up

Gemini may explain:

"Your pulling strength is developing, but your scapular control is still the main limitation. We are therefore focusing on scapular pull-ups before progressing to full pull-ups."

Gemini should NOT decide that scapular pull-up is required.

==================================================
26. EXPLAINABLE RECOMMENDATIONS
==================================================

Every recommendation must be explainable.

Store:

- recommendation reason
- goal
- skill gap
- prerequisite
- competency
- score
- rule used
- selected exercise
- recommendation timestamp

Example output:

Recommended Exercise:
Assisted Pull-up

Reason:

- Goal relevance: High
- Pull weakness: High
- Prerequisites: Satisfied
- Difficulty fit: High
- Equipment: Available

Explanation:

"Assisted Pull-up is recommended because your Pull competency is currently 48/100 and you have satisfied the prerequisite for assisted vertical pulling."

==================================================
27. DATABASE DESIGN
==================================================

Design a normalized MySQL database.

At minimum consider:

INITIAL ASSESSMENT:

- assessment_templates
- assessment_questions
- assessment_options
- assessment_answer_rules
- initial_assessment_sessions
- initial_assessment_answers

FITNESS PROFILE:

- user_fitness_profiles
- user_competencies
- fitness_levels
- fitness_level_requirements
- competency_metrics

GOALS:

- training_goals
- goal_competencies
- goal_skill_requirements

EXERCISES:

- exercises
- exercise_competencies
- exercise_difficulty
- exercise_prerequisites
- exercise_progressions
- exercise_regressions

RECOMMENDATION:

- recommendation_rules
- recommendation_weights
- recommendation_results
- recommendation_reasons

TRAINING:

- training_plans
- training_phases
- training_cycles
- training_weeks
- workout_sessions
- workout_exercises
- workout_sets

PERFORMANCE:

- performance_records
- performance_metrics
- skill_progress
- assessment_comparisons

PERIODIC ASSESSMENT:

- assessment_templates
- assessment_tests
- assessment_test_items
- assessment_sessions
- assessment_results
- assessment_metrics

==================================================
28. DATABASE RELATIONSHIPS
==================================================

Provide a complete ERD-level relationship description.

At minimum:

User
→ Initial Assessment Session
→ Initial Answers
→ Fitness Profile
→ Competencies
→ Level

Fitness Profile
→ Goal

Goal
→ Required Skills

Competency
→ Skill Gap

Skill Gap
→ Exercise Recommendation

Exercise
→ Prerequisites
→ Progressions
→ Regressions

Recommendation
→ Training Plan

Training Plan
→ Training Phase
→ Training Cycle
→ Training Week
→ Workout Session
→ Workout Exercise

Workout
→ Performance

Performance
→ Progress

Progress
→ Periodic Assessment

Periodic Assessment
→ Updated Competencies

Updated Competencies
→ Updated Level

Updated Level
→ New Recommendation

==================================================
29. BACKEND ARCHITECTURE
==================================================

Design this using clean Spring Boot architecture.

Suggested layers:

Controller
Service
Domain
Repository
Engine
Rule
DTO
Mapper

Create dedicated services/components such as:

InitialAssessmentService
AnswerNormalizationService
CompetencyScoringEngine
FitnessLevelEngine
GoalAnalysisService
SkillGapEngine
ExerciseEligibilityEngine
RecommendationEngine
TrainingRoadmapEngine
TrainingPlanGenerator
ProgressionEngine
RegressionEngine
TrainingLoadEngine
AdaptiveTrainingEngine
PeriodicAssessmentService

Do not put all logic inside one service.

Use Strategy Pattern / Rule Pattern / Specification Pattern where appropriate.

==================================================
30. API DESIGN
==================================================

Design REST APIs for:

Start initial assessment
Get questionnaire
Submit answer
Complete initial assessment
Get initial fitness profile
Get initial level
Get recommended roadmap
Get recommended exercises
Get training plan
Get current competency
Get skill gaps
Get progress
Start periodic assessment
Submit periodic assessment result
Update fitness profile
Generate new training plan

Provide:

HTTP method
Endpoint
Request DTO
Response DTO
Validation
Error handling

==================================================
31. ALGORITHM PSEUDOCODE
==================================================

Provide detailed pseudocode for:

1. Initial assessment processing
2. Answer normalization
3. Competency scoring
4. Initial level calculation
5. Goal analysis
6. Skill gap calculation
7. Exercise eligibility
8. Exercise recommendation scoring
9. Roadmap generation
10. Training plan generation
11. Progression
12. Regression
13. Periodic assessment update
14. Adaptive plan regeneration

The pseudocode must be implementation-ready for Java Spring Boot.

==================================================
32. EXAMPLE END-TO-END SCENARIO
==================================================

Create at least 3 complete examples.

Example 1:

Beginner user whose goal is Pull-up.

Show:

Questionnaire answers
→ normalized data
→ competencies
→ level
→ goal
→ skill gap
→ prerequisites
→ recommended exercises
→ roadmap
→ weekly plan

Example 2:

Intermediate user whose goal is Muscle-up.

Show why the system DOES NOT immediately recommend Muscle-up if prerequisites are missing.

Example 3:

User initially reports strong Push-up performance, but periodic MediaPipe assessment shows poor form.

Show how the system updates the profile and adapts the plan.

==================================================
33. EDGE CASES
==================================================

Handle:

- user skips optional questions
- user gives contradictory answers
- user gives unrealistic performance
- user has no equipment
- user has only 2 training days
- user has only 20 minutes per session
- user changes goal
- user stops training
- user returns after a long break
- user plateaus
- user improves rapidly
- user performs poorly during one session
- MediaPipe confidence is low
- camera quality is poor
- exercise cannot be analyzed
- insufficient assessment data
- conflicting assessment results
- exercise prerequisite not satisfied
- exercise unavailable because of equipment
- user has too many high-load exercises

==================================================
34. SCIENTIFIC SAFETY
==================================================

Do NOT present arbitrary thresholds as scientifically universal.

Where exact thresholds are required:

- make them configurable
- document their source
- allow Coach/Admin to modify them
- version the rules

The system must distinguish:

Scientific evidence
Coach-defined rules
Product configuration
User self-reported information
AI-generated explanation

Do not allow Gemini to create unsupported physiological claims.

If injury or medical information is collected, do not attempt medical diagnosis.

==================================================
35. ADMIN CONFIGURATION
==================================================

Admin should be able to configure:

- questionnaire
- questions
- answer options
- competency weights
- level thresholds
- exercise difficulty
- prerequisites
- progression rules
- regression rules
- recommendation weights
- training goals
- assessment frequency
- training load parameters

All important business rules should be configuration-driven.

Do NOT hard-code business rules in Java.

==================================================
36. COACH CONFIGURATION
==================================================

Coach should be able to:

- review user's profile
- review assessment history
- review competency scores
- review recommendations
- review training plan
- adjust plan
- verify performance
- override recommendation when appropriate

If a Coach overrides an automatic recommendation:

store:

- original recommendation
- coach decision
- reason
- timestamp
- coach ID

==================================================
37. VERSIONING AND AUDIT
==================================================

All important assessment and recommendation rules should be versioned.

Store:

- rule_version
- assessment_version
- recommendation_version
- created_at
- updated_at

This is important because changing a threshold later should not retroactively change historical results.

==================================================
38. OUTPUT FORMAT
==================================================

Your response MUST contain the following sections:

1. System Overview
2. Business Requirements
3. Functional Requirements
4. Non-Functional Requirements
5. Assessment Architecture
6. Initial Questionnaire Architecture
7. Data Normalization
8. Competency Scoring Algorithm
9. Provisional Level Algorithm
10. Goal Analysis
11. Skill Gap Engine
12. Exercise Prerequisite Engine
13. Recommendation Engine
14. Training Roadmap Engine
15. Training Plan Generator
16. Progression Engine
17. Regression Engine
18. Training Load Engine
19. Periodic Assessment Integration
20. MediaPipe Integration
21. Gemini Integration
22. Database ERD Description
23. MySQL Table Design
24. Spring Boot Architecture
25. REST API Design
26. Java Class Design
27. Detailed Pseudocode
28. End-to-End Examples
29. Edge Cases
30. Admin Configuration
31. Coach Workflow
32. Versioning & Audit
33. Security Considerations
34. Testing Strategy
35. Future Extensibility

==================================================
39. MOST IMPORTANT DESIGN PRINCIPLES
==================================================

The final architecture MUST follow these principles:

1. Initial questionnaire = SELF-REPORTED and PROVISIONAL.

2. Periodic practical assessment = OBJECTIVE PERFORMANCE DATA.

3. Measured data should have higher reliability than self-reported data.

4. Do not use only one global fitness level.

5. Use multi-dimensional competencies.

6. Use skill prerequisites and progression graphs.

7. Do not recommend advanced exercises before prerequisites are satisfied.

8. Recommendation must be explainable.

9. Recommendation must be deterministic and rule-based.

10. Gemini is NOT the decision-maker.

11. MediaPipe provides movement data, not final coaching decisions.

12. Rule Engine evaluates objective movement criteria.

13. AI explains and communicates validated results.

14. Training plans must consider the user's real constraints.

15. Training load must be controlled.

16. Progression must require quality performance.

17. Regression must be trend-based.

18. Level changes should use hysteresis.

19. All important thresholds must be configurable.

20. All assessment results must be historically preserved.

21. The architecture must support future integration with human coaches.

22. The system must be extensible to new exercises, skills, goals, and assessment types without changing core Java business logic.

==================================================
40. FINAL DELIVERABLE
==================================================

Do NOT provide only a conceptual explanation.

Produce a complete software design specification that a development team can directly use to implement the system.

Include:

- architecture diagrams in Mermaid
- ERD in Mermaid
- sequence diagrams in Mermaid
- activity diagrams where useful
- decision flow
- scoring formulas
- pseudocode
- database schema
- API specification
- Java class/service structure
- sample JSON
- sample database records
- sample recommendation output
- testing scenarios

Clearly separate:

A. USER-REPORTED DATA
B. OBJECTIVE MEASURED DATA
C. RULE-BASED DECISION
D. AI-GENERATED EXPLANATION

The final system should behave as:

User completes Initial Questionnaire
        ↓
System estimates initial capability
        ↓
System determines provisional level
        ↓
System identifies goal
        ↓
System identifies skill gaps
        ↓
System checks prerequisites
        ↓
System recommends appropriate progression
        ↓
System generates personalized roadmap
        ↓
System generates training plan
        ↓
User trains
        ↓
System collects performance
        ↓
Periodic practical assessment
        ↓
MediaPipe measures movement
        ↓
Rule Engine evaluates performance
        ↓
AI explains feedback
        ↓
System updates competency
        ↓
System updates level
        ↓
System recalculates skill gaps
        ↓
System adapts the next training cycle

The goal is to build a scientifically grounded, explainable, configurable, and production-ready adaptive calisthenics recommendation engine for CalisHealth.