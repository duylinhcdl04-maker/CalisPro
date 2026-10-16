# CALISHEALTH — EXERCISE BUILDER
# FRONTEND-FIRST PRODUCTION IMPLEMENTATION PROMPT
# React + TypeScript + body-muscles

You are a Senior Frontend Engineer, Senior UX/UI Designer,
Health-Tech Product Designer, and React Architect.

You are building the Exercise Builder module for CalisHealth.

CalisHealth is an AI-powered Calisthenics training platform.

The platform allows users to:

- Learn calisthenics exercises
- Follow personalized workout plans
- Understand which muscles are involved in each exercise
- Learn correct exercise technique
- Receive AI movement analysis
- Receive real-time form feedback
- Track exercise performance
- Work with AI Coaching and Human Coaches

The Exercise Builder is an ADMIN / COACH tool.

It is NOT a simple CRUD form.

It is the foundation for the entire CalisHealth exercise knowledge system.

The frontend must be designed and implemented FIRST.

The backend does not need to be connected yet.

However, the frontend architecture and data structures MUST be designed so that
they can later connect cleanly to:

Java Spring Boot REST API
+
MySQL

===========================================================
1. CORE TECHNOLOGY STACK
===========================================================

Use:

React
TypeScript
Vite
Tailwind CSS
shadcn/ui
Radix UI
Lucide React
React Hook Form
Zod
TanStack Query
Axios
Sonner
Motion
dnd-kit

Anatomy visualization:

body-muscles

Repository:

https://github.com/vulovix/body-muscles

NPM package:

body-muscles

IMPORTANT:

Use the body-muscles repository/package for the interactive anatomy selector.

DO NOT manually draw a human body SVG.

DO NOT create a custom anatomy illustration.

DO NOT replace body-muscles with a generic icon.

The body-muscles component must be treated as a reusable
"AnatomySelector" component inside the CalisHealth design system.

===========================================================
2. IMPORTANT ARCHITECTURAL PRINCIPLE
===========================================================

body-muscles is ONLY the visualization and selection layer.

It must NOT become the database model.

Do NOT couple the CalisHealth domain model directly to
body-muscles internal implementation.

Create an adapter layer:

CalisHealth Muscle
        ↓
BodyMuscles Adapter
        ↓
body-muscles

Example:

CalisHealth:

{
  id: "muscle_pectoralis_major",
  code: "PECTORALIS_MAJOR",
  name: "Pectoralis Major",
  nameVi: "Cơ ngực lớn",
  bodyMusclesId: "chest"
}

The UI adapter converts:

bodyMusclesId

into the corresponding body-muscles visualization identifier.

This allows the anatomy library to be replaced in the future
without changing the Exercise domain model.

===========================================================
3. PROJECT GOAL
===========================================================

Build:

/admin/exercises/new

and:

/admin/exercises/:id/edit

The main feature is:

CREATE / EDIT EXERCISE

The user is an:

ADMIN

or:

COACH

===========================================================
4. DESIGN DIRECTION
===========================================================

The UI must feel like:

Premium Health-Tech
+
Sports Science
+
AI Coaching
+
Professional SaaS

Design keywords:

Clean
Scientific
Modern
Minimal
Premium
Trustworthy
Athletic
Professional
Data-driven

Avoid:

Gaming UI
Neon colors
Excessive gradients
Heavy glassmorphism
Excessive shadows
Overly rounded cards
Huge decorative graphics
Unnecessary animations
Generic Bootstrap dashboard appearance

The interface should feel closer to:

Modern medical / sports science software
rather than
a generic admin dashboard.

===========================================================
5. COLOR SYSTEM
===========================================================

Create centralized design tokens.

Background:

#F7F8F6

Surface:

#FFFFFF

Secondary Surface:

#F1F3F0

Border:

#E2E5E1

Primary Text:

#171817

Secondary Text:

#6B716B

Muted:

#929792

Primary Brand:

#4F7F61

Light Brand:

#EAF2EC

Warning:

#C28A35

Danger:

#B85C5C

Info:

#547A9A

Do not hard-code colors repeatedly.

Use CSS variables.

Prepare the design system for future dark mode.

===========================================================
6. TYPOGRAPHY
===========================================================

Use:

Inter

or:

Manrope

Hierarchy:

Page title:
30–32px

Section title:
20–24px

Card title:
16–18px

Body:
14–16px

Helper:
12–13px

Use font weight carefully.

Do not make every label bold.

===========================================================
7. PAGE STRUCTURE
===========================================================

The page must NOT be a giant single form.

Use a multi-step Exercise Builder.

Steps:

01 Basic Information

02 Media

03 Muscles & Movement

04 Technique & Coaching

05 AI Motion Analysis

06 Review & Publish

Desktop layout:

------------------------------------------------------------

HEADER

------------------------------------------------------------

STEPPER

------------------------------------------------------------

MAIN CONTENT

70%:

FORM

30%:

LIVE USER PREVIEW

------------------------------------------------------------

BOTTOM ACTION BAR

------------------------------------------------------------

The right preview must be sticky.

===========================================================
8. HEADER
===========================================================

Header:

LEFT:

← Exercise Library

CENTER / MAIN:

Create Exercise

Subtitle:

"Add a structured exercise to the CalisHealth Exercise Library."

RIGHT:

Autosave status

Save Draft

Preview

Publish

Example:

● Saved 8 seconds ago

When unsaved:

● Unsaved changes

When saving:

Saving...

===========================================================
9. STEPPER
===========================================================

Create:

ExerciseStepper

Steps:

01 Basic
02 Media
03 Muscles
04 Technique
05 AI Analysis
06 Review

States:

Active
Completed
Incomplete
Error

Example:

✓ Basic
✓ Media
● Muscles
○ Technique
○ AI Analysis
○ Review

Completed steps are clickable.

Do not allow publishing if required steps are incomplete.

===========================================================
10. FORM STATE ARCHITECTURE
===========================================================

Use one centralized form state.

React Hook Form.

Do NOT create independent disconnected forms for every step.

Use:

useForm()

with:

FormProvider

Each step consumes the same form context.

Example conceptual structure:

ExerciseBuilder
    |
    ├── FormProvider
    |
    ├── BasicInformationStep
    ├── MediaStep
    ├── MusclesMovementStep
    ├── TechniqueStep
    ├── AIMotionAnalysisStep
    └── ReviewStep

This ensures:

No data loss
Easy validation
Easy autosave
Easy final submission

===========================================================
11. TYPESCRIPT DOMAIN MODEL
===========================================================

Create:

ExerciseFormData

Exercise

ExerciseMedia

MovementPhase

MuscleTarget

MuscleSensation

TechniqueInstruction

CoachingCue

CommonMistake

SafetyGuidance

AIRule

AIJointRule

AIROMRule

AITempoRule

AIFeedback

ExerciseVersion

===========================================================
12. EXERCISE FORM DATA
===========================================================

Use a structure similar to:

ExerciseFormData:

{
  basicInformation: {
    name: string,
    displayName?: string,
    category: ExerciseCategory,
    difficulty: DifficultyLevel,
    movementPattern: MovementPattern,
    equipment: Equipment[],
    description?: string,
    tags: string[]
  },

  media: {
    video?: MediaAsset,
    thumbnail?: MediaAsset,
    animation?: MediaAsset,
    phases: MovementPhase[]
  },

  muscles: {
    targets: MuscleTarget[]
  },

  technique: {
    setup: string,
    execution: string,
    breathing?: BreathingInstruction,
    tempo?: Tempo,
    coachingCues: CoachingCue[],
    commonMistakes: CommonMistake[],
    safety?: SafetyGuidance
  },

  aiAnalysis: {
    enabled: boolean,
    landmarks: LandmarkConfig[],
    jointRules: AIJointRule[],
    romRules: AIROMRule[],
    tempoRules: AITempoRule[],
    errorRules: AIRule[]
  }
}

===========================================================
13. STEP 01 — BASIC INFORMATION
===========================================================

Title:

Basic Information

Description:

"Define the core information users and coaches will see."

GROUP 1:

GENERAL INFORMATION

Exercise Name *

Display Name

Short Description

Exercise Name:

Input

Placeholder:

"e.g. Push Up"

Validation:

Required
2–100 characters

Display Name:

Optional localized name.

Short Description:

Maximum 300 characters.

Show character counter.

===========================================================
14. CLASSIFICATION
===========================================================

Category:

Strength
Skill
Mobility
Flexibility
Endurance
Conditioning
Recovery

Difficulty:

Beginner
Intermediate
Advanced
Expert

Movement Pattern:

Horizontal Push
Vertical Push
Horizontal Pull
Vertical Pull
Squat
Hinge
Lunge
Core Flexion
Core Extension
Rotation
Anti-Rotation
Static Hold
Locomotion

Equipment:

No Equipment
Resistance Band
Pull-up Bar
Parallel Bars
Rings
Dumbbell
Kettlebell
Bench
Other

Allow multiple equipment selections.

===========================================================
15. TAG SYSTEM
===========================================================

Tag input.

Examples:

Push
Upper Body
Chest
Strength
Bodyweight

Allow:

Add
Delete
Reorder

Prevent duplicate tags.

===========================================================
16. STEP 02 — MEDIA
===========================================================

Title:

Media & Movement Demonstration

Description:

"Add visual resources that help users understand the exercise."

===========================================================
17. MAIN VIDEO UPLOAD
===========================================================

Create:

MediaUploader

States:

Empty
Uploading
Processing
Uploaded
Error

Empty state:

-----------------------------------------

🎥

Upload Exercise Video

MP4, MOV, WebM

Maximum size: 500MB

[Choose Video]

-----------------------------------------

Uploaded state:

Thumbnail

Duration

Resolution

File size

File name

Actions:

Preview

Replace

Remove

Do not actually upload to a server yet.

Use mock upload state.

Architecture must be ready for:

POST /api/v1/admin/exercises/{id}/media

===========================================================
18. THUMBNAIL
===========================================================

Image uploader.

Recommended:

16:9

Preview image.

Actions:

Replace
Remove

===========================================================
19. MOVEMENT PHASES
===========================================================

Create:

MovementPhaseBuilder

Allow:

Add Phase
Edit
Delete
Reorder

Use:

dnd-kit

Default phases:

01 Setup

02 Eccentric

03 Bottom Position

04 Concentric

05 Finish

Each phase:

name

description

media

coachingCue

breathing

muscleFocus

Example:

-----------------------------------------
☷ 01 Setup

Description

"Place hands slightly wider than shoulder width."

Coaching Cue

"Brace your core."

Media

[Add Media]

-----------------------------------------

===========================================================
20. STEP 03 — MUSCLES & MOVEMENT
===========================================================

THIS IS THE MOST IMPORTANT STEP.

Use:

body-muscles

as the anatomy selector.

Layout:

LEFT:

Interactive Anatomy

RIGHT:

Selected Muscles

BOTTOM:

Selected Muscle Configuration

===========================================================
21. ANATOMY SELECTOR
===========================================================

Create reusable component:

AnatomySelector.tsx

It should wrap body-muscles.

Features:

Front View

Back View

Click

Hover

Selected state

Multi-selection

Intensity visualization

Tooltip

Search

Reset

The anatomy component must have:

controlled state.

Example:

selectedMuscleIds

onMuscleSelect

onMuscleRemove

view

onViewChange

===========================================================
22. ANATOMY MAP UI
===========================================================

Display:

[ FRONT ] [ BACK ]

Large centered anatomy visualization.

Below:

Search muscles

[ Search muscle... ]

Actions:

Clear Selection

Select All

Do NOT actually use "Select All" if it has no practical purpose;
only implement if the underlying library supports a meaningful
selection behavior.

When hovering:

Show:

Chest

Pectoralis Major

Click:

Select muscle.

Selected muscle:

highlight.

===========================================================
23. BODY-MUSCLES ADAPTER
===========================================================

Create:

bodyMusclesAdapter.ts

Responsibilities:

Convert:

CalisHealth muscle ID

to:

body-muscles ID

Convert:

body-muscles selected ID

back to:

CalisHealth muscle.

Do not spread body-muscles identifiers throughout the application.

Bad:

"chest"

inside 20 components.

Good:

MUSCLE_MAP.PECTORALIS_MAJOR

Use centralized mapping.

===========================================================
24. SELECTED MUSCLE PANEL
===========================================================

Right side:

SELECTED MUSCLES

Sections:

PRIMARY

SECONDARY

STABILIZERS

Example:

PRIMARY

● Chest
  High
  Bilateral

SECONDARY

● Triceps
  Moderate
  Bilateral

● Anterior Deltoid
  Moderate
  Bilateral

STABILIZERS

● Core
  Moderate
  Central

Each row:

Muscle name

Role

Activation

Laterality

Remove button

Click row:

open configuration.

===========================================================
25. MUSCLE ROLE
===========================================================

Supported roles:

PRIMARY

SECONDARY

STABILIZER

Do NOT allow arbitrary roles.

Use enum.

===========================================================
26. MUSCLE ACTIVATION
===========================================================

UI:

Low

Moderate

High

Very High

Do NOT present activation as scientifically precise
percentage values.

Internally support:

LOW
MODERATE
HIGH
VERY_HIGH

If the anatomy library requires a number:

map:

LOW → 2

MODERATE → 5

HIGH → 8

VERY_HIGH → 10

This mapping must be handled by the adapter layer.

===========================================================
27. MUSCLE LATERALITY
===========================================================

Options:

Bilateral
Left
Right
Central

Default:

Bilateral

Do not force users to select left/right for normal bilateral exercises.

===========================================================
28. MUSCLE CONFIGURATION
===========================================================

When clicking a selected muscle:

Open:

MuscleDetailsPanel

Example:

---------------------------------------------

Chest

Pectoralis Major

ROLE

[ Primary ] [ Secondary ] [ Stabilizer ]

ACTIVATION

Low
Moderate
High
Very High

LATERALITY

Bilateral
Left
Right
Central

---------------------------------------------

EXPECTED SENSATION

[✓] Muscle Tension

[✓] Stretch

[✓] Fatigue

[ ] Pump

[ ] Burning

---------------------------------------------

USER GUIDANCE

Textarea

"Feel the chest working during the lowering
and pushing phases."

---------------------------------------------

[Cancel]

[Save Muscle]

---------------------------------------------

===========================================================
29. EXPECTED SENSATION
===========================================================

Supported:

Muscle Tension

Stretch

Fatigue

Pump

Burning

Stabilization Effort

Allow multiple.

Do NOT imply that these sensations are medical diagnostic criteria.

===========================================================
30. UNEXPECTED SENSATION
===========================================================

Supported:

Sharp Pain

Joint Pain

Numbness

Tingling

Unusual Discomfort

Display a safety notice:

"These sensations are general exercise guidance and are not
medical diagnoses."

===========================================================
31. MUSCLE USER GUIDANCE
===========================================================

Textarea:

"What should the user feel?"

Maximum:

500 characters.

Example:

"Users should feel controlled tension through the chest
during the lowering and pushing phases."

===========================================================
32. MUSCLE MAP VISUAL LEGEND
===========================================================

Create legend:

Primary
●

Secondary
●

Stabilizer
●

The exact visual color should come from the centralized design system.

Do not hard-code color values inside AnatomySelector.

===========================================================
33. MUSCLE SEARCH
===========================================================

Search by:

English name

Vietnamese name

Muscle code

Region

Example:

Search:

"ngực"

Results:

Pectoralis Major

Pectoralis Minor

Allow clicking search result to focus/select the muscle.

===========================================================
34. STEP 04 — TECHNIQUE & COACHING
===========================================================

Sections:

Setup

Execution

Breathing

Tempo

Coaching Cues

Common Mistakes

Safety

===========================================================
35. SETUP
===========================================================

Textarea or structured rich text.

Example:

"Place hands slightly wider than shoulder width."

Required.

===========================================================
36. EXECUTION
===========================================================

Textarea.

Required.

Example:

"Lower the body under control while maintaining
a stable trunk position."

===========================================================
37. BREATHING
===========================================================

Fields:

Inhale During

Exhale During

Optional.

===========================================================
38. TEMPO
===========================================================

Optional.

Fields:

Eccentric

Pause

Concentric

Pause

Example:

2 - 0 - 1 - 0

Do not require tempo for all exercises.

===========================================================
39. COACHING CUES
===========================================================

Create:

CoachingCueBuilder

Each cue:

Text

Priority

Optional phase

Example:

"Brace your core."

"Keep your neck neutral."

"Push the floor away."

Allow:

Add
Edit
Delete
Reorder

Use dnd-kit.

===========================================================
40. COMMON MISTAKES
===========================================================

Create:

CommonMistakeBuilder

Each mistake:

Name

Problem

Why it happens

Correction

Severity

Optional media

Severity:

LOW

MEDIUM

HIGH

Example:

Hip Sagging

Problem:

The hips drop below neutral alignment.

Why:

Insufficient core tension.

Correction:

Brace your core and maintain alignment.

===========================================================
41. SAFETY GUIDANCE
===========================================================

Fields:

Safety Cues

Stop Conditions

General Considerations

Example:

"Perform the movement in a controlled range."

"Stop if you experience sharp or unusual pain."

Avoid medical diagnosis.

===========================================================
42. STEP 05 — AI MOTION ANALYSIS
===========================================================

This is an ADVANCED section.

Do not make it visually dominant.

Use:

Accordion

"Advanced AI Motion Analysis"

Toggle:

Enable AI Analysis

If disabled:

Hide advanced configuration.

===========================================================
43. LANDMARKS
===========================================================

Create:

LandmarkSelector

Support MediaPipe Pose landmarks.

Examples:

Nose

Left Shoulder

Right Shoulder

Left Elbow

Right Elbow

Left Wrist

Right Wrist

Left Hip

Right Hip

Left Knee

Right Knee

Left Ankle

Right Ankle

Allow:

Enable

Disable

Use for analysis

===========================================================
44. JOINT RULE BUILDER
===========================================================

Do NOT expose programming syntax.

Create visual rule builder:

WHEN

[Elbow Angle]

[Less Than]

[90°]

THEN

[Warning]

Message:

"Keep your elbow position controlled."

Supported conditions:

Greater Than

Less Than

Between

Outside Range

Increasing

Decreasing

Stable

===========================================================
45. RANGE OF MOTION
===========================================================

Fields:

Measurement

Minimum

Maximum

Tolerance

Example:

Push Up

Minimum Depth:

X

Maximum Depth:

Y

Tolerance:

±X

Add helper:

"ROM thresholds should be configured according to the
exercise standard used by CalisHealth."

===========================================================
46. TEMPO RULE
===========================================================

Fields:

Eccentric Duration

Pause

Concentric Duration

Tolerance

===========================================================
47. AI ERROR DETECTION
===========================================================

Categories:

Alignment

Joint Position

Range of Motion

Tempo

Stability

Symmetry

Each rule:

Name

Category

Condition

Severity

AI Feedback

Correction Cue

Severity:

INFO

WARNING

CRITICAL

Example:

Hip Sagging

Alignment

Hip Angle < 165°

WARNING

"Maintain a stable trunk."

===========================================================
48. AI FEEDBACK PREVIEW
===========================================================

Create preview:

----------------------------------

⚠ Form Needs Attention

Your hips are dropping.

Correction:

Brace your core and maintain
a straight body line.

Confidence:

91%

----------------------------------

This is UI preview only.

Do not implement actual AI inference.

===========================================================
49. STEP 06 — REVIEW
===========================================================

Create a final review page.

Sections:

Basic Information

Media

Muscles

Technique

AI Analysis

Each section:

✓ Complete

or:

⚠ Warning

or:

✕

Error

Clicking a section:

jump to that step.

===========================================================
50. VALIDATION
===========================================================

Required before publish:

Exercise Name

Category

Difficulty

Movement Pattern

At least one Primary Muscle

Setup

Execution

Main Exercise Video

If AI enabled:

At least one valid AI rule

Warnings should not necessarily block publishing.

Errors should block publishing.

===========================================================
51. LIVE USER PREVIEW
===========================================================

Desktop:

sticky right panel.

The preview must resemble the actual user exercise page.

Example:

-------------------------------------

Push Up

Beginner
Strength

[VIDEO]

Muscles Worked

Chest
PRIMARY
HIGH

Triceps
SECONDARY
MODERATE

Anterior Deltoid
SECONDARY
MODERATE

Core
STABILIZER
MODERATE

What You Should Feel

✓ Chest tension

✓ Triceps effort

✓ Core stabilization

Technique

Keep your body aligned...

Common Mistakes

⚠ Hip Sagging

-------------------------------------

The preview must update live.

===========================================================
52. USER PREVIEW MUSCLE VISUALIZATION
===========================================================

Use the same body-muscles component.

But:

READ-ONLY.

Do not allow editing.

When user preview selects:

Chest

display:

Chest

Primary Muscle

High Activation

What You Should Feel:

Muscle tension

Stretch

Fatigue

This ensures the Admin preview and User experience
share the same visual language.

===========================================================
53. AUTOSAVE
===========================================================

Implement frontend autosave simulation.

Use debounce.

Show:

Saving...

Saved just now

Unsaved changes

Do not make a request on every keystroke.

Prepare architecture for:

PATCH /api/v1/admin/exercises/{id}/draft

===========================================================
54. DRAFT SUPPORT
===========================================================

Allow incomplete exercises to be saved.

Status:

DRAFT

PUBLISHED

ARCHIVED

User must be able to leave and return later.

===========================================================
55. PUBLISH FLOW
===========================================================

Click:

Publish

Open confirmation dialog.

Title:

Publish Exercise?

Description:

"This exercise will become available to users
and can be included in workout plans."

Show validation summary.

Actions:

Cancel

Publish Exercise

===========================================================
56. UNSAVED CHANGES
===========================================================

If user navigates away:

Show:

Unsaved Changes

"You have changes that have not been saved."

Actions:

Stay

Discard

Save Draft

===========================================================
57. RESPONSIVE DESIGN
===========================================================

Desktop:

Form 70%

Preview 30%

Tablet:

Form 100%

Preview collapsible.

Mobile:

Single column.

Preview becomes:

Bottom Drawer.

Stepper becomes:

Horizontal scroll or vertical step list.

Do not simply shrink desktop layout.

===========================================================
58. COMPONENT ARCHITECTURE
===========================================================

Use:

src/

features/

exercises/

├── api/
│   └── exercisesApi.ts
│
├── components/
│   ├── ExerciseBuilder.tsx
│   ├── ExerciseHeader.tsx
│   ├── ExerciseStepper.tsx
│   │
│   ├── steps/
│   │   ├── BasicInformationStep.tsx
│   │   ├── MediaStep.tsx
│   │   ├── MusclesMovementStep.tsx
│   │   ├── TechniqueStep.tsx
│   │   ├── AIMotionAnalysisStep.tsx
│   │   └── ReviewStep.tsx
│   │
│   ├── anatomy/
│   │   ├── AnatomySelector.tsx
│   │   ├── AnatomyViewToggle.tsx
│   │   ├── MuscleSearch.tsx
│   │   ├── SelectedMuscleList.tsx
│   │   ├── MuscleDetailsPanel.tsx
│   │   └── bodyMusclesAdapter.ts
│   │
│   ├── media/
│   │   ├── MediaUploader.tsx
│   │   ├── VideoPreview.tsx
│   │   └── MovementPhaseBuilder.tsx
│   │
│   ├── technique/
│   │   ├── CoachingCueBuilder.tsx
│   │   ├── CommonMistakeBuilder.tsx
│   │   └── SafetyGuidance.tsx
│   │
│   ├── ai/
│   │   ├── LandmarkSelector.tsx
│   │   ├── AIRuleBuilder.tsx
│   │   ├── AIJointRuleBuilder.tsx
│   │   ├── AIROMRuleBuilder.tsx
│   │   ├── AITempoRuleBuilder.tsx
│   │   └── AIFeedbackPreview.tsx
│   │
│   └── preview/
│       ├── ExerciseLivePreview.tsx
│       └── MusclePreview.tsx
│
├── hooks/
│   ├── useExerciseForm.ts
│   ├── useExerciseAutosave.ts
│   └── useExerciseValidation.ts
│
├── schemas/
│   └── exerciseSchema.ts
│
├── types/
│   ├── exercise.ts
│   ├── muscle.ts
│   └── aiAnalysis.ts
│
├── constants/
│   ├── exerciseCategories.ts
│   ├── difficultyLevels.ts
│   ├── movementPatterns.ts
│   ├── muscleRoles.ts
│   └── bodyMusclesMap.ts
│
├── mock/
│   └── exerciseMock.ts
│
└── pages/
    ├── CreateExercisePage.tsx
    └── EditExercisePage.tsx

===========================================================
59. MUSCLE DATA MODEL
===========================================================

Create a CalisHealth-specific muscle model.

Example:

{
  id: "muscle_pectoralis_major",

  code: "PECTORALIS_MAJOR",

  name: "Pectoralis Major",

  nameVi: "Cơ ngực lớn",

  region: "CHEST",

  side: "CENTRAL",

  bodyMusclesId: "chest"
}

Do not store only:

"chest"

as the primary database identity.

Use:

CalisHealth muscle ID

as the domain identity.

===========================================================
60. MUSCLE TARGET MODEL
===========================================================

Example:

{
  muscleId: "muscle_pectoralis_major",

  role: "PRIMARY",

  activationLevel: "HIGH",

  laterality: "BILATERAL",

  expectedSensations: [
    "MUSCLE_TENSION",
    "STRETCH"
  ],

  userGuidance:
    "Feel controlled tension through the chest."
}

===========================================================
61. BODY-MUSCLES ADAPTER
===========================================================

Create:

bodyMusclesMap.ts

Example:

PECTORALIS_MAJOR:

{
  calisHealthId: "muscle_pectoralis_major",
  bodyMusclesId: "chest"
}

Do NOT reference:

"chest"

throughout the application.

Only the adapter should know the body-muscles identifier.

===========================================================
62. MOCK DATA
===========================================================

Create realistic Push Up example.

Basic:

Name:

Push Up

Category:

Strength

Difficulty:

Beginner

Movement Pattern:

Horizontal Push

Equipment:

No Equipment

Primary:

Pectoralis Major

High

Bilateral

Secondary:

Triceps

Moderate-High

Bilateral

Anterior Deltoid

Moderate

Bilateral

Stabilizer:

Core

Moderate

Central

Expected sensations:

Chest tension

Stretch

Fatigue

Technique:

Setup

Execution

Breathing

Coaching cues

Common mistakes

AI:

Landmarks

Joint rules

ROM

Tempo

Error detection

===========================================================
63. API LAYER
===========================================================

Do NOT hard-code fetch calls inside components.

Create:

exercisesApi.ts

Prepare:

GET /api/v1/admin/exercises

GET /api/v1/admin/exercises/:id

POST /api/v1/admin/exercises

PATCH /api/v1/admin/exercises/:id

PATCH /api/v1/admin/exercises/:id/draft

POST /api/v1/admin/exercises/:id/publish

POST /api/v1/admin/exercises/:id/archive

POST /api/v1/admin/exercises/:id/version

POST /api/v1/admin/exercises/:id/media

The application should work with mock data until the backend is connected.

===========================================================
64. TANSTACK QUERY
===========================================================

Use TanStack Query for:

Fetching exercises

Fetching exercise detail

Saving exercise

Publishing

Uploading media

Updating drafts

Do not manually implement unnecessary loading state logic
if TanStack Query already handles it.

===========================================================
65. FORM VALIDATION
===========================================================

Use:

React Hook Form

+

Zod

Validation should be step-aware.

Example:

Basic step:

name
category
difficulty
movementPattern

Muscle step:

minimum one Primary muscle

Technique:

setup
execution

Media:

video required before publish

AI:

only required if AI analysis is enabled.

===========================================================
66. ERROR UX
===========================================================

Do not display technical errors.

Bad:

500 Internal Server Error

Good:

"Unable to save the exercise. Please try again."

Use:

Sonner

for non-blocking notifications.

Use dialogs for destructive actions.

===========================================================
67. LOADING STATES
===========================================================

Create:

Skeleton

Spinner

Progress bar

Upload progress

Button loading state

Do not freeze the entire page during small operations.

===========================================================
68. ACCESSIBILITY
===========================================================

Support:

Keyboard navigation

Focus states

ARIA labels

Screen reader labels

Accessible dialogs

Accessible tooltips

Accessible form controls

Color contrast

Do not communicate state using color alone.

===========================================================
69. PERFORMANCE
===========================================================

Important:

body-muscles should not cause unnecessary rerenders.

Use:

memo

useMemo

useCallback

where appropriate.

Do NOT overuse memoization.

Keep the anatomy selector isolated from unrelated form fields.

Do not rerender the entire Exercise Builder
every time the anatomy selection changes.

===========================================================
70. ANIMATION
===========================================================

Use Motion only for:

Step transitions

Panel transitions

Selected muscle feedback

Modal transitions

Upload state

Keep animation subtle.

No excessive animation.

===========================================================
71. SECURITY / DATA HANDLING
===========================================================

Frontend should assume:

Admin/Coach authorization is enforced by backend.

Do not store sensitive information in localStorage.

Do not expose backend secrets.

Do not put API credentials into frontend code.

===========================================================
72. IMPORTANT UX RULE
===========================================================

The Admin/Coach should be able to create a useful exercise
without understanding AI.

Minimum workflow:

Basic

→ Media

→ Muscles

→ Technique

→ Review

AI configuration is optional advanced functionality.

===========================================================
73. ADVANCED AI UI
===========================================================

Make AI section visually separate.

Example:

----------------------------------------------

ADVANCED

AI Motion Analysis

Analyze movement using pose landmarks.

[ Enable AI Analysis ]

When enabled:

Landmarks

Joint Rules

ROM

Tempo

Form Error Rules

----------------------------------------------

Use an "Advanced" badge.

===========================================================
74. EXERCISE PREVIEW
===========================================================

The right side should always answer:

"What will the user see?"

Example:

--------------------------------------------

Push Up

Beginner

Strength

[VIDEO]

Muscles Worked

Chest
Primary · High

Triceps
Secondary · Moderate

Anterior Deltoid
Secondary · Moderate

Core
Stabilizer · Moderate

--------------------------------------------

WHAT YOU SHOULD FEEL

✓ Chest tension

✓ Controlled stretch

✓ Triceps effort

--------------------------------------------

TECHNIQUE

Keep your body aligned...

--------------------------------------------

COMMON MISTAKES

⚠ Hip sagging

--------------------------------------------

This preview must use actual form state.

Do not duplicate data.

===========================================================
75. DATA FLOW
===========================================================

The final architecture should be:

USER INPUT

↓

React Hook Form

↓

Zod Validation

↓

ExerciseFormData

↓

CalisHealth Domain Model

↓

Adapter

↓

body-muscles Visualization

↓

Live Preview

↓

Mock API

↓

Future Spring Boot REST API

===========================================================
76. DO NOT DO THESE THINGS
===========================================================

DO NOT:

Create a giant 50-field form.

Create a giant modal.

Draw custom anatomy SVG.

Hard-code muscle names inside components.

Hard-code body-muscles IDs everywhere.

Mix API calls into UI.

Use "any".

Use fake backend responses inside components.

Create AI inference logic.

Create MediaPipe inference logic.

Create medical diagnosis logic.

Use scientifically precise activation percentages
without validated data.

Make the UI look like a generic admin dashboard.

===========================================================
77. FINAL PAGE EXPERIENCE
===========================================================

The final page should feel like:

"Professional Exercise Knowledge Management System"

not:

"Simple Add Exercise Form"

Admin/Coach should feel:

"I am building a scientifically structured exercise."

The user should eventually feel:

"This exercise has a clear explanation of:

What muscles are involved

What I should feel

How I should perform it

What mistakes to avoid

How AI will evaluate my movement"

===========================================================
78. IMPLEMENTATION ORDER
===========================================================

Implement in this exact order:

PHASE 1

Design system

↓

PHASE 2

Exercise Builder layout

↓

PHASE 3

Stepper

↓

PHASE 4

Basic Information

↓

PHASE 5

Media

↓

PHASE 6

body-muscles integration

↓

PHASE 7

Muscle selection and configuration

↓

PHASE 8

Technique & Coaching

↓

PHASE 9

AI Motion Analysis UI

↓

PHASE 10

Live User Preview

↓

PHASE 11

Validation

↓

PHASE 12

Autosave mock

↓

PHASE 13

Review & Publish

↓

PHASE 14

Responsive design

↓

PHASE 15

Accessibility and polish

===========================================================
79. FINAL QUALITY REQUIREMENT
===========================================================

The result must be:

Production-quality frontend

Type-safe

Responsive

Accessible

Modular

Reusable

API-ready

Backend-independent

AI-ready

Coach-friendly

Admin-friendly

The implementation must use the body-muscles repository
for anatomy visualization.

Do not create a fake anatomy component.

Do not replace it with placeholder images.

Use realistic mock data.

Make every interaction functional.

Make the entire Exercise Builder feel like a real product,
not a static design prototype.

START IMPLEMENTATION NOW.