# CALISHEALTH — WORKOUT PLAN BUILDER

## COMPLETE FRONTEND DESIGN & DEVELOPMENT PROMPT

You are a Senior Product Designer, UX Engineer, and Senior React Frontend Engineer specializing in Health-Tech, Fitness SaaS, and AI-powered training platforms.

Your task is to design and implement a professional, production-quality frontend module for **Workout Plan / Training Program Management** for the CalisHealth platform.

CalisHealth is an AI-powered calisthenics and fitness platform that creates personalized training programs based on:

* User goals
* Fitness level
* Initial assessment
* Exercise ability
* Training frequency
* Exercise performance
* Workout history
* Progress
* AI analysis
* Coach recommendations

The Workout Plan Builder is one of the core modules of the Admin/Coach system.

The objective is NOT to create a simple CRUD form.

Build a complete visual **Workout Plan Builder** that allows an Admin or Coach to create, edit, organize, preview, publish, and manage multi-week calisthenics training programs.

The frontend must be scalable and ready to connect to:

React
↓
TanStack Query
↓
Axios
↓
Spring Boot REST API
↓
MySQL

---

# 1. TECHNOLOGY STACK

---

Use:

* React
* TypeScript
* Vite
* Tailwind CSS
* shadcn/ui
* Radix UI
* Lucide React
* Motion
* React Router
* TanStack Query
* Axios
* React Hook Form
* Zod
* Recharts
* Sonner
* date-fns
* dnd-kit for drag-and-drop

Use TypeScript strictly.

Do not use `any` unless absolutely unavoidable.

Do not introduce unnecessary UI libraries.

Use reusable components.

Use shadcn/ui as the base component system and customize it with the CalisHealth design system.

---

# 2. PRODUCT OBJECTIVE

---

The Workout Plan Builder must allow Admins and Coaches to create a complete training program.

The hierarchy is:

WORKOUT PROGRAM
↓
WEEK
↓
TRAINING DAY
↓
WORKOUT SECTION
↓
EXERCISE
↓
SETS / REPS / TIME / INTENSITY

Example:

Beginner Strength Foundation
│
├── Week 1
│   ├── Day 1 — Push
│   │   ├── Warm-up
│   │   ├── Main Workout
│   │   ├── Skill
│   │   └── Cooldown
│   │
│   ├── Day 2 — Pull
│   └── Day 3 — Legs
│
├── Week 2
├── Week 3
├── Week 4
└── Week 5...

The system must support programs ranging from:

4 weeks
6 weeks
8 weeks
12 weeks
16 weeks

The architecture must NOT hard-code the number of weeks.

---

# 3. DESIGN DIRECTION

---

The UI should look like a premium Health-Tech SaaS product.

Visual characteristics:

* Modern
* Minimal
* Professional
* Scientific
* Athletic
* Intelligent
* Clean
* Data-driven

The design should feel like:

Premium Fitness Platform
+
Health-Tech SaaS
+
AI Coaching System

Do NOT make it look like:

* Generic Bootstrap Admin
* Generic CRUD dashboard
* Gaming UI
* Bodybuilding website
* Excessively colorful fitness app

Avoid:

* Excessive gradients
* Excessive glassmorphism
* Excessive shadows
* Neon colors
* Huge cards
* Excessive rounded corners
* Excessive animation
* Decorative elements that do not provide information

The interface must prioritize usability.

---

# 4. COLOR SYSTEM

---

Create a centralized design token system.

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

CalisHealth Accent:

#4F7F61

Accent Light:

#EAF2EC

Success:

#4F7F61

Warning:

#C28A35

Danger:

#B85C5C

Info:

#547A9A

Do not hard-code colors throughout components.

Use semantic CSS variables.

Prepare the architecture for future dark mode.

---

# 5. TYPOGRAPHY

---

Use:

Inter

or

Manrope

Typography hierarchy:

Page title:
32–40px

Section title:
20–24px

Body:
14–16px

Small:
12–13px

Use font weights intentionally.

Do not make every heading bold.

---

# 6. MAIN ROUTES

---

Create the following routes:

/admin/workout-plans

/admin/workout-plans/new

/admin/workout-plans/:id

/admin/workout-plans/:id/edit

/admin/workout-plans/:id/preview

---

# 7. WORKOUT PLAN LIST PAGE

---

Route:

/admin/workout-plans

Page title:

Workout Plans

Description:

"Create and manage structured calisthenics training programs."

Primary action:

* Create Program

Secondary actions:

Export

Filters

Search

---

# 8. WORKOUT PLAN TABLE

---

Create a professional data table.

Columns:

Program
Goal
Fitness Level
Duration
Days / Week
Assigned Users
Status
Last Updated
Actions

Example:

Beginner Strength Foundation
Strength
Beginner
8 Weeks
3 days/week
842 users
Active
2 hours ago

Pull-Up Progression
Calisthenics Skills
Beginner
8 Weeks
4 days/week
521 users
Active
Yesterday

Advanced Muscle Up
Skill
Advanced
12 Weeks
4 days/week
128 users
Draft
Today

Actions:

View
Edit
Duplicate
Preview
Publish
Archive

Destructive actions require confirmation.

---

# 9. FILTER SYSTEM

---

Create reusable filters.

Filters:

Goal
Fitness Level
Duration
Frequency
Status
Created By
Last Updated

Goal options:

Strength
Muscle Gain
Endurance
Mobility
Weight Management
Calisthenics Skills
General Fitness

Fitness levels:

Beginner
Intermediate
Advanced

Status:

Draft
Published
Archived

Allow multiple filters.

Show active filters as removable chips.

Example:

Status: Draft
Level: Beginner
Duration: 8 Weeks

[Clear All]

---

# 10. CREATE WORKOUT PLAN

---

Route:

/admin/workout-plans/new

This should NOT look like a traditional long form.

Use a structured visual builder.

Top navigation:

← Workout Plans

Create Workout Program

[Save Draft]

[Preview]

[Publish]

Show autosave state:

Saved 2 minutes ago

---

# 11. PROGRAM HEADER

---

Display:

Program Name

Description

Status

Last Saved

Actions

Example:

Beginner Strength Foundation

Build foundational bodyweight strength through progressive training.

Draft

Saved 30 seconds ago

[Save Draft] [Preview] [Publish]

---

# 12. PROGRAM INFORMATION

---

Create a clean form section:

PROGRAM INFORMATION

Fields:

Program Name
Description
Goal
Fitness Level
Duration
Training Frequency
Session Duration
Equipment
Program Type

Example:

Program Name:

Beginner Strength Foundation

Goal:

Strength

Fitness Level:

Beginner

Duration:

8 Weeks

Training Frequency:

3 Days / Week

Equipment:

None

Program Type:

Structured Program

Use React Hook Form + Zod.

Required fields must be clearly marked.

Validation errors should be displayed inline.

---

# 13. PROGRAM GOALS

---

Allow one primary goal.

Primary Goal:

Strength

Optional secondary goals:

Endurance
Mobility
Skill
Muscle Development
Movement Quality

Do not allow the interface to become unnecessarily complicated.

---

# 14. WEEK BUILDER

---

This is one of the most important parts of the system.

Create a horizontal Week Navigation.

Example:

┌──────────────────────────────────────────────────────────┐
│ Week 1 │ Week 2 │ Week 3 │ Week 4 │ Week 5 │ Week 6 │ + │
└──────────────────────────────────────────────────────────┘

The selected week should be visually obvious.

Each week must contain:

Week Number
Week Title
Week Objective
Coach Notes
Progression Target

Example:

WEEK 1

Foundation & Technique

Objective:

Build movement quality and establish baseline volume.

---

# 15. WEEK MANAGEMENT

---

Allow:

Add Week
Duplicate Week
Delete Week
Reorder Week

When deleting a week:

Show confirmation dialog.

Example:

"Delete Week 3?"

"All training days and exercises inside this week will be removed."

Actions:

Cancel
Delete Week

---

# 16. WEEK PROGRESSION

---

Every week should support a progression target.

Examples:

Volume Increase

Intensity Increase

Exercise Progression

Reduced Rest

Technique Focus

Recovery Week

Display:

Progression Type

Target

Coach Note

Example:

Progression:

Volume Increase

Target:

+1 set on main movement

---

# 17. TRAINING DAY BUILDER

---

Inside each Week, display Training Days.

Example:

WEEK 1

┌──────────────────┐
│ MONDAY           │
│ PUSH             │
│ 35 min           │
│ 5 exercises      │
│                  │
│ [Edit]           │
└──────────────────┘

┌──────────────────┐
│ WEDNESDAY        │
│ PULL             │
│ 38 min           │
│ 5 exercises      │
│                  │
│ [Edit]           │
└──────────────────┘

┌──────────────────┐
│ FRIDAY           │
│ LEGS             │
│ 40 min           │
│ 6 exercises      │
│                  │
│ [Edit]           │
└──────────────────┘

Also support:

REST DAY

RECOVERY DAY

MOBILITY DAY

SKILL DAY

---

# 18. TRAINING DAY CONFIGURATION

---

When creating a Training Day, allow:

Day Name
Training Focus
Scheduled Day
Estimated Duration
Difficulty
Primary Muscle Groups
Secondary Muscle Groups
Coach Notes

Example:

Day Name:

Push Strength

Focus:

Upper Body Strength

Estimated Duration:

35 minutes

Difficulty:

Beginner

Primary:

Chest
Triceps
Shoulders

---

# 19. WORKOUT SECTIONS

---

Every Training Day can contain multiple sections.

Supported sections:

Warm-up

Main Workout

Skill

Accessory

Conditioning

Mobility

Cooldown

The Admin/Coach can:

Add Section
Rename Section
Reorder Section
Delete Section

Recommended default structure:

Warm-up
↓
Main Workout
↓
Skill
↓
Cooldown

---

# 20. EXERCISE LIST

---

Each section contains exercises.

Example:

MAIN WORKOUT

┌─────────────────────────────────────────────────────────┐
│ ☷  Push Up                                               │
│    3 × 10                                                │
│    Rest: 90 sec                                          │
│    RPE: 7                                                 │
│                                                         │
│    [Edit] [Duplicate] [Remove]                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ ☷  Pike Push Up                                          │
│    3 × 8                                                 │
│    Rest: 120 sec                                         │
│    RPE: 8                                                │
└─────────────────────────────────────────────────────────┘

Use drag-and-drop.

Use dnd-kit.

---

# 21. ADD EXERCISE

---

Create:

* Add Exercise

When clicked, open a Drawer or Dialog.

Display:

Search Exercise

Filters:

Category
Difficulty
Muscle Group
Equipment
Movement Pattern

Exercise cards:

Image
Exercise Name
Difficulty
Primary Muscle
Equipment

Example:

Push Up

Beginner

Chest / Triceps

No Equipment

Button:

Add Exercise

---

# 22. EXERCISE CONFIGURATION

---

After selecting an exercise, open configuration.

Fields:

Sets

Reps

Rep Type

Rest

Tempo

Intensity

RPE

RIR

Notes

---

# 23. REP PRESCRIPTION TYPES

---

Support:

Fixed Reps

Example:

3 × 10

Rep Range

Example:

3 × 8–12

Time

Example:

3 × 30 sec

Distance

Example:

3 × 20 m

AMRAP

Example:

3 × AMRAP

EMOM

Example:

10 min EMOM

The UI should dynamically change based on prescription type.

---

# 24. INTENSITY

---

Support:

RPE

RIR

Percentage

Bodyweight

Assisted

Weighted

Example:

RPE:

7 / 10

RIR:

2

Do not require intensity fields for every exercise.

Make them optional.

---

# 25. TEMPO

---

Allow optional tempo.

Example:

3-1-1

Display:

Eccentric
Pause
Concentric

Tooltip:

"Tempo describes the duration of each movement phase."

---

# 26. REST CONFIGURATION

---

Support:

Rest Between Sets

Rest Between Exercises

Rest After Section

Example:

Between Sets:

90 seconds

Between Exercises:

120 seconds

---

# 27. EXERCISE NOTES

---

Allow Coach/Admin to add:

Technique Notes

Safety Notes

Coaching Cues

Example:

"Keep the core braced throughout the movement."

"Do not allow the hips to sag."

These notes can later be used by the AI Coaching system.

---

# 28. COACH NOTES

---

At Day level:

COACH NOTES

Example:

"Focus on controlled eccentric movement."

At Week level:

WEEK NOTES

Example:

"Establish baseline volume before progression."

At Program level:

PROGRAM NOTES

Example:

"Users should complete the initial assessment before starting this program."

---

# 29. PROGRESSIVE OVERLOAD VISUALIZATION

---

Create a progression view.

Example:

PUSH UP

Week 1
3 × 8

↓

Week 2
3 × 10

↓

Week 3
4 × 10

↓

Week 4
Diamond Push Up
3 × 8

The UI should visually communicate progression.

Do not make it overly complicated.

---

# 30. EXERCISE PROGRESSION

---

Support:

Regression

Current Exercise

Progression

Example:

Knee Push Up
↓
Push Up
↓
Diamond Push Up
↓
Archer Push Up
↓
One Arm Push Up

The Workout Plan Builder should allow selecting an exercise progression from the Exercise Library.

---

# 31. REST DAY

---

Allow Coach/Admin to create Rest Days.

Display:

REST DAY

Recovery Focus

Optional Mobility

Optional Notes

Example:

Rest Day

Focus:

Shoulder Mobility

Recommended:

10–15 minutes light mobility.

---

# 32. RECOVERY DAY

---

Support:

Recovery Day

Activities:

Mobility
Stretching
Walking
Breathing

This should not behave like a normal workout session.

---

# 33. AI SUGGESTION PANEL

---

Create a dedicated AI recommendation panel.

Design:

┌──────────────────────────────────────────────────────┐
│ ✨ AI TRAINING SUGGESTION                            │
│                                                      │
│ Based on the selected goal and fitness level,        │
│ CalisHealth AI recommends:                           │
│                                                      │
│ • 3 training days per week                           │
│ • 48h recovery between Push sessions                │
│ • Beginner exercise progression                      │
│ • Moderate initial volume                            │
│                                                      │
│ [Apply Suggestions] [Dismiss]                       │
└──────────────────────────────────────────────────────┘

AI recommendations are suggestions only.

Admin/Coach must remain in control.

---

# 34. AI VALIDATION

---

The UI can display warnings such as:

"Training load increased significantly compared with the previous week."

"Two high-intensity Push sessions are scheduled within 24 hours."

"Exercise progression may be too advanced for the selected fitness level."

"Recovery time may be insufficient."

These are informational warnings.

Do not present them as medical diagnoses.

---

# 35. PROGRAM VALIDATION

---

Before publishing, validate:

Program name exists.

Goal exists.

Fitness level exists.

Duration exists.

At least one week exists.

Each week contains at least one training day.

Each active training day contains at least one exercise unless it is a Rest Day.

Each exercise has valid prescription data.

No invalid exercise references.

No duplicate impossible scheduling.

Display a Publish Validation Summary.

Example:

PROGRAM READY

✓ Program information
✓ 8 weeks configured
✓ 24 training days
✓ 86 exercises
✓ Progression configured

[Publish Program]

---

# 36. PUBLISH FLOW

---

When clicking Publish:

Open confirmation dialog.

Title:

Publish Workout Program?

Content:

"This program will become available to eligible users."

Show summary:

Duration:
8 weeks

Training Days:
24

Exercises:
86

Target Level:
Beginner

Actions:

Cancel

Publish

After successful publish:

Show Sonner notification:

"Workout program published successfully."

---

# 37. SAVE DRAFT

---

The user should be able to save incomplete programs.

Status:

Draft

Show:

Saved automatically

Last saved:

10:42 AM

Do not lose unsaved changes.

Show warning when navigating away with unsaved changes.

---

# 38. PREVIEW MODE

---

Route:

/admin/workout-plans/:id/preview

The preview should simulate the User experience.

Header:

Beginner Strength Foundation

8 Week Program

Beginner

Strength

3 days/week

Then:

WEEK 1

Monday

Push Strength

35 min

Exercises:

Push Up
3 × 10

Pike Push Up
3 × 8

Plank
3 × 30 sec

[Start Workout]

The Admin should be able to navigate:

Previous Week
Next Week

Previous Day
Next Day

---

# 39. USER EXPERIENCE PREVIEW

---

Create two preview modes:

PROGRAM OVERVIEW

and

WORKOUT DAY

Program Overview:

Program name
Goal
Level
Duration
Progress
Weeks

Workout Day:

Warm-up
Main Workout
Skill
Cooldown

This allows the Admin/Coach to verify what the User will actually see.

---

# 40. WORKOUT PLAN DETAIL

---

Route:

/admin/workout-plans/:id

Display:

Program Header

Overview

Statistics

Program Structure

Progression

Assigned Users

Performance

Activity

Tabs:

Overview
Program Structure
Progression
Users
Analytics
Activity

---

# 41. PROGRAM ANALYTICS

---

Display:

Assigned Users

Active Users

Completion Rate

Average Completion

Average Session Duration

Drop-off Rate

Average Performance

Example:

Completion Rate

78.4%

+6.2%

Average Session

34 min

Average User Progress

+12.8%

Use Recharts.

---

# 42. PROGRAM USER ASSIGNMENT

---

Allow assigning:

Individual User

Multiple Users

User Group

Fitness Level

Goal

Example:

Assign to:

Beginner users

Goal:

Strength

Subscription:

Premium

Display:

842 users match this criteria.

[Assign Program]

---

# 43. PROGRAM STATUS

---

Statuses:

DRAFT

PUBLISHED

ARCHIVED

Do not allow editing published programs without showing appropriate state.

If editing a published program:

Display:

"This program is currently active for 842 users."

Allow:

Create New Version

instead of silently modifying the active version.

---

# 44. VERSIONING

---

Support future versioning.

Example:

Beginner Strength

Version 1.0

Version 1.1

Version 2.0

Display:

Current Version

Published At

Created By

Changes

---

# 45. WORKOUT PLAN DUPLICATION

---

Allow:

Duplicate Program

Example:

Beginner Strength Foundation

↓

Beginner Strength Foundation — Copy

The duplicated program should become:

Draft

---

# 46. RESPONSIVE DESIGN

---

Desktop is the primary environment.

Desktop:

Sidebar
Topbar
Full Workout Builder
Multi-column layout

Tablet:

Collapsible Sidebar
Two-column layout

Mobile:

Drawer navigation
Single-column builder
Horizontal Week navigation
Stacked Exercise cards

The Workout Builder must remain usable on smaller screens.

Do not simply shrink desktop UI.

---

# 47. DRAG AND DROP

---

Use dnd-kit.

Support drag-and-drop for:

Weeks

Training Days

Sections

Exercises

Example:

☷ Push Up
☷ Diamond Push Up
☷ Pike Push Up

The order should update immediately.

Show subtle drag state.

Do not use excessive animation.

---

# 48. LOADING STATES

---

Create:

WorkoutPlanSkeleton

WeekSkeleton

DaySkeleton

ExerciseSkeleton

TableSkeleton

ChartSkeleton

Do not show blank screens.

---

# 49. EMPTY STATES

---

Example:

"No training days yet."

Description:

"Add your first training day to start building this week."

Button:

* Add Training Day

Exercise empty state:

"No exercises added."

Button:

* Add Exercise

---

# 50. ERROR STATES

---

Example:

"Unable to load this workout program."

Button:

Try Again

Do not expose raw API errors.

---

# 51. CONFIRMATION DIALOGS

---

Use confirmation dialogs for:

Delete Week

Delete Training Day

Remove Exercise

Archive Program

Publish Program

Create New Version

Example:

Remove Push Up?

"This exercise will be removed from Day 1."

[Cancel]

[Remove]

---

# 52. FRONTEND COMPONENT ARCHITECTURE

---

Use feature-based architecture.

src/

features/

workout-plans/

├── api/
│   └── workoutPlansApi.ts
│
├── components/
│   ├── WorkoutPlanHeader.tsx
│   ├── ProgramInformation.tsx
│   ├── WeekTabs.tsx
│   ├── WeekBuilder.tsx
│   ├── TrainingDayCard.tsx
│   ├── TrainingDayBuilder.tsx
│   ├── WorkoutSection.tsx
│   ├── ExerciseCard.tsx
│   ├── ExercisePicker.tsx
│   ├── ExerciseConfiguration.tsx
│   ├── ProgressionView.tsx
│   ├── AIRecommendationPanel.tsx
│   ├── PublishDialog.tsx
│   └── WorkoutPreview.tsx
│
├── hooks/
│   ├── useWorkoutPlans.ts
│   ├── useWorkoutPlan.ts
│   ├── useCreateWorkoutPlan.ts
│   └── useUpdateWorkoutPlan.ts
│
├── schemas/
│   └── workoutPlanSchema.ts
│
├── types/
│   └── workoutPlan.ts
│
├── utils/
│   └── workoutPlanUtils.ts
│
└── pages/
├── WorkoutPlanListPage.tsx
├── WorkoutPlanCreatePage.tsx
├── WorkoutPlanDetailPage.tsx
├── WorkoutPlanEditPage.tsx
└── WorkoutPlanPreviewPage.tsx

---

# 53. TYPESCRIPT DATA MODEL

---

Prepare types similar to:

WorkoutPlan

WorkoutWeek

TrainingDay

WorkoutSection

WorkoutExercise

ExercisePrescription

ProgressionTarget

CoachNote

AIRecommendation

Do not put everything into one giant type.

Keep the data model modular.

---

# 54. API PREPARATION

---

Prepare frontend API services for future Spring Boot backend.

Base:

/api/v1/admin/workout-plans

Endpoints:

GET /workout-plans

GET /workout-plans/:id

POST /workout-plans

PUT /workout-plans/:id

DELETE /workout-plans/:id

POST /workout-plans/:id/publish

POST /workout-plans/:id/archive

POST /workout-plans/:id/duplicate

POST /workout-plans/:id/version

GET /workout-plans/:id/analytics

GET /workout-plans/:id/users

POST /workout-plans/:id/assign

---

# 55. MOCK DATA

---

Until the Spring Boot backend is available, use mock API services.

Do NOT put mock data directly inside React components.

Create:

src/features/workout-plans/mock/

workoutPlans.ts

workoutWeeks.ts

trainingDays.ts

exercises.ts

Use asynchronous mock requests.

The UI must be designed so mock API calls can later be replaced by Axios services.

---

# 56. EXAMPLE PROGRAM DATA

---

Create realistic demo data.

Program:

Beginner Strength Foundation

Goal:

Strength

Level:

Beginner

Duration:

8 weeks

Frequency:

3 days/week

Equipment:

None

Week 1:

Foundation & Technique

Day 1:

Push Strength

Exercises:

Push Up
3 × 8

Pike Push Up
3 × 6

Plank
3 × 30 sec

Day 2:

Pull Strength

Australian Pull Up
3 × 8

Dead Hang
3 × 20 sec

Scapular Pull Up
3 × 8

Day 3:

Lower Body

Bodyweight Squat
3 × 12

Reverse Lunge
3 × 10

Glute Bridge
3 × 12

---

# 57. GLOBAL DESIGN SYSTEM

---

Create reusable:

Button

Input

Select

Combobox

Dialog

Drawer

Tabs

Badge

Card

Table

Tooltip

Dropdown

Command

Progress

Separator

Skeleton

Toast

Alert

Use consistent spacing.

Recommended spacing:

4px
8px
12px
16px
20px
24px
32px
40px

---

# 58. ACCESSIBILITY

---

Support:

Keyboard navigation

Focus states

ARIA labels

Accessible dialogs

Accessible forms

Screen readers

Color contrast

Do not rely on color alone to communicate status.

---

# 59. PERFORMANCE

---

Use:

React lazy loading

Code splitting

TanStack Query caching

Memoization only where useful

Virtualization if exercise lists become large

Avoid unnecessary re-renders in the Workout Builder.

The Builder may contain:

8–16 weeks

40+ training days

100+ exercises

It must remain responsive.

---

# 60. IMPORTANT DATA PRINCIPLE

---

Do NOT treat a Workout Plan as a Workout Session.

These are separate concepts.

Workout Plan:

"What should the user train?"

Workout Session:

"What did the user actually perform?"

Performance:

"How well did the user perform?"

AI Analysis:

"What did the system detect?"

Progress:

"How has the user improved?"

The frontend architecture must preserve this distinction.

---

# 61. CORE BUSINESS FLOW

---

The final architecture should support:

Assessment

↓

Fitness Profile

↓

Goal

↓

Workout Plan

↓

Week

↓

Training Day

↓

Exercise Prescription

↓

Workout Session

↓

Performance

↓

AI Analysis

↓

Progress

↓

Workout Plan Adjustment

The UI should be designed with this future workflow in mind.

---

# 62. IMPORTANT UX PRINCIPLE

---

The Admin/Coach should be able to create a basic workout program quickly.

Target workflow:

Create Program

↓

Enter basic information

↓

Add Weeks

↓

Add Training Days

↓

Add Exercises

↓

Configure Sets/Reps

↓

Set Progression

↓

Preview

↓

Validate

↓

Publish

The basic workflow should feel fast and intuitive.

Do not force the user to configure advanced options before creating the basic program.

Advanced settings should be progressive disclosure.

---

# 63. FINAL PAGE STRUCTURE

---

The final Workout Plan Builder should visually resemble:

┌───────────────────────────────────────────────────────────────┐
│ ← Workout Plans                 Save Draft   Preview Publish │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│ Beginner Strength Foundation                                │
│ 8 Weeks · Beginner · Strength · 3 days/week                 │
│                                                               │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ PROGRAM INFORMATION                                       │ │
│ │                                                           │ │
│ │ Name       Goal       Level       Duration    Frequency  │ │
│ └───────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ WEEK 1 │ WEEK 2 │ WEEK 3 │ WEEK 4 │ WEEK 5 │ +          │ │
│ └───────────────────────────────────────────────────────────┘ │
│                                                               │
│ WEEK 1                                                       │
│ Foundation & Technique                                      │
│                                                               │
│ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐   │
│ │ MON            │ │ WED            │ │ FRI            │   │
│ │ PUSH           │ │ PULL           │ │ LEGS           │   │
│ │                │ │                │ │                │   │
│ │ Push Up        │ │ Australian     │ │ Squat          │   │
│ │ 3 × 8          │ │ Pull Up        │ │ 3 × 12         │   │
│ │                │ │ 3 × 8          │ │                │   │
│ │ Pike Push Up   │ │ Dead Hang      │ │ Reverse Lunge  │   │
│ │ 3 × 6          │ │ 3 × 20 sec     │ │ 3 × 10         │   │
│ │                │ │                │ │                │   │
│ │ [+ Exercise]   │ │ [+ Exercise]   │ │ [+ Exercise]   │   │
│ └────────────────┘ └────────────────┘ └────────────────┘   │
│                                                               │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ ✨ AI TRAINING SUGGESTION                                 │ │
│ │                                                           │ │
│ │ 48h recovery recommended between Push sessions.           │ │
│ │ Current volume is appropriate for Beginner level.         │ │
│ │                                                           │ │
│ │              [Dismiss] [Apply Suggestions]               │ │
│ └───────────────────────────────────────────────────────────┘ │
│                                                               │
└───────────────────────────────────────────────────────────────┘

---

# 64. IMPLEMENTATION ORDER

---

Implement in this exact order.

PHASE 1:

Design system

PHASE 2:

Admin layout

PHASE 3:

Workout Plan List

PHASE 4:

Workout Plan Create

PHASE 5:

Program Information

PHASE 6:

Week Builder

PHASE 7:

Training Day Builder

PHASE 8:

Exercise Picker

PHASE 9:

Exercise Configuration

PHASE 10:

Drag & Drop

PHASE 11:

Progression

PHASE 12:

AI Suggestions

PHASE 13:

Validation

PHASE 14:

Preview

PHASE 15:

Analytics

PHASE 16:

Mock API

PHASE 17:

Responsive optimization

PHASE 18:

Accessibility and performance optimization

---

# 65. FINAL REQUIREMENT

---

Build this module as a real production-quality product, not as a UI mockup.

The result should allow an Admin or Coach to visually construct a complete multi-week calisthenics training program.

The system must be:

* Modular
* Scalable
* Responsive
* Accessible
* Maintainable
* Type-safe
* API-ready
* AI-ready

The final architecture must be compatible with:

React
+
TypeScript
+
Tailwind
+
shadcn/ui
+
TanStack Query
+
Axios
+
Spring Boot
+
MySQL

Most importantly:

The Workout Plan Builder must make the relationship between:

Program
→ Week
→ Training Day
→ Section
→ Exercise
→ Prescription
→ Progression

visually obvious and easy to manage.

Start implementation with:

1. Design System
2. Workout Plan List
3. Workout Plan Builder
4. Week Builder
5. Training Day Builder
6. Exercise Picker
7. Exercise Configuration
8. Preview
9. Publish workflow

Do not implement unrelated Admin modules until the Workout Plan Builder is complete and visually consistent.
