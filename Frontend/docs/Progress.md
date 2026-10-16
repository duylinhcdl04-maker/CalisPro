You are a Senior Product Designer, UX/UI Designer and Frontend Engineer specializing in HealthTech, Fitness SaaS, AI Fitness and Performance Analytics platforms.

Design and implement a production-ready Admin Dashboard page for:

CALISHEALTH
Health-Tech & AI Platform

PAGE:
"Tiến độ & Thành tích"
English:
"Progress & Performance"

This is an Admin module inside an AI-powered Calisthenics platform.

============================================================
1. PRODUCT CONTEXT
============================================================

CalisHealth is an AI-powered Calisthenics HealthTech platform.

The platform allows users to:

- Complete physical assessments
- Receive personalized workout plans
- Perform Calisthenics exercises
- Train through workout sessions
- Use AI Motion Analysis to evaluate exercise form
- Track repetitions
- Track workout duration
- Track training consistency
- Improve physical performance
- Earn achievements
- Set and break personal records

The Admin Dashboard allows administrators and coaches to monitor the overall performance of the student population.

The page being designed is:

"Tiến độ & Thành tích"

This page must answer:

1. Are students improving?
2. How much are they improving?
3. How consistently are they training?
4. What personal records are being achieved?
5. What achievements are being unlocked?
6. Which students are progressing fastest?
7. Which students are losing progress?
8. Which students are becoming inactive?
9. How is AI Motion performance changing?
10. What students require intervention?

IMPORTANT:

This page is NOT just a collection of statistics.

It is a:

"Fitness Performance Intelligence Center"

The interface must transform:

RAW TRAINING DATA
        ↓
PERFORMANCE ANALYTICS
        ↓
INSIGHTS
        ↓
ACTIONABLE DECISIONS

============================================================
2. CORE DESIGN PRINCIPLE
============================================================

The page should communicate:

"Where are students now?"

through Fitness Profile

and:

"How far have students progressed?"

through Progress & Performance.

Do NOT duplicate the Fitness Profile page.

Fitness Profile focuses on:

- Strength
- Endurance
- Mobility
- Core
- Balance
- Skill
- Fitness Level
- Assessment

Progress & Performance focuses on:

- Performance improvement
- Training volume
- Workout frequency
- Personal records
- Streaks
- Achievements
- Training consistency
- AI Motion performance
- Performance trends
- Students at risk

============================================================
3. TECHNOLOGY
============================================================

Use:

React
TypeScript
Vite
Tailwind CSS
shadcn/ui
Lucide React
Recharts
TanStack Query
TanStack Table
React Hook Form
Zod
date-fns

Use reusable components.

Do NOT create a single giant React component.

Prepare the architecture for future integration with:

Java Spring Boot REST API
MySQL

Frontend must initially use realistic mock data.

The mock data must be structured exactly like future API responses.

============================================================
4. VISUAL DESIGN
============================================================

Maintain the existing CalisHealth Admin visual identity shown in the reference design.

Style:

Premium HealthTech
Modern SaaS
Minimal
Professional
Data-driven
Athletic
Trustworthy
Clinical but not sterile

Do NOT make the interface look like:

- generic Bootstrap admin
- gaming dashboard
- cryptocurrency dashboard
- childish fitness application
- overly colorful analytics dashboard

Primary brand color:

#7C9B5B

Dark green:

#55733C

Light green:

#EEF4E8

Background:

#F7F8F4

Card:

#FFFFFF

Text:

#172019

Secondary text:

#687268

Border:

#E3E7DF

Positive:

#3FA56B

Warning:

#D99A35

Danger:

#D85B5B

Information:

#5B86C5

Use green primarily for:

- positive progress
- active navigation
- primary CTA
- healthy status
- improvement indicators

Do NOT overuse green.

Use subtle shadows only.

Cards should use:

border-radius: 18px

border: 1px solid #E3E7DF

Minimal shadow.

============================================================
5. GLOBAL ADMIN LAYOUT
============================================================

Maintain the existing CalisHealth Admin layout.

Desktop:

LEFT SIDEBAR
+
TOP HEADER
+
MAIN CONTENT

Sidebar:

CALISHEALTH
Health-Tech & AI Platform
ADMIN

Navigation:

Tổng quan & Dashboard

Người dùng & Huấn luyện viên

Hệ thống Tập luyện
  - Thư viện Động tác
  - Giáo án & Lộ trình
  - Phiên tập luyện

Đánh giá & Thể chất
  - Bài test Đánh giá
  - Hồ sơ Thể chất
  - Tiến độ & Thành tích ← ACTIVE

Công nghệ AI & Motion

Kinh doanh & Báo cáo

Nội dung & Truyền thông

Hệ thống & Bảo mật

The active navigation item must be:

green background
white/dark green icon
bold text

Keep the existing sidebar style from the reference image.

============================================================
6. TOP HEADER
============================================================

Top header contains:

Left:

Sidebar collapse button

Global search:

"Tìm kiếm dữ liệu..."

Keyboard shortcut:

⌘ K

Right:

AI Vision:

"AI Vision: 99.9% Online"

Button:

"Xem App Học Viên"

Notification icon

Admin avatar

Maintain the existing CalisHealth header style.

============================================================
7. PAGE HEADER
============================================================

Main page header:

Title:

"Tiến độ & Thành tích"

Badge:

"Performance Analytics"

Subtitle:

"Theo dõi sự tiến bộ, thành tích cá nhân, mức độ duy trì tập luyện và hiệu suất của học viên theo thời gian."

Right:

"← Về Dashboard"

The header should be clean and compact.

Do NOT make the title excessively large.

============================================================
8. KPI OVERVIEW
============================================================

Create a 4-column KPI grid.

KPI 01:

KỶ LỤC CÁ NHÂN

34,890 PRs

Supporting text:

"+12.4% so với tháng trước"

Icon:

Trophy

---

KPI 02:

MỨC TĂNG HIỆU SUẤT TB

+24.5%

Supporting:

"Trong 8 tuần gần nhất"

Icon:

TrendingUp

---

KPI 03:

TỶ LỆ DUY TRÌ CHUỖI

68.2%

Supporting:

"Học viên tập ≥ 3 buổi/tuần"

Icon:

Flame

---

KPI 04:

TỶ LỆ HOÀN THÀNH

82.6%

Supporting:

"+6.8% so với tháng trước"

Icon:

CircleCheck

Each KPI card must include:

- label
- main metric
- trend
- supporting description
- icon

Use subtle hover interaction.

============================================================
9. GLOBAL FILTER TOOLBAR
============================================================

Create a filter toolbar below KPI cards.

Search:

"Tìm kiếm học viên..."

Filters:

[Cấp độ]
[Thời gian]
[Bài tập]
[Trạng thái]
[Performance]

Date range:

01/09/2026 - 28/09/2026

Buttons:

"Đặt lại"

"Xuất báo cáo"

Selected filters should appear as removable chips.

All filters must be interactive.

============================================================
10. PERFORMANCE OVERVIEW
============================================================

This must be the primary analytics section.

Create a large card:

Title:

"Xu hướng hiệu suất tập luyện"

Subtitle:

"So sánh hiệu suất của học viên theo thời gian"

Use Recharts Line Chart.

X-axis:

Week 1
Week 2
Week 3
Week 4
Week 5
Week 6
Week 7
Week 8

Y-axis:

0
20
40
60
80
100

Current period example:

68
71
72
75
78
81
83
85

Previous period:

61
63
64
66
68
69
71
73

Display two lines:

Current Period
Previous Period

Add controls:

[Overall Performance ▼]

Options:

Overall Performance
Strength Performance
Endurance Performance
Form Quality
Workout Completion
Training Volume
Consistency

Time filters:

8 tuần
3 tháng
6 tháng
1 năm

Hover tooltip must show:

Week
Current
Previous
Difference

Example:

Week 6

Current:
81

Previous:
69

Improvement:
+12

============================================================
11. TRAINING SUMMARY
============================================================

Place a Training Summary card next to the Performance Chart.

Title:

"Tổng quan tập luyện"

Display:

TOTAL WORKOUTS

12,842

TOTAL REPS

486,291

TRAINING TIME

18,426 hrs

ACTIVE STUDENTS

9,842

AVERAGE WORKOUT / WEEK

3.8

Use compact metric rows.

Each metric should include a small icon.

============================================================
12. TRAINING VOLUME
============================================================

Create a full-width card:

Title:

"Khối lượng tập luyện"

Subtitle:

"Tổng volume tập luyện của toàn hệ thống"

Use a Bar Chart.

Display weekly volume.

Metrics switch:

[Reps]
[Sets]
[Duration]
[Workouts]

Example:

Week 1
18,420

Week 2
21,842

Week 3
24,129

Week 4
27,421

Week 5
31,842

Week 6
34,218

Week 7
36,421

Week 8
39,821

Include a small trend indicator:

"+18.4%"

============================================================
13. EXERCISE VOLUME BREAKDOWN
============================================================

Create a section:

"Top bài tập theo khối lượng"

Display:

Push Up
84,291 reps

Squat
72,381 reps

Pull Up
41,281 reps

Dips
32,482 reps

Plank
18,241 minutes

Use horizontal bars.

Allow sorting:

Volume
Students
Growth

============================================================
14. PERSONAL RECORDS
============================================================

Create a premium card:

"Kỷ lục cá nhân"

Subtitle:

"Những thành tích mới được thiết lập"

Display:

Pull Up

18 reps

↑ +3 reps

Push Up

42 reps

↑ +7 reps

Dips

25 reps

↑ +5 reps

Plank

03:42

↑ +32 sec

Muscle Up

8 reps

↑ +2 reps

Each record should include:

Exercise icon
Exercise name
Current record
Previous record
Improvement
Date achieved

Use subtle trophy iconography.

============================================================
15. ACHIEVEMENT SYSTEM
============================================================

Create:

"Thành tích học viên"

Display:

Total Achievements

28,421

Unlocked This Month

4,281

Most Popular Achievement

7 Day Streak

Create achievement cards:

🏆 First Pull Up

🔥 7 Day Streak

💪 100 Push Ups

⚡ 10 Workouts

🏅 Consistency Master

🎯 30 Day Streak

Each card:

Icon
Achievement name
Unlocked count
Percentage of users
Progress if applicable

Add:

"Xem tất cả thành tích"

============================================================
16. TRAINING CONSISTENCY
============================================================

Create a large card:

"Mức độ duy trì tập luyện"

Use a GitHub-style calendar heatmap.

Months:

June
July
August
September

Days:

Mon
Tue
Wed
Thu
Fri
Sat
Sun

Color intensity:

Low activity
Medium activity
High activity

Display summary:

Current Streak:
21 days

Longest Streak:
34 days

Average:
3.8 workouts/week

Active Days:
18 / 28

Inactive Students:
1,284

Tooltip:

Date
Number of workouts
Number of active students

============================================================
17. AI MOTION PERFORMANCE
============================================================

Create a dedicated AI section.

Title:

"AI Motion Performance"

Badge:

"AI Powered"

Main metric:

Average Form Score

86.4 / 100

↑ 8.7%

Breakdown:

Push Up
91

Squat
88

Pull Up
82

Dips
79

Plank
94

Use horizontal progress bars.

Then:

"Common Form Issues"

Hip Alignment
18.2%

Shoulder Position
14.8%

Insufficient ROM
12.4%

Tempo
8.7%

Stability
6.2%

Use warning indicators.

============================================================
18. TOP PROGRESSING STUDENTS
============================================================

Create:

"🚀 Học viên tiến bộ nhanh nhất"

Use a table.

Columns:

Rank
Student
Fitness Level
Performance
Improvement
Streak
PRs
Last Workout
Action

Example:

01
Nguyễn Minh Anh
Intermediate
82
+32%
21 days
18
Today

02
Trần Hoàng Nam
Beginner
71
+29%
18 days
12
Yesterday

03
Lê Thu Hà
Beginner
68
+26%
16 days
9
Today

Use positive green indicators.

Button:

"Xem tất cả"

============================================================
19. STUDENTS AT RISK
============================================================

Create a visually distinct warning section.

Title:

"⚠ Học viên có dấu hiệu giảm tiến độ"

Description:

"Những học viên có hiệu suất, tần suất tập hoặc mức độ duy trì giảm đáng kể."

Display rows:

Student
Performance Change
Training Frequency
Last Workout
Risk Reason
Action

Example:

Nguyễn A

Performance:

72 → 64

-11.1%

Training:

4.2 → 1.8 sessions/week

Last workout:

8 days ago

Reason:

Performance decline

Action:

"Xem hồ sơ"

Use warning / danger colors carefully.

Possible risk rules:

Performance ↓ > 10%

OR

Training Frequency ↓ > 40%

OR

No workout > 7 days

OR

Streak broken

OR

Form Score ↓ > 15%

============================================================
20. STUDENT PERFORMANCE TABLE
============================================================

Create full-width TanStack Table.

Title:

"Danh sách tiến độ học viên"

Columns:

Avatar
Student
Fitness Level
Performance Score
Improvement
Workouts
Streak
PRs
Last Workout
Status
Actions

Status:

Active
Improving
Stable
At Risk
Inactive

Features:

Search
Sorting
Filtering
Pagination
Column visibility
Rows per page
10
25
50
100

Action menu:

View Profile
View Progress
View Workout History
View AI Motion
Schedule Assessment

============================================================
21. STUDENT PERFORMANCE DRAWER
============================================================

When clicking a student:

Open a right-side drawer.

Width:

500–600px.

Header:

Avatar

Student name

Fitness Level

Performance Score

Trend

Tabs:

Overview
Performance
PRs
Consistency
AI Motion

Overview:

Performance Score

Improvement

Current Streak

Longest Streak

Average Workouts / Week

Total PRs

Performance chart

============================================================
22. STUDENT PERFORMANCE DETAIL
============================================================

Click:

"Xem hồ sơ"

Navigate to:

/admin/progress-performance/:studentId

Header:

Student Avatar
Name
Fitness Level
Performance Score
Status

Actions:

"Xem Fitness Profile"

"Xem lịch tập"

"Thêm ghi chú"

Tabs:

Overview
Performance
Workout History
Personal Records
Achievements
AI Motion

============================================================
23. PERFORMANCE TAB
============================================================

Display:

Starting Performance

52

Current Performance

82

Total Improvement

+57.7%

Create line chart.

Display:

Performance Score
Training Volume
Form Quality
Consistency

Allow toggling metrics.

============================================================
24. WORKOUT HISTORY
============================================================

Create a table:

Date
Workout
Duration
Exercises
Reps
Form Score
Calories
Completion
Status

Example:

28/09
Upper Body
42 min
6 exercises
182 reps
91
Completed

27/09
Core
31 min
5 exercises
124 reps
88
Completed

Allow:

Search
Filter
Date range

============================================================
25. PERSONAL RECORD DETAIL
============================================================

Display PR timeline.

Example:

Push Up

20 reps
↓
28 reps
↓
35 reps
↓
42 reps

Show:

First Record
Current Record
Best Improvement
Date Achieved

Use timeline visualization.

============================================================
26. ACHIEVEMENT DETAIL
============================================================

Show:

Unlocked Achievements

Locked Achievements

Progress toward next achievement.

Example:

"30 Day Streak"

Current:

21 / 30 days

Progress:

70%

"9 more days to unlock"

============================================================
27. EMPTY STATES
============================================================

Create professional empty states.

No performance data:

"Chưa có dữ liệu tiến độ"

"Hoàn thành ít nhất một buổi tập để bắt đầu theo dõi tiến độ."

No PR:

"Chưa có kỷ lục cá nhân"

No achievements:

"Chưa có thành tích được mở khóa"

No students found:

"Không tìm thấy học viên"

Do not leave blank spaces.

============================================================
28. LOADING STATES
============================================================

Use Skeleton UI.

Skeletons for:

KPI cards
Charts
Tables
Student drawer
Performance cards

Never display blank white areas while loading.

============================================================
29. ERROR STATES
============================================================

Show:

"Không thể tải dữ liệu tiến độ."

Button:

"Thử lại"

Do not expose backend errors.

============================================================
30. RESPONSIVE DESIGN
============================================================

Optimize for:

1440px
1280px
1024px
768px
390px

Desktop:

Sidebar visible.

Tablet:

Sidebar collapsible.

Mobile:

Sidebar becomes drawer.

Charts become full width.

Cards become one column.

Tables become horizontally scrollable or mobile cards.

Important metrics must remain visible.

============================================================
31. ACCESSIBILITY
============================================================

Implement:

Semantic HTML
Keyboard navigation
ARIA labels
Accessible tooltips
Visible focus states
Sufficient contrast
Screen-reader-friendly charts where possible

Never communicate status through color alone.

Use:

↑ +24.5%

↓

+/- values

icons

labels

============================================================
32. MICRO INTERACTIONS
============================================================

Use subtle animations only.

Examples:

Cards:

translateY(-2px)

Charts:

smooth entrance

Progress bars:

animated

Drawer:

slide from right

Dropdown:

fade + scale

Do NOT use excessive animations.

============================================================
33. TYPESCRIPT DATA MODELS
============================================================

Create interfaces:

StudentPerformance

PerformanceMetric

WorkoutPerformance

PersonalRecord

Achievement

TrainingStreak

TrainingVolume

MotionPerformance

PerformanceAlert

Example:

interface StudentPerformance {
  id: string;
  studentId: string;
  studentName: string;
  avatar?: string;
  fitnessLevel: FitnessLevel;
  performanceScore: number;
  improvement: number;
  totalWorkouts: number;
  currentStreak: number;
  longestStreak: number;
  personalRecords: number;
  lastWorkoutDate: string;
  status: PerformanceStatus;
}

============================================================
34. MOCK DATA
============================================================

Generate realistic Vietnamese data.

Create at least:

30 students

50 workout records

30 personal records

30 achievements

50 performance history records

20 AI Motion records

10 risk alerts

Data must be logically consistent.

Do not generate random unrelated values.

If:

Performance improves,

then improvement percentage must correspond.

If:

student has a 21-day streak,

their workout history must support it.

============================================================
35. API ARCHITECTURE
============================================================

Prepare services for future Spring Boot backend.

Endpoints:

GET
/api/admin/performance/statistics

GET
/api/admin/performance/trends

GET
/api/admin/performance/volume

GET
/api/admin/performance/personal-records

GET
/api/admin/performance/achievements

GET
/api/admin/performance/consistency

GET
/api/admin/performance/ai-motion

GET
/api/admin/performance/top-students

GET
/api/admin/performance/at-risk

GET
/api/admin/performance/students

GET
/api/admin/performance/students/{id}

GET
/api/admin/performance/students/{id}/workouts

GET
/api/admin/performance/students/{id}/records

GET
/api/admin/performance/students/{id}/achievements

GET
/api/admin/performance/students/{id}/motion

Do not put API calls directly inside UI components.

Use:

services
+
hooks
+
TanStack Query.

============================================================
36. COMPONENT ARCHITECTURE
============================================================

Use:

ProgressPerformance/
│
├── ProgressPerformancePage.tsx
│
├── components/
│   ├── PerformanceHeader.tsx
│   ├── PerformanceKPICards.tsx
│   ├── PerformanceFilters.tsx
│   ├── PerformanceTrendChart.tsx
│   ├── TrainingSummary.tsx
│   ├── TrainingVolumeChart.tsx
│   ├── ExerciseVolume.tsx
│   ├── PersonalRecords.tsx
│   ├── AchievementOverview.tsx
│   ├── TrainingConsistency.tsx
│   ├── AIMotionPerformance.tsx
│   ├── TopProgressingStudents.tsx
│   ├── StudentsAtRisk.tsx
│   ├── StudentPerformanceTable.tsx
│   └── StudentPerformanceDrawer.tsx
│
├── hooks/
│   ├── usePerformanceStatistics.ts
│   ├── usePerformanceTrend.ts
│   ├── usePerformanceStudents.ts
│   └── useStudentPerformance.ts
│
├── services/
│   └── performanceService.ts
│
├── types/
│   └── performance.types.ts
│
└── data/
    └── performance.mock.ts

============================================================
37. PAGE INFORMATION HIERARCHY
============================================================

Follow this hierarchy strictly.

LEVEL 1:
"What is happening?"

KPI Cards

LEVEL 2:
"Is performance improving?"

Performance Trend

LEVEL 3:
"Why is performance changing?"

Training Volume
Consistency
AI Motion

LEVEL 4:
"What achievements are being created?"

PR
Achievements

LEVEL 5:
"Who needs attention?"

Top Progressing
At Risk

LEVEL 6:
"Which individual student?"

Student Performance Table

This hierarchy is extremely important.

Do not place random charts next to each other.

============================================================
38. DATA → INSIGHT → ACTION
============================================================

Every important analytical section should lead to an action.

Example:

Performance ↓ 11%

↓

Student At Risk

↓

"Xem hồ sơ"

↓

"Xem lịch tập"

↓

"Xem AI Motion"

↓

"Liên hệ Coach"

The UI must support this workflow.

============================================================
39. VISUAL QUALITY
============================================================

The final interface should look like a premium HealthTech SaaS platform.

Reference feeling:

Modern HealthTech
+
Fitness Analytics
+
AI Dashboard
+
Enterprise SaaS

Use:

Excellent spacing
Strong typography
Clear hierarchy
Professional charts
Subtle borders
Minimal shadows
Consistent iconography
High information density without clutter

Avoid:

Excessive gradients
Huge cards
Too many colors
Too many pills
Heavy shadows
Generic dashboard templates
Unnecessary decorative graphics

============================================================
40. FINAL PAGE STRUCTURE
============================================================

The final page should visually follow this hierarchy:

PAGE HEADER

↓

4 KPI CARDS

↓

FILTER TOOLBAR

↓

PERFORMANCE TREND
+
TRAINING SUMMARY

↓

TRAINING VOLUME

↓

PERSONAL RECORDS
+
ACHIEVEMENTS

↓

TRAINING CONSISTENCY
+
AI MOTION PERFORMANCE

↓

TOP PROGRESSING STUDENTS

↓

STUDENTS AT RISK

↓

STUDENT PERFORMANCE TABLE

↓

STUDENT PERFORMANCE DRAWER

The final page should feel like:

"CALISHEALTH PERFORMANCE INTELLIGENCE CENTER"

not a simple CRUD page.

============================================================
41. FINAL REQUIREMENT
============================================================

Implement the complete UI with realistic mock data.

Every major interaction must work:

- Search
- Filter
- Sort
- Pagination
- Date range
- Chart switching
- Metric switching
- Open student drawer
- Open student profile
- View workout history
- View PR
- View achievements
- View AI Motion
- Reset filters
- Export report UI
- Responsive layout

Do not leave placeholder boxes such as:

"Data will be displayed here"

Do not create empty sections.

Build a polished, realistic, interactive prototype that could later be connected directly to a Java Spring Boot REST API and MySQL database.