# CALISHEALTH — PROFESSIONAL EXERCISE BUILDER
## Frontend Design & Development Prompt

You are a Senior Product Designer, UX Architect, Health-Tech UI/UX Engineer, and Senior React Frontend Engineer.

You are designing the "Create Exercise / Add Exercise" module for CalisHealth.

CalisHealth is an AI-powered Calisthenics and fitness platform that provides:

- Exercise library
- Personalized workout plans
- AI movement analysis
- Real-time form feedback
- Coach guidance
- Exercise performance tracking
- Workout history
- Progressive training
- Muscle and movement education

The Exercise entity is a core foundation of the entire system.

This is NOT a simple CRUD form.

The Exercise Builder must allow an Admin or Coach to create a complete, structured, scientifically organized exercise containing:

Basic exercise information
+
Media
+
Movement pattern
+
Muscle targets
+
Muscle sensation
+
Technique instructions
+
Movement phases
+
Common mistakes
+
Coaching cues
+
Safety guidance
+
AI motion analysis rules
+
User-facing education content

The frontend must be production-quality, scalable, responsive, accessible, and ready to connect to a Java Spring Boot REST API and MySQL database.

==================================================
1. TECHNOLOGY STACK
==================================================

Use:

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Radix UI
- Lucide React
- React Hook Form
- Zod
- TanStack Query
- Axios
- dnd-kit
- Motion
- Sonner
- date-fns

Use TypeScript strictly.

Avoid "any".

Do not place business logic directly inside UI components.

Use feature-based architecture.

Use reusable components.

==================================================
2. DESIGN PHILOSOPHY
==================================================

The Exercise Builder should look like a premium Health-Tech SaaS product.

Design characteristics:

- Professional
- Scientific
- Clean
- Modern
- Minimal
- Athletic
- Intelligent
- Data-driven
- Trustworthy

The design should feel like:

Health-Tech
+
Sports Science
+
AI Coaching
+
Premium SaaS

Avoid:

- Generic Bootstrap admin dashboards
- Excessive gradients
- Excessive glassmorphism
- Neon colors
- Gaming aesthetics
- Excessive rounded cards
- Huge decorative elements
- Unnecessary animations
- Overly colorful UI

Prioritize information hierarchy and usability.

==================================================
3. COLOR SYSTEM
==================================================

Use centralized CSS variables.

Primary:

#111111

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

CalisHealth Green:

#4F7F61

Light Green:

#EAF2EC

Warning:

#C28A35

Danger:

#B85C5C

Info:

#547A9A

Do not hard-code colors throughout components.

Prepare the system for dark mode.

==================================================
4. TYPOGRAPHY
==================================================

Use:

Inter

or

Manrope

Page title:

32px

Section title:

20–24px

Body:

14–16px

Helper text:

12–13px

Use font weights intentionally.

Do not make every element bold.

==================================================
5. PAGE ROUTE
==================================================

Create:

/admin/exercises/new

Also support:

/admin/exercises/:id/edit

==================================================
6. MAIN PAGE LAYOUT
==================================================

Do NOT use a giant single-page form.

Use a structured multi-step Exercise Builder.

Desktop layout:

LEFT:

70%

RIGHT:

30%

Left:

Exercise Builder

Right:

Live User Preview

Overall structure:

------------------------------------------------------------

TOP HEADER

← Exercise Library

Create Exercise

[Save Draft] [Preview] [Publish]

------------------------------------------------------------

PROGRESS STEPPER

01 Basic
02 Media
03 Muscles
04 Technique
05 AI Analysis
06 Review

------------------------------------------------------------

MAIN CONTENT

┌────────────────────────────────────┐
│                                    │
│         FORM BUILDER               │
│                                    │
│                                    │
└────────────────────────────────────┘

┌──────────────────────┐
│                      │
│    LIVE PREVIEW      │
│                      │
│    User Experience   │
│                      │
└──────────────────────┘

------------------------------------------------------------

BOTTOM ACTION BAR

[Save Draft]

[Back]

[Next]

------------------------------------------------------------

The right preview should remain sticky on desktop.

==================================================
7. TOP HEADER
==================================================

Create a professional header.

Left:

← Back to Exercise Library

Center:

Create Exercise

Below title:

"Add a structured exercise to the CalisHealth Exercise Library."

Right:

Autosave status

Example:

● Saved 12 seconds ago

Actions:

Save Draft

Preview

Publish

If there are unsaved changes:

● Unsaved changes

==================================================
8. STEP NAVIGATION
==================================================

Create a horizontal stepper.

Steps:

01
Basic Information

02
Media

03
Muscles & Movement

04
Technique & Coaching

05
AI Motion Analysis

06
Review & Publish

Each step should show:

Number
Label
Completion state

States:

Active
Completed
Incomplete
Error

Example:

✓ Basic Information
✓ Media
● Muscles & Movement
○ Technique & Coaching
○ AI Analysis
○ Review

Allow clicking completed steps.

Do not allow skipping required incomplete steps unless explicitly configured.

==================================================
9. STEP 01 — BASIC INFORMATION
==================================================

Section title:

Basic Information

Description:

"Define the core information users and coaches will see."

--------------------------------------------------

FIELD 01

Exercise Name *

Input:

Push Up

Helper:

"Use a clear and recognizable exercise name."

Validation:

Required
Minimum 2 characters
Maximum 100 characters

--------------------------------------------------

FIELD 02

Display Name

Input:

Hít đất cơ bản

Helper:

"Optional localized name displayed to users."

--------------------------------------------------

FIELD 03

Exercise Category *

Select:

Strength
Skill
Mobility
Flexibility
Endurance
Conditioning
Recovery

--------------------------------------------------

FIELD 04

Difficulty Level *

Select:

Beginner
Intermediate
Advanced
Expert

Display a small difficulty badge.

--------------------------------------------------

FIELD 05

Movement Pattern *

Select:

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

--------------------------------------------------

FIELD 06

Equipment

Multi-select:

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

--------------------------------------------------

FIELD 07

Short Description

Textarea

Maximum:

300 characters

Show character counter.

--------------------------------------------------

FIELD 08

Tags

Tag input.

Examples:

Push
Upper Body
Chest
Strength
Bodyweight

Allow:

Add
Remove
Reorder

--------------------------------------------------
10. BASIC INFORMATION UX
--------------------------------------------------

Do not display every field in one giant block.

Group fields:

GENERAL

Exercise Name
Display Name
Description

CLASSIFICATION

Category
Difficulty
Movement Pattern

EQUIPMENT

Equipment

DISCOVERY

Tags

Use visual section headers.

==================================================
11. STEP 02 — MEDIA
==================================================

Title:

Media & Instruction

Description:

"Add visual content to help users understand and perform the movement correctly."

--------------------------------------------------

MAIN EXERCISE VIDEO

Create large upload area.

States:

Empty
Uploading
Processing
Uploaded
Error

Empty:

┌────────────────────────────────────────────┐
│                                            │
│                 🎥                         │
│                                            │
│         Upload Exercise Video              │
│                                            │
│   MP4, MOV, WebM                           │
│   Maximum file size: 500MB                 │
│                                            │
│           [Choose Video]                   │
│                                            │
└────────────────────────────────────────────┘

After upload:

Display:

Video thumbnail

Duration

Resolution

File size

Video name

Actions:

Replace

Remove

Preview

--------------------------------------------------

THUMBNAIL

Allow image upload.

Recommended ratio:

16:9

Show preview.

--------------------------------------------------

MOVEMENT ANIMATION

Support:

GIF
Lottie
MP4 animation

Optional.

--------------------------------------------------
12. MOVEMENT PHASES
--------------------------------------------------

Allow Coach/Admin to divide the movement into phases.

Default:

01 Setup

02 Eccentric

03 Bottom Position

04 Concentric

05 Finish

Each phase should contain:

Phase name

Description

Media

Key cue

Breathing

Muscle focus

Allow:

Add Phase

Delete Phase

Reorder Phase

Use drag-and-drop.

Example:

┌──────────────────────────────────────────────┐
│ ☷ 01 Setup                              ⋮⋮ │
│                                              │
│ Description                                  │
│ Position your hands slightly wider...        │
│                                              │
│ Coaching Cue                                 │
│ Brace your core.                             │
│                                              │
│ [Add Media]                                  │
└──────────────────────────────────────────────┘

==================================================
13. STEP 03 — MUSCLES & MOVEMENT
==================================================

Title:

Muscles & Movement

Description:

"Define which muscles are primarily responsible for the movement and what users should expect to feel."

--------------------------------------------------

INTERACTIVE ANATOMY SELECTOR

Create an anatomy illustration.

Support:

Front View
Back View

Allow clicking body regions.

When a region is selected:

Highlight it.

Show tooltip:

Chest

Primary Muscle

--------------------------------------------------

MUSCLE CLASSIFICATION

Primary Muscles

Secondary Muscles

Stabilizers

Each category supports multiple muscles.

Example:

PRIMARY

Chest

SECONDARY

Triceps
Anterior Deltoid

STABILIZERS

Core
Serratus Anterior

Use chips with remove buttons.

==================================================
14. MUSCLE ACTIVATION LEVEL
==================================================

Each muscle can have an activation level.

Options:

Low
Moderate
High
Very High

Visual:

Chest

████████████████

High

Triceps

████████████

Moderate–High

Do NOT represent this as scientifically exact percentage values unless the backend data supports validated values.

Use qualitative categories by default.

==================================================
15. MUSCLE SENSATION
==================================================

Create:

"What Should the User Feel?"

For each major muscle:

Muscle

Expected Sensation

Intensity

Examples:

Chest

"Cảm giác căng cơ và co cơ rõ ràng trong quá trình đẩy."

Intensity:

Mild
Moderate
Strong

--------------------------------------------------

NORMAL SENSATIONS

Allow selecting:

Muscle tension
Stretch
Fatigue
Burning
Pump
Stabilization effort

--------------------------------------------------

UNEXPECTED SENSATIONS

Allow:

Sharp pain
Joint pain
Numbness
Tingling
Unusual discomfort

Important:

Do not present these as medical diagnoses.

Use neutral safety language.

==================================================
16. STEP 04 — TECHNIQUE & COACHING
==================================================

Title:

Technique & Coaching

Description:

"Provide clear instructions that users and coaches can follow."

--------------------------------------------------

SETUP

Rich text or structured textarea.

Example:

"Place hands slightly wider than shoulder width. Brace the core and maintain a neutral spine."

--------------------------------------------------

EXECUTION

Textarea.

Example:

"Lower the body under control while maintaining alignment."

--------------------------------------------------

BREATHING

Two fields:

Inhale during:

Exhale during:

--------------------------------------------------

TEMPO

Optional.

Example:

2 - 0 - 1 - 0

Display:

Eccentric
Pause
Concentric
Pause

Do not force tempo for exercises where it is not appropriate.

==================================================
17. COACHING CUES
==================================================

Create reusable short coaching cues.

Example:

✓ Brace your core

✓ Keep your elbows controlled

✓ Push the floor away

✓ Keep your neck neutral

Allow:

Add Cue

Edit

Delete

Reorder

Each cue:

Maximum 120 characters.

==================================================
18. COMMON MISTAKES
==================================================

Create structured mistake cards.

Each mistake contains:

Name

Description

Why it happens

Correction

Severity

Optional media

Example:

--------------------------------------------------

Hip Sagging

Problem:

The hips drop below the body's neutral alignment.

Why it happens:

Insufficient core tension or fatigue.

Correction:

Brace the core and squeeze the glutes.

Severity:

Low
Medium
High

--------------------------------------------------

Allow:

+ Add Common Mistake

Each mistake can optionally contain:

Image

GIF

Video

==================================================
19. SAFETY GUIDANCE
==================================================

Create separate section:

Safety & Considerations

Fields:

Contraindication Notes

Safety Cues

Stop Conditions

Example:

Safety Cue:

"Perform the movement in a controlled range that you can maintain with good form."

Stop Condition:

"Stop the exercise if you experience sharp or unusual pain."

Do not make medical claims.

==================================================
20. STEP 05 — AI MOTION ANALYSIS
==================================================

Title:

AI Motion Analysis

Description:

"Configure how CalisHealth AI evaluates movement quality."

Important:

This section must be designed for technical Admin/Coach users.

Do not expose technical AI configuration to normal users.

--------------------------------------------------
21. LANDMARK CONFIGURATION
--------------------------------------------------

Display:

MediaPipe Pose

33 Landmarks

Create searchable landmark list.

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

==================================================
22. JOINT ANGLE RULES
==================================================

Create visual rule builder.

DO NOT require Admin to write code.

Use:

WHEN

[Joint / Measurement ▼]

[Condition ▼]

[Value]

THEN

[Action ▼]

Example:

WHEN

Elbow Angle

IS LESS THAN

90°

THEN

Trigger:

Warning

Message:

"Maintain controlled elbow positioning."

--------------------------------------------------

Supported conditions:

Greater Than
Less Than
Between
Outside Range
Increasing
Decreasing
Stable

==================================================
23. RANGE OF MOTION RULE
==================================================

Allow:

Movement Name

Minimum ROM

Maximum ROM

Tolerance

Example:

Push Up

Minimum Depth:

5 cm

Tolerance:

±2 cm

The UI must explain:

"ROM thresholds are exercise-specific and should be configured based on the exercise standard used by CalisHealth."

==================================================
24. TEMPO ANALYSIS
==================================================

Allow:

Eccentric duration

Pause duration

Concentric duration

Tolerance

Example:

2 sec
0 sec
1 sec
±0.5 sec

==================================================
25. FORM ERROR RULES
==================================================

Create:

+ Add AI Detection Rule

Each rule:

Rule Name

Category

Condition

Severity

Feedback

Correction Cue

Example:

Rule:

Hip Sagging

Category:

Alignment

Condition:

Hip Angle < 165°

Severity:

Warning

AI Feedback:

"Your hips are dropping."

Correction:

"Brace your core and squeeze your glutes."

Categories:

Alignment
Joint Position
Range of Motion
Tempo
Stability
Symmetry

Severity:

Info
Warning
Critical

==================================================
26. AI RULE BUILDER UX
==================================================

Use a human-readable rule builder.

Never display raw programming syntax.

Bad:

if hipAngle < 165

Good:

WHEN

Hip Angle

LESS THAN

165°

THEN

Show Warning

"Maintain a straight body line."

==================================================
27. AI FEEDBACK PREVIEW
==================================================

Allow Admin to test how the feedback will look.

Example:

┌──────────────────────────────────────────────┐
│ AI FEEDBACK PREVIEW                          │
│                                              │
│ ⚠ Hip position needs attention              │
│                                              │
│ Keep your core engaged and maintain          │
│ a straight body line.                        │
│                                              │
│ Confidence: 91%                              │
└──────────────────────────────────────────────┘

This is a preview only.

==================================================
28. STEP 06 — REVIEW & PUBLISH
==================================================

Create final validation screen.

Show:

BASIC INFORMATION

✓ Exercise Name

✓ Category

✓ Difficulty

✓ Movement Pattern

MEDIA

✓ Video

✓ Thumbnail

MUSCLES

✓ Primary Muscles

✓ Secondary Muscles

✓ Stabilizers

TECHNIQUE

✓ Setup

✓ Execution

✓ Coaching Cues

AI

✓ Landmarks

✓ Joint Rules

✓ ROM

✓ Tempo

✓ Error Rules

==================================================
29. VALIDATION SYSTEM
==================================================

Before publishing, validate:

Required name

Category

Difficulty

Movement Pattern

At least one primary muscle

Technique instructions

At least one media asset

If AI analysis is enabled:

At least one valid AI rule

Show validation summary.

Example:

READY TO PUBLISH

✓ 6/6 required sections completed

Warnings:

⚠ No common mistakes configured

⚠ AI analysis has only one detection rule

Warnings should NOT necessarily block publishing.

Errors should block publishing.

==================================================
30. DRAFT STATUS
==================================================

Exercise statuses:

DRAFT

PUBLISHED

ARCHIVED

When saving incomplete data:

Allow Save Draft.

When publishing:

Require validation.

==================================================
31. VERSIONING
==================================================

Published exercises should support versions.

Example:

Push Up

Version 1.0

Version 1.1

When editing a published exercise:

Do not silently modify production data.

Offer:

"Create New Version"

Display:

Current Published Version

Draft Version

==================================================
32. LIVE USER PREVIEW
==================================================

The right sidebar must show how the exercise will appear to normal users.

Preview:

Exercise Name

Difficulty

Category

Video

Muscle Targets

What You Should Feel

Technique

Common Mistakes

AI Analysis Summary

Example:

┌───────────────────────────────┐
│ Push Up                       │
│ Beginner · Strength          │
│                               │
│       [ VIDEO ]               │
│                               │
│ MUSCLES                       │
│ Chest       ███████████       │
│ Triceps     ████████          │
│ Shoulder    ██████            │
│                               │
│ WHAT YOU SHOULD FEEL          │
│ ✓ Chest tension               │
│ ✓ Triceps effort              │
│ ✓ Core stabilization          │
│                               │
│ TECHNIQUE                     │
│ Keep your body aligned...     │
│                               │
│ COMMON MISTAKES               │
│ ⚠ Hip sagging                 │
│                               │
└───────────────────────────────┘

The preview updates in real time as the form changes.

==================================================
33. AUTOSAVE
==================================================

Implement autosave behavior.

Display:

Saving...

Saved just now

Unsaved changes

Autosave should not interrupt typing.

Debounce requests.

Prepare API architecture for:

PATCH /api/v1/admin/exercises/:id/draft

==================================================
34. UNSAVED CHANGES
==================================================

If user tries to leave with unsaved changes:

Show dialog:

"Unsaved Changes"

"You have changes that have not been saved."

Actions:

Stay

Discard Changes

Save Draft

==================================================
35. ACCESSIBILITY
==================================================

Support:

Keyboard navigation

Focus states

Screen reader labels

ARIA

Accessible dialogs

Accessible form controls

Color contrast

Do not use color alone to communicate validation.

==================================================
36. RESPONSIVE DESIGN
==================================================

Desktop:

70% form

30% preview

Tablet:

Full-width form

Preview becomes collapsible drawer

Mobile:

Single-column

Step navigation becomes vertical or horizontal scroll

Preview becomes bottom drawer

Never simply shrink the desktop UI.

==================================================
37. LOADING STATES
==================================================

Create skeletons for:

Exercise form

Media upload

Anatomy selector

Exercise preview

AI rules

==================================================
38. ERROR STATES
==================================================

Use user-friendly messages.

Bad:

500 Internal Server Error

Good:

"Unable to save the exercise. Please try again."

Provide:

Retry

==================================================
39. COMPONENT ARCHITECTURE
==================================================

Use feature-based structure:

src/

features/

exercises/

├── api/
│   └── exercisesApi.ts
│
├── components/
│   ├── ExerciseBuilder.tsx
│   ├── ExerciseStepper.tsx
│   ├── BasicInformationForm.tsx
│   ├── MediaUploader.tsx
│   ├── MovementPhaseBuilder.tsx
│   ├── AnatomySelector.tsx
│   ├── MuscleSelector.tsx
│   ├── MuscleSensationForm.tsx
│   ├── TechniqueForm.tsx
│   ├── CoachingCueBuilder.tsx
│   ├── CommonMistakeBuilder.tsx
│   ├── SafetyGuidance.tsx
│   ├── AIRuleBuilder.tsx
│   ├── LandmarkSelector.tsx
│   ├── JointRuleBuilder.tsx
│   ├── ROMRuleBuilder.tsx
│   ├── TempoRuleBuilder.tsx
│   ├── AIFeedbackPreview.tsx
│   ├── ExerciseLivePreview.tsx
│   └── PublishDialog.tsx
│
├── hooks/
│   ├── useExercise.ts
│   ├── useCreateExercise.ts
│   ├── useUpdateExercise.ts
│   └── useExerciseAutosave.ts
│
├── schemas/
│   └── exerciseSchema.ts
│
├── types/
│   └── exercise.ts
│
├── mock/
│   └── exerciseMock.ts
│
└── pages/
    ├── CreateExercisePage.tsx
    └── EditExercisePage.tsx

==================================================
40. TYPESCRIPT DATA MODEL
==================================================

Do not create one giant Exercise object.

Separate:

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

AILandmarkRule

AIJointRule

AIROMRule

AITempoRule

AIFeedback

ExerciseVersion

==================================================
41. API PREPARATION
==================================================

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

GET /api/v1/admin/exercises/:id/versions

==================================================
42. MOCK DATA
==================================================

Until Spring Boot is connected, use realistic mock data.

Example:

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

Chest

Secondary:

Triceps

Anterior Deltoid

Stabilizers:

Core

Serratus Anterior

AI:

33 Landmarks

4 Joint Rules

3 ROM Rules

2 Tempo Rules

4 Error Detection Rules

Do not put mock data directly inside components.

==================================================
43. FORM VALIDATION
==================================================

Use React Hook Form + Zod.

Example validation:

exerciseName:
required
2–100 characters

category:
required

difficulty:
required

movementPattern:
required

primaryMuscles:
minimum 1

description:
maximum 300 characters

technique.setup:
required

technique.execution:
required

media.video:
required before publish

AI rules:
optional unless AI analysis is enabled

==================================================
44. UX PRINCIPLE — PROGRESSIVE DISCLOSURE
==================================================

Do NOT expose every advanced configuration immediately.

Basic users should be able to create:

Name

Category

Difficulty

Movement Pattern

Video

Muscles

Technique

and publish.

Advanced AI configuration should be visually separated.

Use:

"Advanced AI Analysis"

Expandable section.

This prevents the form from becoming intimidating.

==================================================
45. UX PRINCIPLE — SAVE DRAFT FIRST
==================================================

Never force Admin/Coach to complete every section before saving.

Allow:

Save Draft

at every stage.

Example:

User completes Basic Information.

Clicks:

Save Draft.

The system stores:

DRAFT

The user can return later.

==================================================
46. UX PRINCIPLE — NO DATA LOSS
==================================================

Never lose:

Text input

Selected muscles

Uploaded metadata

AI rules

Movement phases

when navigating between steps.

Use a single form state.

Persist draft state through API.

==================================================
47. FINAL VISUAL STRUCTURE
==================================================

The finished page should look approximately like:

┌──────────────────────────────────────────────────────────────────┐
│ ← Exercise Library          Create Exercise     Saved ✓          │
│ Add a structured exercise to the CalisHealth Exercise Library   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ① Basic   ② Media   ③ Muscles   ④ Technique   ⑤ AI   ⑥ Review │
│                                                                  │
├──────────────────────────────────────────────┬───────────────────┤
│                                              │                   │
│ BASIC INFORMATION                            │ LIVE PREVIEW      │
│                                              │                   │
│ Exercise Name                                │ Push Up           │
│ [Push Up                                  ]  │                   │
│                                              │ [VIDEO]           │
│ Category             Difficulty              │                   │
│ [Strength ▼]         [Beginner ▼]            │ Chest             │
│                                              │ ███████████       │
│ Movement Pattern     Equipment               │                   │
│ [Horizontal Push]    [No Equipment]          │ Triceps           │
│                                              │ ████████          │
│ Description                                  │                   │
│ [........................................]   │                   │
│                                              │ WHAT YOU FEEL     │
│ Tags                                         │                   │
│ [Push] [Strength] [+]                       │ ✓ Chest tension   │
│                                              │ ✓ Triceps effort  │
│                                              │                   │
├──────────────────────────────────────────────┴───────────────────┤
│                                                                  │
│ [Save Draft]                         [Back] [Next →]             │
└──────────────────────────────────────────────────────────────────┘

==================================================
48. IMPORTANT PRODUCT PRINCIPLE
==================================================

The Exercise Builder is the foundation of the CalisHealth system.

It must support this future flow:

EXERCISE LIBRARY
        ↓
WORKOUT PLAN
        ↓
WORKOUT SESSION
        ↓
CAMERA / MEDIAPIPE
        ↓
AI MOTION ANALYSIS
        ↓
FORM FEEDBACK
        ↓
PERFORMANCE
        ↓
PROGRESS
        ↓
PERSONALIZED PLAN ADJUSTMENT

Therefore:

Do not design the Exercise form as an isolated CRUD page.

Design it as a structured Exercise Knowledge System.

==================================================
49. FINAL IMPLEMENTATION REQUIREMENT
==================================================

Build the frontend as production-quality React code.

The result must be:

- Professional
- Clean
- Responsive
- Accessible
- Type-safe
- Modular
- API-ready
- Scalable
- AI-ready
- Coach-friendly
- Admin-friendly

Do not generate a simple mockup.

Implement the actual interactive form.

The following must work:

- Step navigation
- Form validation
- Save Draft
- Autosave
- Media upload UI
- Muscle selection
- Anatomy interaction
- Movement phase management
- Drag-and-drop
- Coaching cue management
- Common mistake management
- AI rule builder
- Live preview
- Review validation
- Publish confirmation
- Unsaved changes protection

Start implementation with:

1. Design system
2. Exercise Builder layout
3. Stepper
4. Basic Information
5. Media
6. Muscles & Movement
7. Technique & Coaching
8. AI Motion Analysis
9. Review
10. Live User Preview

Do not implement unrelated modules.