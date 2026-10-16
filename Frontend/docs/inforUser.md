You are a Senior Product Designer, UX/UI Designer and Frontend Engineer specialized in HealthTech, Fitness SaaS and AI-powered fitness platforms.

Design and implement a professional production-ready Admin page for:

CALISHEALTH
Health-Tech & AI Platform

PAGE:
"Hồ sơ Thể chất Học viên"
English: "Student Fitness Profiles"

This page belongs to the Admin Dashboard of an AI-powered Calisthenics platform.

The goal of this page is NOT simply to display statistics.

It must act as a centralized Fitness Intelligence Dashboard where Admins and Coaches can monitor, analyze and understand the physical condition and progress of students based on:

1. Physical Assessments
2. Fitness scores
3. Workout performance
4. AI Motion Analysis
5. Coach evaluations
6. Historical progress
7. Reassessment schedules

The interface must feel like a premium HealthTech SaaS product.

Do NOT make it look like a generic fitness website.

It should look like a professional combination of:

- HealthTech dashboard
- Fitness analytics platform
- AI analytics system
- Modern SaaS admin dashboard

==================================================
1. TECHNOLOGY
==================================================

Build the frontend using:

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Lucide React icons
- Recharts for charts
- React Hook Form
- Zod
- TanStack Query
- TanStack Table
- date-fns

Use reusable components and a clean component architecture.

Do NOT create one giant component.

Use a scalable structure such as:

src/
 ├── components/
 │    ├── layout/
 │    ├── dashboard/
 │    ├── fitness/
 │    ├── charts/
 │    ├── tables/
 │    └── ui/
 │
 ├── pages/
 │    └── FitnessProfiles/
 │
 ├── hooks/
 ├── services/
 ├── types/
 ├── utils/
 └── data/

Prepare the frontend architecture so the mock data can later be replaced with REST APIs from a Java Spring Boot backend.

==================================================
2. VISUAL DESIGN SYSTEM
==================================================

Use the existing CalisHealth visual identity.

Primary visual style:

- Premium
- Clean
- Medical / HealthTech
- Athletic
- Minimal
- Data-driven
- Trustworthy
- Modern SaaS

Main colors:

Primary green:
#7C9B5B

Dark green:
#55733C

Very light green:
#EEF4E8

Background:
#F7F8F4

Card:
#FFFFFF

Primary text:
#172019

Secondary text:
#687268

Border:
#E3E7DF

Success:
#3FA56B

Warning:
#D99A35

Danger:
#D85B5B

Information:
#5B86C5

Use green as the primary brand accent.

Do NOT overuse green.

Use neutral colors for most UI elements and reserve green for:

- active navigation
- positive progress
- primary CTA
- selected filters
- healthy status

Use red only for important warnings or negative trends.

==================================================
3. GLOBAL ADMIN LAYOUT
==================================================

Maintain the existing CalisHealth Admin layout.

Desktop layout:

LEFT SIDEBAR
+
TOP HEADER
+
MAIN CONTENT AREA

Sidebar:

Width approximately 320px.

Keep the same structure as the existing CalisHealth Admin interface.

Sidebar sections:

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
  - Hồ sơ Thể chất ← ACTIVE
  - Tiến độ & Thành tích

Công nghệ AI & Motion

Kinh doanh & Báo cáo

Nội dung & Truyền thông

Hệ thống & Bảo mật

The active menu item must use the CalisHealth green background.

Top header:

- Sidebar collapse button
- Global search
- AI Vision status indicator
- "Xem App Học Viên"
- Notification icon
- Admin avatar

==================================================
4. PAGE HEADER
==================================================

Main content starts with:

Title:

"Hồ sơ Thể chất Học viên"

Subtitle:

"Theo dõi toàn diện sức mạnh, sức bền, mobility, core, thăng bằng và kỹ năng của học viên."

Badge:

"6 Chỉ số Thể chất"

Right side:

Button:

"← Về Dashboard"

Below the header add a subtle divider.

Do not make the header oversized.

Maintain strong typography hierarchy.

==================================================
5. KPI SECTION
==================================================

Create a 4-column KPI grid.

Card 1:

TỔNG HỒ SƠ

12,482

"11,936 hồ sơ đang hoạt động"

Icon:
Users

Card 2:

ĐIỂM THỂ CHẤT TRUNG BÌNH

64.2 / 100

"↑ 4.8% so với tháng trước"

Icon:
Activity

Card 3:

ĐANG TIẾN BỘ

8,421

"67.5% học viên"

Icon:
TrendingUp

Card 4:

CẦN ĐÁNH GIÁ LẠI

1,284

"10.3% tổng số học viên"

Icon:
CalendarClock

Each KPI card should contain:

- small uppercase label
- large number
- supporting information
- icon
- trend indicator

Use subtle hover animation.

Cards should NOT have excessive shadows.

Use:

border: 1px solid #E3E7DF

border-radius: 18px

==================================================
6. FILTER TOOLBAR
==================================================

Immediately below KPI cards create a professional filtering toolbar.

Left:

Search input:

"Tìm kiếm học viên..."

Right:

Filter buttons:

[Cấp độ]
[Mục tiêu]
[Trạng thái]
[Đánh giá]
[Khoảng thời gian]

Date range:

"01/09/2026 – 28/09/2026"

Button:

"Đặt lại"

Button:

"Xuất báo cáo"

Use dropdown/popover components from shadcn/ui.

Filters must be interactive.

When a filter is selected show a small active filter badge.

==================================================
7. FITNESS LEVEL DISTRIBUTION
==================================================

Create a two-column section.

LEFT:

Card title:

"Phân bố cấp độ thể lực"

Subtitle:

"Phân loại theo Fitness Score"

Use a donut chart.

Categories:

Beginner
42%

Intermediate
38%

Advanced
17%

Elite
3%

Center of donut:

12,482

"Học viên"

Beside chart show legend with:

- level
- number of students
- percentage

Example:

Beginner
5,242
42%

Intermediate
4,743
38%

Advanced
2,122
17%

Elite
375
3%

RIGHT:

Card:

"Fitness Dimensions"

Display 6 physical dimensions:

Strength
72 / 100
↑ 8.2%

Endurance
81 / 100
↑ 12.4%

Mobility
54 / 100
↑ 2.1%

Core
63 / 100
↑ 5.7%

Balance
58 / 100
↓ 1.2%

Skill
47 / 100
↑ 7.8%

Use horizontal progress bars.

Each row contains:

Dimension
Score
Trend
Progress bar

Use color carefully:

Positive:
green

Neutral:
gray

Negative:
red

==================================================
8. FITNESS PERFORMANCE RADAR
==================================================

Create a large card:

Title:

"Fitness Performance"

Subtitle:

"So sánh 6 chỉ số thể chất"

Use a Radar Chart.

Dimensions:

Strength
Endurance
Mobility
Core
Balance
Skill

Current values:

Strength 72
Endurance 81
Mobility 54
Core 63
Balance 58
Skill 47

Add a small dropdown:

[Overall Average ▼]

Options:

Overall Average
Beginner
Intermediate
Advanced
Last 30 Days
Last 90 Days

Chart must be clean and easy to understand.

Do not make the radar chart too colorful.

==================================================
9. FITNESS TREND
==================================================

Create another large analytics card.

Title:

"Xu hướng thể chất"

Subtitle:

"Thay đổi Fitness Score theo thời gian"

Use a Recharts Line Chart.

X-axis:

Jan
Feb
Mar
Apr
May
Jun
Jul
Aug
Sep

Y-axis:

0
20
40
60
80
100

Example data:

Jan 52
Feb 55
Mar 57
Apr 60
May 61
Jun 63
Jul 65
Aug 67
Sep 68

Add controls:

[Overall]
[Strength]
[Endurance]
[Mobility]
[Core]
[Balance]
[Skill]

Time range:

[30 ngày]
[90 ngày]
[6 tháng]
[1 năm]

Hovering over a point should show a tooltip.

==================================================
10. STRENGTHS AND WEAKNESSES
==================================================

Create two cards side by side.

LEFT:

"Điểm mạnh"

Display:

1. Endurance
81 / 100

2. Strength
72 / 100

3. Core
63 / 100

Each item should show:

rank
dimension
score
trend

RIGHT:

"Cần cải thiện"

Display:

1. Skill
47 / 100

2. Mobility
54 / 100

3. Balance
58 / 100

Use warning indicators.

Add CTA:

"Xem danh sách học viên"

==================================================
11. RECENT ASSESSMENTS
==================================================

Create a full-width table card.

Title:

"Đánh giá gần đây"

Button:

"Xem tất cả"

Columns:

Học viên
Assessment
Ngày đánh giá
Fitness Score
Level
Thay đổi
Trạng thái
Action

Example:

Nguyễn Minh Anh
Initial Assessment
26/09/2026
68
Intermediate
+7.2%
Completed

Trần Hoàng Nam
Reassessment
25/09/2026
74
Intermediate
+4.8%
Completed

Lê Thu Hà
Reassessment
23/09/2026
51
Beginner
-2.1%
Needs Attention

Use avatar initials.

Score should have visual status.

Actions:

View
More

More menu:

View Profile
View Assessment
View Progress
Schedule Reassessment

==================================================
12. FITNESS ALERTS
==================================================

Create a section:

"Fitness Alerts"

Display 3 alert cards.

Alert 1:

RED

"Đánh giá quá hạn"

428 học viên chưa hoàn thành assessment định kỳ.

CTA:

"Xem danh sách"

Alert 2:

YELLOW

"Mobility thấp"

1,284 học viên có Mobility Score < 50.

CTA:

"Phân tích"

Alert 3:

GREEN

"Tiến bộ tích cực"

3,421 học viên cải thiện Fitness Score > 10% trong 30 ngày.

CTA:

"Xem báo cáo"

Each alert should contain:

icon
title
description
number
CTA

==================================================
13. STUDENT FITNESS TABLE
==================================================

Create a separate section:

"Danh sách hồ sơ thể chất"

This should be a professional TanStack Table.

Columns:

Avatar
Student
Fitness Level
Overall Score
Strength
Endurance
Mobility
Core
Balance
Skill
Trend
Last Assessment
Next Assessment
Status
Actions

Provide:

Search

Column sorting

Pagination

Column visibility

Filters

Rows per page:

10
25
50
100

Example row:

Nguyễn Minh Anh

Intermediate

68

72

81

54

63

58

47

↑ 8.2%

26/09/2026

24/10/2026

Healthy

Action menu

==================================================
14. STUDENT PROFILE DRAWER
==================================================

When clicking a student row, open a large right-side drawer.

Do NOT navigate immediately.

Drawer width:

approximately 500–600px.

Header:

Avatar

Nguyễn Minh Anh

Intermediate

68 / 100

↑ 8.2%

Tabs:

Overview
Assessment
Progress
AI Motion
Coach Notes

Overview should contain:

Fitness Score

Radar Chart

6 dimensions

Strengths

Weaknesses

Last Assessment

Next Assessment

==================================================
15. STUDENT PROFILE DETAIL
==================================================

When clicking:

"Xem hồ sơ"

navigate to:

/admin/fitness-profiles/:studentId

Design the detail page.

Header:

Student avatar

Name

Fitness Level

Overall Fitness Score

Status

Last Assessment

Next Assessment

Actions:

"Đánh giá lại"

"Xem lịch tập"

"Thêm ghi chú"

Then tabs:

Overview
Assessment
Progress
Training
AI Motion
Coach Notes

==================================================
16. ASSESSMENT TAB
==================================================

Show assessment timeline.

Example:

Initial Assessment
01/08/2026
52 / 100

↓

Reassessment
29/08/2026
61 / 100
+9

↓

Reassessment
26/09/2026
68 / 100
+7

Each assessment card can be expanded.

Show:

Strength
Endurance
Mobility
Core
Balance
Skill

Also show:

Completed exercises
Assessment duration
Coach evaluation
AI evaluation

==================================================
17. PROGRESS TAB
==================================================

Create detailed progress analytics.

Show:

Starting Score
Current Score
Total Improvement

Example:

52 → 68

+30.7%

Then create 6 progress cards:

Strength
52 → 72
+38.4%

Endurance
60 → 81
+35%

Mobility
51 → 54
+5.8%

Core
48 → 63
+31.2%

Balance
55 → 58
+5.4%

Skill
31 → 47
+51.6%

Include a timeline chart.

==================================================
18. AI MOTION TAB
==================================================

This is a core CalisHealth feature.

Show:

AI Motion Performance

Form Score
87 / 100

Repetition Quality
91%

Range of Motion
84%

Tempo
89%

Stability
82%

Common Errors:

Shoulder Position
12%

Hip Alignment
8%

Insufficient Depth
6%

Then show:

AI Motion Progress

Week 1
71

Week 2
76

Week 3
82

Week 4
87

Use a line chart.

==================================================
19. COACH NOTES
==================================================

Create a professional notes interface.

Button:

"+ Thêm ghi chú"

Each note:

Coach avatar
Coach name
Date
Note content
Tags

Example:

"Core control đã cải thiện rõ.
Cần tập trung thêm vào shoulder mobility."

Tags:

Mobility
Core
Technique

Allow:

Edit
Delete
Pin

==================================================
20. EMPTY STATES
==================================================

Create professional empty states.

If no fitness profile:

Icon

"Chưa có hồ sơ thể chất"

"Hoàn thành bài đánh giá đầu tiên để tạo hồ sơ."

Button:

"Xem bài test"

If no assessments:

"Chưa có dữ liệu đánh giá"

If no search results:

"Không tìm thấy học viên"

"Thử thay đổi bộ lọc hoặc từ khóa."

==================================================
21. LOADING STATES
==================================================

Do NOT show blank white screens.

Use Skeleton loaders for:

KPI cards
Charts
Tables
Student profile drawer

Example:

Skeleton cards with subtle animation.

==================================================
22. ERROR STATES
==================================================

Create professional error UI.

Example:

"Không thể tải dữ liệu hồ sơ thể chất."

Button:

"Thử lại"

Do not expose technical errors to the user.

==================================================
23. RESPONSIVE DESIGN
==================================================

Desktop first.

Target:

1440px
1280px
1024px
768px
390px

At desktop:

Sidebar visible.

At tablet:

Sidebar collapses.

At mobile:

Use bottom navigation or hamburger menu.

Cards become one column.

Tables become horizontally scrollable or transform into mobile cards.

Charts remain readable.

Never allow important information to overflow.

==================================================
24. MICRO INTERACTIONS
==================================================

Add subtle professional animations.

Examples:

Card hover:
translateY(-2px)

Buttons:
smooth hover

Sidebar:
smooth transition

Drawer:
slide from right

Charts:
smooth entry animation

Progress bars:
animated on mount

Do NOT use excessive animations.

The product should feel professional, not playful.

==================================================
25. ACCESSIBILITY
==================================================

Follow accessibility best practices.

Requirements:

- semantic HTML
- keyboard navigation
- visible focus states
- accessible labels
- sufficient contrast
- tooltips for icons
- aria-labels
- keyboard accessible dropdowns
- keyboard accessible tables

Do not rely only on color to communicate status.

For example:

Positive:
↑ +8.2%

Negative:
↓ -1.2%

==================================================
26. DATA ARCHITECTURE
==================================================

Use TypeScript interfaces.

Create:

FitnessProfile

Student

FitnessDimension

Assessment

AssessmentResult

FitnessProgress

MotionAnalysis

CoachNote

FitnessAlert

Example:

interface FitnessProfile {
  id: string;
  studentId: string;
  overallScore: number;
  level: FitnessLevel;
  strength: number;
  endurance: number;
  mobility: number;
  core: number;
  balance: number;
  skill: number;
  lastAssessmentDate: string;
  nextAssessmentDate: string;
  trend: number;
}

enum FitnessLevel {
  BEGINNER = "Beginner",
  INTERMEDIATE = "Intermediate",
  ADVANCED = "Advanced",
  ELITE = "Elite"
}

==================================================
27. MOCK DATA
==================================================

Generate realistic mock data.

Do NOT use random meaningless data.

Use Vietnamese student names.

Example:

Nguyễn Minh Anh
Trần Hoàng Nam
Lê Thu Hà
Phạm Gia Huy
Võ Minh Khôi
Đặng Ngọc Mai

Create at least:

- 20 students
- 10 assessments
- 30 progress records
- 10 AI Motion records
- 10 coach notes

Data must be internally consistent.

==================================================
28. BACKEND API PREPARATION
==================================================

Prepare service functions for future Spring Boot integration.

Example:

GET /api/admin/fitness-profiles

GET /api/admin/fitness-profiles/{id}

GET /api/admin/fitness-profiles/statistics

GET /api/admin/fitness-profiles/trends

GET /api/admin/fitness-profiles/distribution

GET /api/admin/fitness-profiles/{id}/assessments

GET /api/admin/fitness-profiles/{id}/progress

GET /api/admin/fitness-profiles/{id}/motion-analysis

GET /api/admin/fitness-profiles/{id}/coach-notes

POST /api/admin/fitness-profiles/{id}/reassessment

POST /api/admin/fitness-profiles/{id}/notes

Do not hard-code API calls directly inside UI components.

Use services + TanStack Query.

==================================================
29. IMPORTANT UX PRINCIPLES
==================================================

The page must answer these questions immediately:

1. How many student fitness profiles exist?

2. What is the average physical condition?

3. Are students improving?

4. Which fitness dimensions are strongest?

5. Which dimensions are weakest?

6. How are fitness levels distributed?

7. Who needs reassessment?

8. Which students are declining?

9. Which students are improving rapidly?

10. What does AI Motion Analysis indicate?

11. What should the Coach/Admin do next?

The interface should prioritize:

DATA → INSIGHT → ACTION

Not simply:

DATA → DATA → DATA.

==================================================
30. FINAL VISUAL RESULT
==================================================

The final page should feel like:

"CalisHealth Fitness Intelligence Center"

rather than a normal CRUD admin page.

Use:

- generous whitespace
- clean cards
- strong typography
- subtle borders
- soft rounded corners
- professional charts
- restrained green accent
- clear data hierarchy
- minimal shadows
- polished empty/loading/error states

Avoid:

- excessive gradients
- excessive shadows
- excessive rounded pills
- too many colors
- giant headings
- crowded dashboards
- unnecessary decorative elements
- generic Bootstrap appearance
- childish fitness aesthetics

The final result should be comparable to a premium HealthTech SaaS product.

==================================================
31. MOST IMPORTANT REQUIREMENT
==================================================

Do not create the entire interface as a static mockup.

Build reusable, interactive React components.

Interactions that MUST work:

- Search students
- Filter students
- Sort table
- Pagination
- Change chart timeframe
- Change fitness dimension
- Open student profile drawer
- Open full student profile
- Switch tabs
- View assessment
- View progress
- View AI Motion
- Add coach note
- Edit coach note
- Delete coach note
- Schedule reassessment
- Export report button UI
- Reset filters

Use mock data initially but structure everything so it can later connect directly to a Java Spring Boot REST API and MySQL backend.