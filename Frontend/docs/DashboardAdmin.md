# CALISHEALTH ADMIN — COMPLETE FRONTEND UI/UX SPECIFICATION

You are a Senior Product Designer, UX Engineer, Design System Architect, and Senior React Frontend Engineer.

Your task is to design and implement a complete, production-quality **Admin Frontend** for a health-tech and AI-powered calisthenics platform called **CalisHealth**.

The frontend must be designed as a complete Admin Management System from the beginning.

Do NOT create a simple dashboard template.

The system must support 15 complete Admin modules:

1. Dashboard
2. User Management
3. Coach Management
4. Exercise Library
5. Workout Plan Management
6. Assessment Management
7. Fitness Profile Management
8. Workout Session Management
9. Progress & Performance
10. AI Coaching
11. Subscription Management
12. Analytics & Reports
13. Notifications & Communication
14. Content Management
15. System & Security Management

The frontend should be scalable so that future Spring Boot REST APIs can be connected without redesigning the UI architecture.

---

# 1. PRODUCT CONTEXT

---

CalisHealth is an AI-powered calisthenics and fitness platform.

The user application allows users to:

* Register
* Complete an initial assessment
* Build a fitness profile
* Receive personalized workout plans
* Perform workouts
* Track exercise performance
* Receive AI coaching
* Monitor progress
* Improve their fitness over time

The Admin application is responsible for managing the entire ecosystem.

The Admin should be able to manage:

Users
Coaches
Exercises
Workout Plans
Assessments
Fitness Profiles
Workout Sessions
Progress
AI Coaching
Subscriptions
Analytics
Notifications
Content
Security
System configuration

The Admin UI must communicate:

* Professionalism
* Data-driven decision making
* Health-tech credibility
* AI technology
* Fitness expertise
* Operational control
* Reliability

Do not make the UI look like a generic gym management system.

Do not make it look like a generic Bootstrap admin dashboard.

The visual identity should feel like:

Premium Health-Tech SaaS
+
Fitness Intelligence Platform
+
AI Management System

---

# 2. FRONTEND TECHNOLOGY STACK

---

Use:

* React
* TypeScript
* Vite
* Tailwind CSS
* shadcn/ui
* Radix UI
* Lucide React
* Motion / Framer Motion
* Recharts
* TanStack Query
* Axios
* React Router
* React Hook Form
* Zod
* Sonner
* date-fns
* clsx
* tailwind-merge

Do not introduce unnecessary UI libraries.

Use shadcn/ui as the base component system.

Customize the components so the application has its own CalisHealth visual identity.

Use TypeScript strictly.

Avoid any.

Create reusable components instead of duplicating UI.

---

# 3. DESIGN PHILOSOPHY

---

The Admin interface should follow these principles:

1. Clarity over decoration.
2. Data hierarchy over visual noise.
3. Consistency across all modules.
4. Fast navigation.
5. Clear actions.
6. Strong table design.
7. Strong filtering and search.
8. Meaningful empty states.
9. Meaningful loading states.
10. Professional data visualization.

The Admin should immediately understand:

"What is happening?"

"Why is it happening?"

"What needs attention?"

"Where should I act?"

---

# 4. VISUAL STYLE

---

Create a premium, modern, minimalist health-tech interface.

Use:

* Large whitespace
* Strong typography
* Subtle borders
* Soft surfaces
* Minimal shadows
* Consistent spacing
* Neutral backgrounds
* Green accent color
* Clean charts
* Professional tables
* Subtle motion

Avoid:

* Neon colors
* Excessive gradients
* Excessive glassmorphism
* Excessive rounded cards
* Huge shadows
* Cartoon illustrations
* Excessive emojis
* Gaming-style UI
* Excessive badges
* Excessive animations

The system should feel closer to a serious SaaS/health-tech product than a gaming fitness app.

---

# 5. COLOR SYSTEM

---

Create a complete design token system using CSS variables.

Primary:

#111111

Background:

#F7F8F6

Surface:

#FFFFFF

Surface Secondary:

#F1F3F0

Border:

#E2E5E1

Primary Text:

#171817

Secondary Text:

#6B716B

Muted Text:

#929792

Accent:

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

Do not hard-code colors repeatedly.

Use semantic design tokens.

Prepare architecture for dark mode even if the first release uses light mode.

---

# 6. TYPOGRAPHY

---

Use:

Inter

or

Manrope

Recommended hierarchy:

Display:
48–56px

H1:
36–44px

H2:
28–32px

H3:
22–26px

Body:
14–16px

Small:
12–13px

Use font weights carefully.

Do not make everything bold.

Typography should create hierarchy naturally.

---

# 7. GLOBAL ADMIN LAYOUT

---

Create:

AdminLayout

The layout consists of:

1. Sidebar
2. Top Header
3. Main Content
4. Optional Breadcrumb
5. Page Header
6. Content Area

Desktop:

Sidebar width:
250–280px

Main content:
Fluid

Maximum content width:
1440px

Tablet:

Collapsible sidebar.

Mobile:

Sidebar becomes a Sheet / Drawer.

Navigation should remain usable on small screens.

---

# 8. SIDEBAR

---

The sidebar should be professional and compact.

Top:

CalisHealth logo

Label:

ADMIN

Navigation groups:

OVERVIEW

Dashboard

USER MANAGEMENT

Users
Coaches

TRAINING

Exercises
Workout Plans
Workout Sessions

ASSESSMENT

Assessments
Fitness Profiles

PERFORMANCE

Progress & Performance

AI

AI Coaching

BUSINESS

Subscriptions

ANALYTICS

Analytics & Reports

CONTENT

Content Management

COMMUNICATION

Notifications

SYSTEM

Settings & Security

Bottom:

Admin avatar

Admin name

Admin role

Settings

Logout

Use collapsible navigation groups.

Show active route clearly.

Do not use excessive icons.

Use Lucide React icons.

---

# 9. TOP HEADER

---

Header:

Sidebar toggle

Breadcrumb

Global Search

Notifications

Admin profile

Example:

[☰]

Dashboard

[ Search anything... ]

[🔔]

Admin ▼

Global Search should support:

Users
Coaches
Exercises
Workout Plans
Assessments
Content

Search results should appear in a command palette style.

Use keyboard shortcut:

/

or

Ctrl + K

---

# 10. GLOBAL PAGE STRUCTURE

---

Every module page should follow a consistent pattern:

Page Header

Title

Description

Primary Action

Secondary Actions

Filters

Content

Pagination

Example:

Users

"Manage CalisHealth users and their fitness activity."

[Export] [Add User]

Search users...

[Status] [Level] [Goal] [Date]

Table

Pagination

This pattern must be reused throughout the application.

---

# 11. GLOBAL COMPONENT SYSTEM

---

Create reusable components:

AppSidebar
Topbar
Breadcrumb
PageHeader
SearchInput
GlobalSearch
FilterBar
DataTable
DataTableToolbar
Pagination
StatCard
ChartCard
EmptyState
ErrorState
LoadingState
Skeleton
ConfirmDialog
DeleteDialog
FormDialog
Drawer
Tabs
Badge
StatusBadge
Avatar
DateRangePicker
DropdownMenu
CommandPalette
Toast
Tooltip
ProgressBar
ProgressRing
MetricCard
Timeline
ActivityFeed
FileUploader
ImageUploader
VideoUploader

All components must be reusable.

---

# 12. DASHBOARD MODULE

---

Route:

/admin/dashboard

This is the overview of the entire CalisHealth ecosystem.

IMPORTANT:

Do not put all 15 modules directly on the Dashboard.

The Dashboard summarizes information from the modules.

---

# 13. DASHBOARD — KPI SECTION

---

Display 4–6 primary KPI cards.

Examples:

Total Users

12,482
+12.4%

Active Users

3,842
+8.2%

Workout Sessions

8,291
+15.1%

Assessment Completion

75.6%
+6.2%

Active Subscriptions

4,281
+9.4%

AI Recommendations

24,821
+18.2%

Each KPI should include:

Value
Trend
Comparison period
Small contextual icon

Use subtle trend indicators.

---

# 14. DASHBOARD — USER GROWTH

---

Large chart:

User Growth

Use Recharts.

Filters:

7D
30D
3M
6M
1Y

Chart:

Line chart.

Tooltip:

Date
New Users
Total Users

Keep the chart clean.

---

# 15. DASHBOARD — USER ACTIVITY

---

Display:

Active Users
Workouts Started
Workouts Completed
Assessments Completed

Use compact metric cards.

---

# 16. DASHBOARD — WORKOUT ANALYTICS

---

Show:

Completed
Partial
Abandoned

Use donut chart.

Example:

Completed:
78%

Partial:
14%

Abandoned:
8%

Below:

Average Workout Duration
Average Completion Rate
Average Exercises / Session

---

# 17. DASHBOARD — ASSESSMENT ANALYTICS

---

Show assessment funnel:

Started
Step 1
Step 2
Step 3
Completed

Display completion percentage.

Show where users drop off.

---

# 18. DASHBOARD — FITNESS DISTRIBUTION

---

Display:

Beginner
Intermediate
Advanced

Use horizontal bars or donut chart.

---

# 19. DASHBOARD — USER GOALS

---

Show:

Strength
Muscle Gain
Weight Loss
Endurance
Calisthenics Skills
General Fitness

Use a clean chart.

---

# 20. DASHBOARD — AI SYSTEM STATUS

---

Display:

Movement Detection
Pose Analysis
Rep Counting
Form Analysis
Recommendation Engine

Statuses:

Operational
Degraded
Offline

Use semantic status colors.

---

# 21. DASHBOARD — RECENT ACTIVITY

---

Timeline:

New user registered

Workout completed

Assessment completed

Exercise updated

Workout plan published

AI recommendation generated

Subscription activated

Use relative timestamps.

---

# 22. USER MANAGEMENT MODULE

---

Route:

/admin/users

Features:

Search
Filter
Sort
Pagination
Export
Create User
Edit User
Suspend User
Activate User
View User

Table columns:

Avatar
Name
Email
Fitness Level
Primary Goal
Subscription
Status
Joined
Actions

Actions:

View
Edit
Suspend
Delete

Do not allow destructive actions without confirmation.

---

# 23. USER DETAIL

---

Route:

/admin/users/:id

Use tabs:

Overview
Profile
Assessment
Fitness
Workouts
Progress
AI Recommendations
Subscription
Activity

Header:

Avatar
Name
Email
Status

Show:

Fitness Score
Training Level
Primary Goal
Workout Completion
Current Streak

Use charts for progress.

---

# 24. COACH MANAGEMENT

---

Route:

/admin/coaches

Features:

Search
Filter
Create Coach
Edit Coach
Activate
Deactivate

Table:

Name
Specialization
Assigned Users
Active Users
Plans Created
Rating
Status

Coach Detail:

Profile
Assigned Users
Workout Plans
Performance
Feedback
Activity

---

# 25. EXERCISE LIBRARY

---

Route:

/admin/exercises

Display exercises as:

Table view
Optional Grid view

Exercise card:

Image
Name
Difficulty
Primary Muscle
Equipment
Status

Filters:

Difficulty
Muscle
Equipment
Status
Category

Actions:

View
Edit
Duplicate
Deactivate

---

# 26. EXERCISE DETAIL

---

Route:

/admin/exercises/:id

Sections:

Basic Information
Media
Muscle Groups
Instructions
Safety
Common Mistakes
Progressions
Regressions

Show progression tree:

Beginner Exercise
↓
Current Exercise
↓
Advanced Exercise

Allow Admin to edit relationships.

---

# 27. WORKOUT PLAN MANAGEMENT

---

Route:

/admin/workout-plans

Display:

Name
Goal
Difficulty
Duration
Frequency
Users
Status
Updated

Actions:

Create
Edit
Duplicate
Publish
Archive

---

# 28. WORKOUT PLAN BUILDER

---

Create a visual workout plan builder.

Structure:

Plan
↓
Weeks
↓
Days
↓
Exercises
↓
Sets

Example:

Plan:
Beginner Strength

Week 1

Day 1
Push Up
Squat
Plank

Day 2
Pull Up
Lunge
Hollow Hold

Week 2

...

Allow:

Drag & Drop
Reorder
Duplicate
Add Exercise
Remove Exercise

The interface should be easy to use.

---

# 29. WORKOUT SESSION MANAGEMENT

---

Route:

/admin/workout-sessions

Table:

User
Workout
Start Time
Duration
Exercises
Completion
Performance
Status

Filters:

Status
Date
Workout
User
Coach

Detail:

Workout timeline

Exercise performance

Sets

Reps

Duration

Completion

---

# 30. ASSESSMENT MANAGEMENT

---

Route:

/admin/assessments

Sub-navigation:

Questions
Question Groups
Answer Options
Templates
Sessions
Results

---

# 31. QUESTION BUILDER

---

Support:

Single Choice
Multiple Choice
Number
Boolean
Scale
Text

Question editor:

Question
Description
Type
Options
Validation
Required
Order

Example:

"What is your primary goal?"

Options:

Strength
Muscle Gain
Weight Loss
Endurance
Skills

Questions must be reorderable.

---

# 32. ASSESSMENT SESSION MANAGEMENT

---

Display:

User
Assessment
Started
Completed
Completion %
Fitness Level
Score

Allow Admin to open a session and inspect answers.

---

# 33. FITNESS PROFILE MANAGEMENT

---

Route:

/admin/fitness-profiles

Display:

User
Fitness Level
Overall Score
Strength
Endurance
Mobility
Core
Balance
Last Assessment

Use color only as secondary information.

Provide detail charts.

---

# 34. WORKOUT PROGRESS & PERFORMANCE

---

Route:

/admin/progress

Allow Admin to inspect:

Strength Progress
Endurance Progress
Mobility Progress
Consistency
Personal Records
Body Measurements

Charts:

Line
Bar
Area

Time filters:

7D
30D
3M
6M
1Y

---

# 35. AI COACHING MODULE

---

Route:

/admin/ai

Sub-pages:

Overview
Recommendations
Form Analysis
Movement Analysis
Rep Counting
AI Logs
Performance

Overview KPI:

Recommendations Generated
Acceptance Rate
Average Confidence
Failed Analyses
Processing Time

---

# 36. AI RECOMMENDATION TABLE

---

Columns:

User
Recommendation Type
Reason
Confidence
Status
Created At

Types:

Workout Adjustment
Exercise Progression
Recovery
Mobility
Difficulty Adjustment

Status:

Generated
Accepted
Rejected
Expired

---

# 37. AI FORM ANALYSIS

---

Display:

Session
User
Exercise
Analysis Score
Detected Errors
Confidence
Status

Example:

Push Up

Form Score:
82 / 100

Detected:

Hip position too high
Elbow angle inconsistent

Confidence:
94%

Do not create medical claims.

---

# 38. SUBSCRIPTION MANAGEMENT

---

Route:

/admin/subscriptions

Sub-pages:

Plans
Subscriptions
Payments

Plans:

Free
Trial
Premium
Pro

Plan card:

Price
Billing Period
Features
Subscribers
Status

Subscription table:

User
Plan
Start Date
End Date
Status
Auto Renewal

---

# 39. ANALYTICS & REPORTS

---

Route:

/admin/analytics

Tabs:

Users
Engagement
Workout
Assessment
Retention
Subscription
AI

Provide:

Date Range

Compare Period

Export

Charts

Tables

---

# 40. RETENTION ANALYTICS

---

Display cohort table:

Day 1
Day 7
Day 30
Day 60
Day 90

Use heatmap-style visualization.

---

# 41. NOTIFICATIONS

---

Route:

/admin/notifications

Features:

Create Notification
Templates
Scheduled
History

Notification types:

In-App
Email
Push

Create form:

Title
Message
Audience
Channel
Schedule
Priority

Audience examples:

All Users
Beginner
Intermediate
Premium
Inactive Users
Users with incomplete assessments

---

# 42. CONTENT MANAGEMENT

---

Route:

/admin/content

Content types:

Articles
Training Guides
Recovery Guides
Exercise Tips
FAQs

Table:

Title
Category
Author
Status
Updated
Published

Statuses:

Draft
Review
Published
Archived

Provide rich content editor interface.

---

# 43. SYSTEM & SECURITY

---

Route:

/admin/settings

Tabs:

General
Admin Users
Roles
Permissions
Audit Logs
Security
AI Settings
System Configuration

---

# 44. RBAC UI

---

Roles:

SUPER_ADMIN
ADMIN
COACH
CONTENT_MANAGER
ANALYST

Permission matrix:

```
          View  Create  Edit  Delete
```

Users           ✓      ✓      ✓      ✓
Exercises       ✓      ✓      ✓      ✓
Workouts        ✓      ✓      ✓      ✓
Analytics       ✓
Content         ✓      ✓      ✓      ✓
AI              ✓      -      ✓      -
Settings        ✓      ✓      ✓      ✓

Create an easy-to-understand permission matrix.

---

# 45. AUDIT LOG

---

Route:

/admin/audit-logs

Display:

Timestamp
Admin
Action
Module
Target
IP
Result

Example:

Admin updated exercise

Exercise:
Push Up

Time:
10:32 AM

Result:
Success

---

# 46. GLOBAL TABLE SYSTEM

---

All management tables must support:

Search
Sorting
Filtering
Pagination
Column visibility
Row selection
Bulk actions where appropriate
Export

Use shadcn/ui Table components.

Tables should remain readable.

Do not create overly dense tables.

---

# 47. FILTER SYSTEM

---

Create reusable FilterBar.

Support:

Select
Multi-select
Date range
Search
Status
Category
Difficulty

Filters should be removable as chips.

Example:

Status: Active
Level: Beginner
Goal: Strength

[Clear all]

---

# 48. FORM DESIGN

---

Use:

React Hook Form
Zod

Forms must support:

Validation
Required fields
Error messages
Loading state
Success state
Unsaved changes warning

Use Dialog for small forms.

Use full page or Drawer for complex forms.

---

# 49. DELETE / DESTRUCTIVE ACTION UX

---

Never immediately delete important records.

Show confirmation:

"Are you sure you want to deactivate this exercise?"

Explain consequences.

Primary action:

Deactivate

Secondary:

Cancel

For permanent deletion require stronger confirmation.

Prefer:

Active
Inactive
Archived

over hard deletion when possible.

---

# 50. LOADING STATES

---

Every page must have skeleton states.

Create:

DashboardSkeleton
TableSkeleton
CardSkeleton
ChartSkeleton
DetailSkeleton
FormSkeleton

Avoid generic "Loading..." text.

---

# 51. EMPTY STATES

---

Every module needs a designed empty state.

Example:

"No exercises found."

Supporting text:

"Try changing your filters or create a new exercise."

Button:

Create Exercise

Do not show blank tables.

---

# 52. ERROR STATES

---

Example:

"We couldn't load the users."

Button:

Try Again

Do not expose technical backend errors directly to Admin users.

---

# 53. RESPONSIVE DESIGN

---

Desktop is the primary Admin experience.

Desktop:

Sidebar
Topbar
Multi-column dashboards
Full data tables

Tablet:

Collapsible sidebar
Reduced columns

Mobile:

Drawer navigation
Stacked KPI cards
Horizontally scrollable tables
Simplified charts

Do not simply shrink desktop.

Adapt information hierarchy.

---

# 54. MOTION DESIGN

---

Use Motion.

Animations should be subtle.

Use:

Page fade
Card entrance
Sidebar transitions
Dialog transitions
Dropdown transitions
Chart entrance
Table row interaction

Duration:

150–350ms

Avoid:

Excessive parallax
Continuous animation
Large bouncing elements
Distracting effects

---

# 55. ACCESSIBILITY

---

Follow WCAG principles.

Support:

Keyboard navigation
Focus states
ARIA labels
Screen readers
Accessible dialogs
Accessible forms
Sufficient contrast
Semantic HTML

Do not rely on color alone.

---

# 56. ROUTING STRUCTURE

---

Create the following routes:

/admin/dashboard

/admin/users
/admin/users/:id

/admin/coaches
/admin/coaches/:id

/admin/exercises
/admin/exercises/new
/admin/exercises/:id
/admin/exercises/:id/edit

/admin/workout-plans
/admin/workout-plans/new
/admin/workout-plans/:id
/admin/workout-plans/:id/edit

/admin/workout-sessions
/admin/workout-sessions/:id

/admin/assessments
/admin/assessments/questions
/admin/assessments/templates
/admin/assessments/sessions
/admin/assessments/sessions/:id

/admin/fitness-profiles
/admin/fitness-profiles/:id

/admin/progress

/admin/ai
/admin/ai/recommendations
/admin/ai/form-analysis
/admin/ai/movement-analysis
/admin/ai/logs

/admin/subscriptions
/admin/subscriptions/plans
/admin/subscriptions/users
/admin/subscriptions/payments

/admin/analytics

/admin/notifications
/admin/notifications/create
/admin/notifications/templates
/admin/notifications/history

/admin/content
/admin/content/new
/admin/content/:id
/admin/content/:id/edit

/admin/settings
/admin/settings/admin-users
/admin/settings/roles
/admin/settings/permissions
/admin/settings/audit-logs

---

# 57. FRONTEND FOLDER STRUCTURE

---

Use a scalable feature-oriented architecture.

src/

├── app/
│   ├── router/
│   ├── providers/
│   └── config/
│
├── components/
│   ├── ui/
│   ├── layout/
│   ├── charts/
│   ├── tables/
│   ├── forms/
│   └── shared/
│
├── features/
│   ├── dashboard/
│   ├── users/
│   ├── coaches/
│   ├── exercises/
│   ├── workout-plans/
│   ├── workout-sessions/
│   ├── assessments/
│   ├── fitness/
│   ├── progress/
│   ├── ai/
│   ├── subscriptions/
│   ├── analytics/
│   ├── notifications/
│   ├── content/
│   └── settings/
│
├── pages/
│
├── hooks/
│
├── services/
│
├── types/
│
├── lib/
│
├── assets/
│
└── styles/

---

# 58. FEATURE ARCHITECTURE

---

Each feature should contain its own:

components
hooks
types
api
schemas
utils

Example:

features/users/

components/
UserTable.tsx
UserFilters.tsx
UserStats.tsx
UserDetail.tsx

hooks/
useUsers.ts
useUser.ts

api/
usersApi.ts

schemas/
userSchema.ts

types/
user.ts

Do not create one giant components folder.

---

# 59. API ARCHITECTURE PREPARATION

---

Prepare the frontend for:

Spring Boot REST API

Base:

/api/v1/admin

Examples:

GET /admin/dashboard

GET /admin/users
GET /admin/users/:id

GET /admin/coaches
GET /admin/coaches/:id

GET /admin/exercises
POST /admin/exercises
PUT /admin/exercises/:id

GET /admin/workout-plans
POST /admin/workout-plans

GET /admin/assessments
GET /admin/fitness-profiles

GET /admin/workout-sessions

GET /admin/progress

GET /admin/ai/recommendations

GET /admin/subscriptions

GET /admin/analytics

GET /admin/notifications

GET /admin/content

GET /admin/audit-logs

The UI should initially use mock services if backend APIs are not available.

Do not mix mock data directly inside UI components.

---

# 60. MOCK DATA ARCHITECTURE

---

Create:

mock/
├── users.ts
├── coaches.ts
├── exercises.ts
├── workouts.ts
├── assessments.ts
├── fitness.ts
├── progress.ts
├── ai.ts
├── subscriptions.ts
├── analytics.ts
└── notifications.ts

Mock API functions should simulate asynchronous requests.

This makes it easy to replace mock services with Axios later.

---

# 61. DATA VISUALIZATION

---

Use Recharts.

Supported charts:

LineChart
AreaChart
BarChart
PieChart
RadarChart

Use:

Line:
User Growth
Fitness Progress

Bar:
Workout Performance
Goal Distribution

Donut:
Subscription
Workout Completion

Radar:
Fitness Profile

Do not overuse charts.

Every chart must answer a real business question.

---

# 62. ADMIN DASHBOARD INFORMATION HIERARCHY

---

The dashboard should answer these questions in order:

LEVEL 1:

"What is happening?"

KPI cards.

LEVEL 2:

"Why is it happening?"

Charts and analytics.

LEVEL 3:

"What needs attention?"

AI alerts
System health
Recent activity
Pending actions

Do not overwhelm the Admin.

---

# 63. GLOBAL SEARCH

---

Implement Command Palette style search.

Shortcut:

Ctrl + K

Search across:

Users
Exercises
Workout Plans
Assessments
Content

Results grouped by category.

Example:

USERS

Min Nguyen

EXERCISES

Push Up

WORKOUT PLANS

Beginner Strength

CONTENT

How to Improve Pull Ups

---

# 64. EXPORT SYSTEM

---

Tables should support:

CSV export

PDF export can be architected later.

Add:

Export

button to:

Users
Workout Sessions
Analytics
Subscriptions
Assessments

---

# 65. NOTIFICATION SYSTEM

---

Show notification badge in header.

Example:

🔔 4

Dropdown:

New user registered
AI analysis failed
Workout plan published
Subscription activated

"View all"

---

# 66. ADMIN PROFILE

---

Top-right profile dropdown:

Admin name
Email
Role

Actions:

Profile
Settings
Activity
Logout

---

# 67. SECURITY UX

---

Admin-only routes must have:

Authentication guard

Role guard

Permission guard

Frontend should hide unauthorized actions.

Example:

A CONTENT_MANAGER should not see:

Delete User
System Settings
Security

But the backend remains the final authority.

Frontend permissions are for UX, not security.

---

# 68. DESIGN CONSISTENCY

---

All modules must share:

Same spacing
Same typography
Same buttons
Same dialogs
Same tables
Same filters
Same badges
Same forms
Same chart styling
Same page headers

The Admin application must feel like one product.

Do not design each module independently.

---

# 69. DEMO DATA

---

Create realistic demo data.

Do not use:

User 1
User 2
User 3

Use realistic data:

Min Nguyen
Anna Wilson
James Carter
Sophia Martin

Exercise examples:

Push Up
Pull Up
Squat
Pistol Squat
Handstand
Muscle Up
Diamond Push Up

Workout examples:

Beginner Strength
Upper Body Strength
Calisthenics Fundamentals
Full Body Conditioning

Assessment examples:

Initial Fitness Assessment
Monthly Progress Assessment

---

# 70. FINAL VISUAL QUALITY

---

The result must look like a real commercial product.

It should be suitable for:

* University project presentation
* Software architecture demonstration
* Product demo
* Portfolio
* Future production development

Do not create a simple CRUD admin panel.

The system should visually communicate that CalisHealth is a serious AI-powered health and fitness platform.

---

# 71. IMPLEMENTATION ORDER

---

Build the frontend in this order:

PHASE 1

Design System

PHASE 2

Admin Layout

Sidebar
Topbar
Global Search
Breadcrumb
Page Header

PHASE 3

Dashboard

PHASE 4

Data Table System

PHASE 5

User Management

PHASE 6

Coach Management

PHASE 7

Exercise Library

PHASE 8

Workout Plan Builder

PHASE 9

Assessment Management

PHASE 10

Fitness Profiles

PHASE 11

Workout Sessions

PHASE 12

Progress

PHASE 13

AI Coaching

PHASE 14

Subscriptions

PHASE 15

Analytics

PHASE 16

Notifications

PHASE 17

Content Management

PHASE 18

Settings & Security

---

# 72. IMPORTANT DEVELOPMENT RULES

---

Before implementing each page:

1. Define the page purpose.
2. Define information hierarchy.
3. Define components.
4. Define states.
5. Define interactions.
6. Define responsive behavior.
7. Then implement.

Every page must support:

Loading
Success
Empty
Error

Every destructive action requires confirmation.

Every form requires validation.

Every table requires pagination.

Every list requires search/filter where appropriate.

Every module must be accessible from the global sidebar.

---

# 73. FINAL REQUIREMENT

---

Build the Admin frontend as a single cohesive product.

The final visual language should feel:

Premium
Minimal
Professional
Scientific
Athletic
Intelligent
Data-driven
Reliable

The Admin Dashboard is not simply a collection of charts.

It is the operational center of CalisHealth.

The final architecture must allow:

React Frontend
↓
TanStack Query
↓
Axios
↓
Spring Boot REST API
↓
MySQL

without requiring a major frontend rewrite.

Start by implementing the Design System, Admin Layout, Sidebar, Topbar, Global Search and Dashboard.

Then progressively implement all 15 modules using the same design system.
