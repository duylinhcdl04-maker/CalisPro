You are a Senior Product Designer, Senior UX/UI Designer,
Senior React Frontend Engineer, and Health-Tech System Architect.

You are designing and implementing the FRONTEND of the
"Fitness Assessment Management" module for CALISHEALTH.

============================================================
PROJECT CONTEXT
============================================================

CALISHEALTH is an AI-powered Calisthenics and fitness platform.

The system helps users:

- Assess their initial physical fitness
- Determine their fitness level
- Track physical development
- Follow personalized calisthenics training plans
- Periodically reassess their fitness
- Receive AI-adjusted training recommendations
- Understand strengths and weaknesses across different fitness dimensions

The Admin dashboard is used by:

- Admin
- Coach

The existing Admin interface already uses a clean,
premium Health-Tech visual style.

The uploaded reference screenshot represents the current
CALISHEALTH Admin Dashboard visual language.

USE THE EXISTING SCREENSHOT AS THE PRIMARY VISUAL REFERENCE.

Do NOT redesign the entire Admin Dashboard.

Keep the existing:

- Sidebar
- Header
- Navigation hierarchy
- Brand identity
- Typography style
- Green visual identity
- Card system
- Spacing philosophy
- Rounded corner style
- Overall Health-Tech SaaS aesthetic

Only design and implement the
"Fitness Assessment / Bài test Đánh giá" module.

============================================================
PRIMARY OBJECTIVE
============================================================

Build a professional Assessment Management System.

This is NOT a simple quiz builder.

The module must allow Admin/Coach to:

1. Create assessments
2. Create and manage questions
3. Reuse questions from a Question Bank
4. Configure question types
5. Configure scoring rules
6. Configure fitness-level classification
7. Configure dynamic reassessment schedules
8. Configure reminders
9. Configure workout-based triggers
10. Preview the assessment
11. Review the complete assessment before publishing
12. Save drafts
13. Publish assessments
14. Archive assessments
15. Monitor assessment usage and results

The UI must communicate:

"Scientific Fitness Assessment Management"

rather than:

"Simple Quiz Management"

============================================================
TECHNOLOGY
============================================================

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
Recharts

Use TypeScript strictly.

DO NOT use:

any

unless absolutely unavoidable.

Create reusable components.

Separate:

UI
Domain models
Form state
Validation
Mock API
API layer

============================================================
DESIGN LANGUAGE
============================================================

The design must match the existing CALISHEALTH Admin interface.

Visual direction:

Premium
Professional
Scientific
Health-Tech
Minimal
Clean
Trustworthy
Data-driven
Modern
Athletic

Avoid:

Gaming aesthetics
Neon colors
Heavy gradients
Excessive glassmorphism
Huge shadows
Overly colorful dashboards
Generic Bootstrap appearance
Generic SaaS templates
Excessive rounded cards

The interface should look like a premium
health-tech / sports science administration platform.

============================================================
COLOR SYSTEM
============================================================

Use CSS variables.

Primary Brand:

#7C9B5B

Dark Green:

#4F6F3F

Light Green:

#EDF3E7

Background:

#F7F8F5

Surface:

#FFFFFF

Border:

#E3E6DF

Primary Text:

#182018

Secondary Text:

#687068

Muted Text:

#969C95

Success:

#4F8A65

Warning:

#C48A3A

Danger:

#C45F5F

Info:

#557D9A

Do NOT hard-code colors throughout components.

Use centralized design tokens.

============================================================
TYPOGRAPHY
============================================================

Use:

Inter

or:

Manrope

Page Title:

30–34px
font-weight 700

Section Title:

20–24px
font-weight 700

Card Title:

16–18px
font-weight 600

Body:

14–16px

Helper:

12–13px

Numbers:

Use semibold/bold.

Maintain strong visual hierarchy.

============================================================
GLOBAL LAYOUT
============================================================

Keep the existing CALISHEALTH Admin shell:

┌────────────────────────────────────────────────────────────┐
│ HEADER                                                     │
├───────────────┬────────────────────────────────────────────┤
│               │                                            │
│   SIDEBAR     │              MAIN CONTENT                  │
│               │                                            │
│               │                                            │
└───────────────┴────────────────────────────────────────────┘

The sidebar remains consistent with the screenshot.

The active navigation remains:

Đánh giá & Thể chất
    └── Bài test Đánh giá

============================================================
MODULE STRUCTURE
============================================================

Create the following pages:

/admin/assessments

Assessment Library

/admin/assessments/new

Create Assessment

/admin/assessments/:id/edit

Edit Assessment

/admin/assessments/questions

Question Bank

/admin/assessments/:id/preview

Assessment Preview

/admin/assessments/:id/results

Assessment Results

============================================================
1. ASSESSMENT LIBRARY
============================================================

The main Assessment page should NOT immediately show
a giant form.

First create a professional management dashboard.

Page title:

"Quản trị Bài test Đánh giá Thể lực"

Subtitle:

"Cấu hình ngân hàng câu hỏi, thang đo điểm số,
phân loại thể lực và chu kỳ đánh giá lại."

Badge:

Dynamic Assessment

Top-right:

[+ Tạo bài đánh giá]

[Question Bank]

============================================================
STATISTICS
============================================================

Create 4 KPI cards.

Card 1:

TỔNG BÀI ĐÁNH GIÁ

24

12 Published
8 Draft
4 Archived

Card 2:

LƯỢT THỰC HIỆN

12,482

+12.4% this month

Card 3:

ĐIỂM TRUNG BÌNH

68 / 100

Beginner: 42%
Intermediate: 41%
Advanced: 17%

Card 4:

ĐANG ĐẾN HẠN

1,284

Reassessment due

The cards should visually match the existing dashboard.

============================================================
ASSESSMENT LIST
============================================================

Create a modern table.

Columns:

Assessment

Type

Questions

Average Score

Completion Rate

Schedule

Status

Updated

Actions

Example:

------------------------------------------------------------

Initial Fitness Assessment

Initial Assessment

12 questions

68 / 100

75.6%

Once

Published

2 days ago

⋮

------------------------------------------------------------

Periodic Fitness Reassessment

Periodic

15 questions

71 / 100

82.3%

Every 4 weeks

Published

Today

⋮

------------------------------------------------------------

Strength Assessment

Strength

8 questions

74 / 100

68.2%

Every 6 weeks

Draft

Yesterday

⋮

============================================================
FILTERS
============================================================

Above table:

Search:

"Tìm kiếm bài đánh giá..."

Filters:

Type
Status
Fitness Level
Schedule
Updated

Sort:

Newest
Oldest
Most Used
Highest Completion
Lowest Completion

============================================================
TABLE ACTIONS
============================================================

Each row:

View

Edit

Duplicate

Preview

Archive

Delete

Publish

Do not permanently delete by default.

Use confirmation dialog.

============================================================
2. CREATE ASSESSMENT
============================================================

When Admin clicks:

"+ Tạo bài đánh giá"

open:

/admin/assessments/new

Do NOT use a small modal.

Use a full-page Assessment Builder.

============================================================
ASSESSMENT BUILDER HEADER
============================================================

Top:

← Quay lại Bài test

Title:

"Tạo bài đánh giá"

Subtitle:

"Thiết lập bộ câu hỏi, cách chấm điểm và
chu kỳ đánh giá thể lực."

Right:

Autosave indicator

"Đã lưu 10 giây trước"

Buttons:

[Lưu nháp]

[Xem trước]

[Publish]

============================================================
STEPPER
============================================================

Create horizontal stepper:

01
Thông tin

02
Câu hỏi

03
Chấm điểm

04
Phân loại

05
Chu kỳ

06
Review

Example:

✓ Thông tin
✓ Câu hỏi
● Chấm điểm
○ Phân loại
○ Chu kỳ
○ Review

Current step must be visually emphasized.

Completed steps are clickable.

Incomplete steps are disabled where appropriate.

============================================================
FORM ARCHITECTURE
============================================================

Use:

React Hook Form

FormProvider

Zod

There must be ONE central form state.

Structure:

AssessmentBuilder
    |
    ├── AssessmentInformation
    ├── QuestionBuilder
    ├── ScoringBuilder
    ├── FitnessLevelBuilder
    ├── ScheduleBuilder
    └── ReviewBuilder

Do not create disconnected form states.

============================================================
STEP 01 — BASIC INFORMATION
============================================================

Title:

"Thông tin bài đánh giá"

Description:

"Thiết lập thông tin cơ bản và mục đích của bài đánh giá."

------------------------------------------------------------
GENERAL INFORMATION
------------------------------------------------------------

Fields:

Tên bài đánh giá *

Tên hiển thị

Mô tả

Thời lượng dự kiến

Tags

Example:

Tên:

Initial Fitness Assessment

Tên hiển thị:

Đánh giá thể lực ban đầu

Description:

"Đánh giá sức mạnh, sức bền, khả năng vận động
và mức độ kiểm soát cơ thể của người dùng."

Estimated duration:

5–10 minutes

============================================================
ASSESSMENT TYPE
============================================================

Use cards rather than a simple select.

Options:

INITIAL ASSESSMENT

"Đánh giá thể lực lần đầu"

PERIODIC REASSESSMENT

"Đánh giá lại định kỳ"

STRENGTH ASSESSMENT

"Đánh giá sức mạnh"

ENDURANCE ASSESSMENT

"Đánh giá sức bền"

MOBILITY ASSESSMENT

"Đánh giá khả năng vận động"

SKILL ASSESSMENT

"Đánh giá kỹ năng Calisthenics"

CUSTOM

"Tùy chỉnh"

Each card:

Icon
Title
Description
Selection state

============================================================
TARGET USERS
============================================================

Create:

Fitness Level

☑ Beginner
☑ Intermediate
☑ Advanced

Training Goal:

☑ General Fitness
☑ Strength
☑ Muscle Building
☑ Skill
☑ Mobility

Optional:

Age range

Gender should NOT be used as a default fitness classification
unless there is a scientifically justified requirement.

============================================================
STEP 02 — QUESTION BUILDER
============================================================

This is the most important area.

Title:

"Ngân hàng câu hỏi"

Subtitle:

"Xây dựng bài đánh giá từ các câu hỏi có sẵn
hoặc tạo câu hỏi mới."

Layout:

LEFT:

Question list

RIGHT:

Question editor

============================================================
QUESTION LIST
============================================================

Example:

┌─────────────────────────────┐
│ ☷ 01                       │
│ Maximum Push Up            │
│ Performance Test           │
│ Upper Body Strength        │
└─────────────────────────────┘

┌─────────────────────────────┐
│ ☷ 02                       │
│ Plank Duration             │
│ Performance Test           │
│ Core Stability             │
└─────────────────────────────┘

Use dnd-kit.

Allow:

Drag

Drop

Reorder

Duplicate

Delete

============================================================
ADD QUESTION
============================================================

Button:

[+ Thêm câu hỏi]

Opening:

Question Type selector.

Types:

Single Choice

Multiple Choice

Yes / No

Numeric Input

Rating Scale

Performance Test

Measurement

Self Assessment

============================================================
PERFORMANCE TEST
============================================================

This is extremely important for CALISHEALTH.

Create a specialized Performance Test question.

Fields:

Exercise

Measurement

Unit

Minimum

Maximum

Instruction

Example:

Exercise:

Push Up

Measurement:

Maximum Repetitions

Unit:

Repetitions

Instruction:

"Perform as many technically correct repetitions
as possible."

============================================================
QUESTION EDITOR
============================================================

Create a professional editor:

QUESTION

Question text *

Description

Instruction

Question Type

Category

Required

Weight

============================================================
QUESTION CATEGORY
============================================================

Categories:

Upper Body Strength

Lower Body Strength

Core Strength

Muscular Endurance

Cardiorespiratory Endurance

Shoulder Mobility

Hip Mobility

Ankle Mobility

Balance

Body Control

Calisthenics Skill

Recovery

Training Consistency

Perceived Effort

============================================================
QUESTION WEIGHT
============================================================

Allow:

Weight %

Example:

20%

Show:

Total weight:

100%

If not 100%:

Show warning.

============================================================
QUESTION OPTIONS
============================================================

For Single Choice / Multiple Choice:

Create dynamic option builder.

Example:

○ 0–5 reps

○ 6–10 reps

○ 11–20 reps

○ 21–30 reps

○ 30+ reps

Each option can have:

Label

Value

Score

Correct / relevant indicator

Use drag-and-drop ordering.

============================================================
STEP 03 — SCORING
============================================================

Title:

"Thang điểm"

Subtitle:

"Xác định cách chuyển kết quả của từng câu hỏi
thành điểm số."

============================================================
SCORING OVERVIEW
============================================================

Show:

Total Score

100

Questions

12

Weighted

100%

Valid

✓

============================================================
SCORING RULE BUILDER
============================================================

For numeric questions:

Create table:

Result
Score

0–5
20

6–10
40

11–15
60

16–25
80

26+
100

Button:

[+ Thêm điều kiện]

Allow:

Greater than

Less than

Between

Equal

============================================================
SCORING PREVIEW
============================================================

Show interactive example:

User Result:

[18]

Unit:

reps

Calculated Score:

80 / 100

Use a visual score indicator.

============================================================
STEP 04 — FITNESS LEVEL
============================================================

Title:

"Phân loại thể lực"

Subtitle:

"Thiết lập cách hệ thống phân loại mức thể lực
sau khi hoàn thành bài đánh giá."

============================================================
FITNESS LEVEL BUILDER
============================================================

Create editable levels.

Default:

Beginner
0–39

Intermediate
40–69

Advanced
70–84

Elite
85–100

Do NOT hard-code these levels.

Admin can edit them.

============================================================
LEVEL CARD
============================================================

Example:

┌─────────────────────────────────────────────┐
│ BEGINNER                                    │
│                                             │
│ Score Range                                 │
│ [0] ─────────────── [39]                    │
│                                             │
│ Description                                 │
│ "Suitable for users beginning..."           │
│                                             │
│ Recommendation                              │
│ "Focus on movement quality..."               │
│                                             │
│ Color / Badge                               │
│ [Green ▼]                                   │
└─────────────────────────────────────────────┘

============================================================
FITNESS DIMENSIONS
============================================================

Do NOT only calculate one overall score.

Allow dimensions:

Strength

Endurance

Mobility

Core Stability

Skill

Body Control

Each question contributes to one dimension.

Show:

Strength
72

Endurance
81

Mobility
54

Core Stability
63

Skill
42

Overall:

68

Intermediate

============================================================
RADAR CHART
============================================================

Use Recharts.

Create a radar chart:

Strength
Endurance
Mobility
Core
Skill

The chart should be available in:

Admin Preview

Assessment Results

User Fitness Profile

Keep chart clean and professional.

============================================================
STEP 05 — SCHEDULE
============================================================

Title:

"Chu kỳ đánh giá"

Subtitle:

"Cấu hình thời điểm người dùng cần thực hiện
bài đánh giá lại."

This section must be one of the most polished parts
of the interface.

============================================================
AUTOMATIC REASSESSMENT
============================================================

Create large toggle:

Tự động đánh giá lại

[ ON ]

Helper:

"Hệ thống sẽ tự động xác định khi nào người dùng
cần thực hiện lại bài đánh giá."

============================================================
TRIGGER TYPE
============================================================

Use selectable cards:

TIME BASED

"Đánh giá sau một khoảng thời gian"

WORKOUT BASED

"Đánh giá sau số buổi tập"

DYNAMIC

"Tự động dựa trên cấp độ thể lực"

MANUAL

"Chỉ đánh giá khi Coach/Admin yêu cầu"

Allow multiple trigger types.

============================================================
TIME BASED
============================================================

Example:

Every

[4]

[Weeks ▼]

Options:

Days

Weeks

Months

Custom

============================================================
DYNAMIC FITNESS LEVEL RULE
============================================================

Create rule table:

Fitness Level
Frequency

Beginner
Every 4 weeks

Intermediate
Every 6 weeks

Advanced
Every 8 weeks

Elite
Every 12 weeks

Buttons:

[+ Add Rule]

Each row editable.

============================================================
WORKOUT BASED
============================================================

Toggle:

Enable workout trigger

Then:

"Reassess after"

[20]

completed workouts

Unit:

Completed Workouts

============================================================
TRIGGER LOGIC
============================================================

Provide:

OR

AND

selection.

Example:

Trigger assessment when:

Time condition

OR

Workout condition

Recommended default:

OR

Display a small explanation.

============================================================
GRACE PERIOD
============================================================

Field:

Grace Period

[7] days

Helper:

"Users can complete the assessment within this period
without being marked as overdue."

============================================================
REMINDERS
============================================================

Create:

REMINDER SETTINGS

☑ 7 days before

☑ 3 days before

☑ On due date

☑ 3 days after

Channels:

☑ In-App

☑ Email

☐ Push Notification

Show preview:

"Your fitness reassessment is ready."

============================================================
SCHEDULE TIMELINE
============================================================

This should be visually impressive.

Show:

Initial Assessment
        ↓
Completed
28 Sep
        ↓
Training
        ↓
Reminder
21 Oct
        ↓
Reminder
25 Oct
        ↓
Assessment Due
28 Oct
        ↓
Grace Period
Until 4 Nov

Create a horizontal or vertical timeline.

============================================================
STEP 06 — REVIEW
============================================================

Create a professional review page.

Header:

"Review & Publish"

Subtitle:

"Kiểm tra toàn bộ cấu hình trước khi đưa bài đánh giá
vào hệ thống."

============================================================
REVIEW SECTIONS
============================================================

Card:

BASIC INFORMATION

✓ Complete

Questions:

12 questions

✓ Complete

Scoring:

100%

✓ Complete

Fitness Levels:

4 levels

✓ Complete

Schedule:

Every 4 weeks

✓ Complete

Reminders:

4 enabled

✓ Complete

============================================================
VALIDATION SUMMARY
============================================================

Create:

READY TO PUBLISH

✓ 12 questions configured

✓ Scoring totals 100%

✓ Fitness levels valid

✓ Schedule configured

✓ Reminder configured

Show:

[Publish Assessment]

============================================================
PREVIEW MODE
============================================================

Create a User Preview.

The Admin can click:

[Xem trước]

and see exactly what the USER will see.

Do NOT show admin controls.

============================================================
USER ASSESSMENT PREVIEW
============================================================

Example:

┌──────────────────────────────────────────────┐
│ Fitness Assessment                           │
│                                              │
│ Đánh giá thể lực của bạn                    │
│                                              │
│ 12 câu hỏi                                  │
│ ~7 phút                                     │
│                                              │
│ Progress                                    │
│ ███████░░░ 70%                              │
│                                              │
│ Bạn có thể thực hiện bao nhiêu Push Up?     │
│                                              │
│ [ 18 ] repetitions                           │
│                                              │
│                         [Tiếp tục →]         │
└──────────────────────────────────────────────┘

The preview must look like a real user application.

============================================================
RESULT PREVIEW
============================================================

After simulated completion:

Overall:

68 / 100

Intermediate

Radar:

Strength 72
Endurance 81
Mobility 54
Core 63
Skill 42

Create insight cards:

Strength

"Your upper-body strength is developing well."

Mobility

"Mobility may be an area to improve."

Skill

"Focus on body control and movement technique."

Do not present medical diagnoses.

============================================================
ASSESSMENT SCHEDULER UX
============================================================

The Admin must understand:

When does the user get the assessment?

Use natural language summaries.

Example:

"New users will receive this assessment
after their first login."

"Beginner users will be reassessed every 4 weeks."

"Users who complete 20 workouts will also become eligible."

"Users will receive reminders 7 and 3 days before
the due date."

This summary should update dynamically
as the Admin changes settings.

============================================================
LIVE CONFIGURATION SUMMARY
============================================================

Create a sticky right-side card on the Schedule step:

ASSESSMENT AUTOMATION

Status:

● Active

Initial:

First login

Reassessment:

Every 4 weeks

Workout Trigger:

20 workouts

Grace Period:

7 days

Reminders:

7d
3d
Due
+3d

Next Assessment:

Automatically calculated

The summary must update in real time.

============================================================
AUTOSAVE
============================================================

Implement:

Draft autosave.

States:

Saving...

Saved just now

Unsaved changes

Save failed

Do not send API requests on every keystroke.

Use debounce.

Prepare architecture for:

PATCH /api/v1/admin/assessments/:id/draft

============================================================
PUBLISH FLOW
============================================================

When Admin clicks Publish:

Open confirmation dialog.

Title:

"Publish Assessment?"

Description:

"This assessment will become available to eligible users
according to its configured schedule."

Show:

Questions: 12

Duration: 7 minutes

Schedule: Every 4 weeks

Status:

Ready

Actions:

Cancel

Publish

============================================================
ARCHIVE FLOW
============================================================

Archive confirmation:

"Archive this assessment?"

Explain:

"Existing completed results will remain available,
but the assessment will no longer be assigned to new users."

============================================================
QUESTION BANK
============================================================

Create separate Question Bank page.

Header:

"Ngân hàng câu hỏi"

Stats:

Total Questions

Active

Used in Assessments

Draft

Filters:

Category

Question Type

Difficulty

Status

Search

============================================================
QUESTION BANK TABLE
============================================================

Columns:

Question

Type

Category

Used In

Score Weight

Status

Updated

Actions

Example:

Maximum Push Up

Performance Test

Upper Body Strength

3 assessments

20%

Active

============================================================
QUESTION REUSE
============================================================

Inside Assessment Builder:

[Add from Question Bank]

Opening modal/drawer:

Search questions.

Select multiple.

[Add to Assessment]

This prevents duplicate question creation.

============================================================
QUESTION VERSIONING
============================================================

If a question is already used by a published assessment,
editing it should NOT silently change historical assessments.

Show:

"This question is currently used in 4 published assessments."

Options:

Create new version

Edit draft only

Cancel

This is important for data integrity.

============================================================
RESULTS DASHBOARD
============================================================

Create:

/admin/assessments/:id/results

Header:

Assessment Results

KPIs:

Attempts

Completion Rate

Average Score

Average Duration

Distribution

Beginner

Intermediate

Advanced

============================================================
RESULT CHARTS
============================================================

Use Recharts.

Create:

Score Distribution

Fitness Level Distribution

Dimension Performance

Completion Over Time

============================================================
COMPARISON
============================================================

Allow comparing:

Initial Assessment

vs

Latest Assessment

Example:

Strength

54 → 72
+18

Endurance

61 → 81
+20

Mobility

58 → 64
+6

Skill

42 → 55
+13

Use positive/negative indicators.

============================================================
USER ASSESSMENT TIMELINE
============================================================

For each user:

Initial Assessment
28 Sep

Score:

58

Intermediate

↓

Reassessment

26 Oct

Score:

68

Intermediate

↓

Next:

23 Nov

Due

This is useful for Coaches.

============================================================
IMPORTANT UX RULES
============================================================

The system should never overwhelm Admins.

Use:

Progressive Disclosure.

Basic configuration first.

Advanced configuration second.

For example:

Basic:

Questions
Scoring
Schedule

Advanced:

Dynamic rules
Workout triggers
Custom scoring
Reminder channels

============================================================
FORM VALIDATION
============================================================

Use Zod.

Required:

Assessment name

Assessment type

At least one question

Question text

Valid question type

Total scoring weight = 100%

At least one fitness level

Valid score ranges

Schedule if automatic reassessment enabled

============================================================
ERROR STATES
============================================================

Never show technical errors.

Bad:

500 Internal Server Error

Good:

"Không thể lưu bài đánh giá.
Vui lòng thử lại."

Use Sonner for small notifications.

Use dialogs for destructive actions.

============================================================
EMPTY STATES
============================================================

If there are no assessments:

Show:

Icon

"Chưa có bài đánh giá"

Description:

"Tạo bài đánh giá đầu tiên để bắt đầu
đánh giá thể lực người dùng."

Button:

[Tạo bài đánh giá]

============================================================
LOADING STATES
============================================================

Use skeleton loaders.

Do not block the entire dashboard
for small requests.

============================================================
RESPONSIVE DESIGN
============================================================

Desktop:

Sidebar

Main content

Builder:

70% form

30% live summary

Tablet:

Main content

Summary becomes collapsible

Mobile:

Single column

Stepper becomes vertical/horizontal scroll

Tables become cards

Do NOT simply shrink desktop UI.

============================================================
ACCESSIBILITY
============================================================

Support:

Keyboard navigation

ARIA labels

Visible focus

Screen readers

Accessible dialogs

Accessible dropdowns

Accessible sliders

Accessible drag/drop alternatives

Color must NOT be the only indication of status.

============================================================
COMPONENT ARCHITECTURE
============================================================

Use:

src/features/assessments/

├── api/
│   └── assessmentsApi.ts
│
├── components/
│   ├── AssessmentLibrary.tsx
│   ├── AssessmentStats.tsx
│   ├── AssessmentTable.tsx
│   ├── AssessmentBuilder.tsx
│   ├── AssessmentStepper.tsx
│   │
│   ├── steps/
│   │   ├── AssessmentInformationStep.tsx
│   │   ├── QuestionBuilderStep.tsx
│   │   ├── ScoringStep.tsx
│   │   ├── FitnessLevelStep.tsx
│   │   ├── ScheduleStep.tsx
│   │   └── ReviewStep.tsx
│   │
│   ├── questions/
│   │   ├── QuestionList.tsx
│   │   ├── QuestionEditor.tsx
│   │   ├── QuestionTypeSelector.tsx
│   │   ├── QuestionOptionBuilder.tsx
│   │   ├── PerformanceTestEditor.tsx
│   │   └── QuestionBankSelector.tsx
│   │
│   ├── scoring/
│   │   ├── ScoringRuleBuilder.tsx
│   │   ├── ScorePreview.tsx
│   │   └── ScoreDistribution.tsx
│   │
│   ├── fitness/
│   │   ├── FitnessLevelBuilder.tsx
│   │   ├── FitnessDimensionBuilder.tsx
│   │   └── FitnessRadar.tsx
│   │
│   ├── schedule/
│   │   ├── ScheduleBuilder.tsx
│   │   ├── TriggerSelector.tsx
│   │   ├── DynamicScheduleRules.tsx
│   │   ├── WorkoutTrigger.tsx
│   │   ├── ReminderSettings.tsx
│   │   └── ScheduleTimeline.tsx
│   │
│   ├── preview/
│   │   ├── AssessmentPreview.tsx
│   │   ├── AssessmentResultPreview.tsx
│   │   └── LiveConfigurationSummary.tsx
│   │
│   └── results/
│       ├── AssessmentResults.tsx
│       ├── ResultCharts.tsx
│       └── UserAssessmentTimeline.tsx
│
├── hooks/
│   ├── useAssessmentForm.ts
│   ├── useAssessmentAutosave.ts
│   └── useAssessmentValidation.ts
│
├── schemas/
│   └── assessmentSchema.ts
│
├── types/
│   ├── assessment.ts
│   ├── question.ts
│   ├── scoring.ts
│   ├── fitness.ts
│   └── schedule.ts
│
├── constants/
│   ├── assessmentTypes.ts
│   ├── questionTypes.ts
│   ├── fitnessDimensions.ts
│   └── scheduleTriggers.ts
│
├── mock/
│   └── assessmentMock.ts
│
└── pages/
    ├── AssessmentLibraryPage.tsx
    ├── CreateAssessmentPage.tsx
    ├── EditAssessmentPage.tsx
    ├── AssessmentPreviewPage.tsx
    └── AssessmentResultsPage.tsx

============================================================
DATA MODEL
============================================================

Assessment:

{
  id: string,
  name: string,
  displayName: string,
  description: string,
  type: AssessmentType,
  estimatedDuration: number,
  status: AssessmentStatus,
  questions: AssessmentQuestion[],
  scoring: ScoringConfig,
  fitnessLevels: FitnessLevel[],
  schedule: AssessmentSchedule
}

AssessmentQuestion:

{
  questionId: string,
  order: number,
  weight: number,
  required: boolean
}

Question:

{
  id: string,
  text: string,
  type: QuestionType,
  category: FitnessDimension,
  instruction?: string,
  unit?: string,
  options?: QuestionOption[]
}

FitnessLevel:

{
  id: string,
  name: string,
  minScore: number,
  maxScore: number,
  description: string
}

Schedule:

{
  enabled: boolean,
  triggers: ScheduleTrigger[],
  gracePeriodDays: number,
  reminders: ReminderRule[]
}

============================================================
MOCK DATA
============================================================

Create a realistic assessment:

Initial Fitness Assessment

12 questions.

Example questions:

1.
Maximum Push Up

Performance Test

Upper Body Strength

2.
Plank Duration

Performance Test

Core Stability

3.
Bodyweight Squat

Performance Test

Lower Body Strength

4.
Shoulder Mobility

Measurement

Mobility

5.
Training Experience

Single Choice

6.
Perceived Effort

Rating Scale

7.
Balance Test

Performance Test

8.
Pull Up Capability

Performance Test

9.
Recovery Quality

Rating Scale

10.
Training Frequency

Single Choice

11.
Hip Mobility

Measurement

12.
Calisthenics Experience

Single Choice

Use realistic scoring.

============================================================
ASSESSMENT AUTOMATION LOGIC
============================================================

The frontend must visually demonstrate:

NEW USER

Register
↓
First Login
↓
Initial Assessment Available
↓
Complete Assessment
↓
Fitness Profile Created
↓
Training Plan Generated
↓
Next Assessment Scheduled

Periodic:

Assessment Completed
↓
Schedule Engine
↓
Calculate Next Due Date
↓
Reminder
↓
Assessment Due
↓
Reassessment
↓
Compare Results
↓
Update Fitness Profile
↓
Adjust Training Plan

============================================================
IMPORTANT BUSINESS RULE
============================================================

Initial Assessment should NOT appear repeatedly.

If:

hasCompletedInitialAssessment = true

then:

do NOT show Initial Assessment as required.

Instead:

show Periodic Reassessment when it becomes due.

============================================================
SCHEDULING UI EXAMPLE
============================================================

The Admin should be able to create:

Initial Assessment:

Trigger:

First login

Then:

Beginner:
Every 4 weeks

Intermediate:
Every 6 weeks

Advanced:
Every 8 weeks

Workout trigger:

20 completed workouts

Grace period:

7 days

Reminders:

7 days before
3 days before
Due date
3 days after

============================================================
LIVE SUMMARY
============================================================

Always show a human-readable summary.

Example:

"New users will complete this assessment
after their first login.

Beginner users will be reassessed every 4 weeks.

Users who complete 20 workouts will also become eligible.

Reminders will be sent 7 and 3 days before the due date.

A 7-day grace period will be provided."

This text must update automatically.

============================================================
DESIGN QUALITY
============================================================

The final UI must look like a real production Health-Tech product.

Do NOT create:

placeholder boxes

generic cards

random gradients

random icons

unnecessary charts

unnecessary animations

The UI must have:

Strong hierarchy

Consistent spacing

Clear grouping

Professional form controls

Excellent empty states

Excellent loading states

Excellent error states

Clear validation

Logical information architecture

High usability

============================================================
FINAL EXPERIENCE
============================================================

Admin should feel:

"I can scientifically configure how CalisHealth evaluates
a user's physical fitness."

Coach should feel:

"I can understand why the system classified this user
as Beginner / Intermediate / Advanced."

User should eventually feel:

"CalisHealth understands my current fitness level,
my strengths, my weaknesses, and how I am progressing."

============================================================
IMPLEMENTATION ORDER
============================================================

Implement in this order:

PHASE 1
Existing Admin shell integration

PHASE 2
Assessment Library

PHASE 3
Assessment Builder layout

PHASE 4
Basic Information

PHASE 5
Question Builder

PHASE 6
Question Bank

PHASE 7
Scoring Builder

PHASE 8
Fitness Level Builder

PHASE 9
Schedule Builder

PHASE 10
Reminder system UI

PHASE 11
Live Schedule Summary

PHASE 12
Review & Publish

PHASE 13
User Preview

PHASE 14
Results Dashboard

PHASE 15
Responsive design

PHASE 16
Accessibility

PHASE 17
UX polish

============================================================
FINAL REQUIREMENT
============================================================

Build a complete, polished, production-quality frontend.

The result must NOT look like a prototype.

It must feel like a real enterprise Health-Tech
Fitness Assessment Management System.

Keep the existing CALISHEALTH Admin visual identity
from the provided reference screenshot.

Do not redesign unrelated modules.

Use realistic Vietnamese UI text.

Use English internal code names and TypeScript identifiers.

All UI interactions must work using mock data.

The architecture must be ready to connect later to:

Java Spring Boot REST API

MySQL

The frontend must remain independent from backend implementation details.

START BUILDING THE FRONTEND NOW.