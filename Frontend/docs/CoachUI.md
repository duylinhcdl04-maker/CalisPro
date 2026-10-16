Bạn hãy đóng vai:

- Senior Product Designer
- Senior UX/UI Designer
- Senior Frontend Architect
- Senior React Developer
- Fitness/HealthTech Product Analyst
- System Analyst

Tôi đang xây dựng hệ thống CALISHEALTH – nền tảng HealthTech & AI dành cho Calisthenics.

CALISHEALTH có 3 nhóm người dùng chính:

1. USER / HỌC VIÊN
2. COACH / HUẤN LUYỆN VIÊN
3. ADMIN / QUẢN TRỊ VIÊN

Tôi hiện đang xây dựng FRONTEND cho khu vực COACH.

====================================================
I. TECH STACK
====================================================

Frontend:

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Lucide React Icons
- React Router
- TanStack Query
- React Hook Form
- Zod
- Recharts
- date-fns

Nếu cần drag & drop:

- dnd-kit

Nếu cần bảng dữ liệu:

- TanStack Table

Không sử dụng thư viện UI khác nếu không thực sự cần thiết.

Backend trong hệ thống cuối cùng:

- Java Spring Boot
- REST API
- MySQL

Hiện tại frontend có thể sử dụng MOCK DATA / MOCK API,
nhưng phải thiết kế architecture sao cho sau này thay mock API bằng REST API của Spring Boot mà không phải viết lại UI.

====================================================
II. PRODUCT CONTEXT
====================================================

CalisHealth là nền tảng Calisthenics có:

- Exercise Library
- Workout Plans
- Workout Sessions
- Fitness Assessment
- Fitness Profile
- Progress & Performance
- AI Motion Analysis
- AI Coaching
- Achievement / PR
- Subscription
- Notification
- Content Management

AI Motion Analysis sử dụng dữ liệu body landmarks để phân tích form tập luyện.

Ví dụ:

Push Up:

- Shoulder angle
- Elbow angle
- Body alignment
- Depth
- Tempo
- Scapular control
- Repetition count

AI có thể trả về:

- Rep count
- Valid reps
- Invalid reps
- Form score
- Error detection
- Coaching recommendation

Coach sử dụng dữ liệu AI để đưa ra quyết định huấn luyện.

====================================================
III. MỤC TIÊU CỦA COACH DASHBOARD
====================================================

Coach Dashboard KHÔNG phải là phiên bản thu nhỏ của Admin Dashboard.

Admin quản lý:

- System
- Users
- Subscription
- Content
- Revenue
- AI configuration
- Security

Coach quản lý:

- Students
- Training
- Assessment
- Workout Plans
- AI Analysis
- Progress
- Feedback
- Communication

Triết lý thiết kế:

"Coach cần nhìn thấy học viên nào cần được quan tâm,
hiểu vấn đề của họ và nhanh chóng đưa ra hành động."

Do đó toàn bộ UX phải hướng tới:

MONITOR
→ ANALYZE
→ DECIDE
→ COACH
→ TRACK

====================================================
IV. COACH SIDEBAR
====================================================

Thiết kế sidebar:

CALISHEALTH
COACH

1. Tổng quan
2. Học viên
3. Đánh giá thể chất
4. Giáo án & Lộ trình
5. Phiên tập luyện
6. AI Coaching & Motion
7. Tiến độ & Thành tích
8. Tin nhắn
9. Thông báo
10. Lịch làm việc

Bottom:

- Hồ sơ Coach
- Cài đặt
- Đăng xuất

Sidebar phải:

- Collapsible
- Responsive
- Có active state
- Có icon
- Có badge khi cần
- Có tooltip khi collapsed

Không làm sidebar quá màu mè.

====================================================
V. DESIGN SYSTEM
====================================================

Phong cách:

- Premium
- Modern
- HealthTech
- Fitness Technology
- Clean
- Professional
- Data-driven
- Human-centered

Không thiết kế theo phong cách gaming.

Không sử dụng quá nhiều gradient.

Không dùng quá nhiều màu.

Màu chủ đạo:

- Olive / muted green
- Dark green
- White
- Warm gray
- Soft gray

Semantic colors:

- Green = success
- Amber = warning
- Red = critical
- Blue = information

UI:

- Rounded cards
- Subtle border
- Soft shadow
- Good whitespace
- Clear typography hierarchy
- Large readable numbers
- Data visualization dễ đọc

====================================================
VI. GLOBAL LAYOUT
====================================================

Desktop layout:

┌──────────────────────────────────────────────┐
│ Sidebar │ Topbar                             │
│         ├────────────────────────────────────┤
│         │                                    │
│         │ Main Content                       │
│         │                                    │
│         │                                    │
│         │                                    │
└──────────────────────────────────────────────┘

Topbar:

- Global search
- Notifications
- AI system status
- Quick action
- Coach avatar
- Profile menu

Không nhồi quá nhiều thông tin vào topbar.

====================================================
VII. TRANG 1 — COACH DASHBOARD
====================================================

Route:

/coach/dashboard

Mục tiêu:

Coach mở trang này phải biết trong vòng 5–10 giây:

- Có bao nhiêu học viên
- Hôm nay có gì
- Ai cần chú ý
- Ai vừa đạt thành tích
- Assessment nào sắp đến hạn
- Workout nào cần review

--------------------------------------------------
A. HEADER
--------------------------------------------------

Hiển thị:

Good morning, Coach [Name]

"Here's your coaching overview for today."

Actions:

[View Schedule]
[Add Note]

--------------------------------------------------
B. KPI CARDS
--------------------------------------------------

4 cards:

1. Total Students
2. Active Students
3. Students Need Attention
4. Assessments Due

Ví dụ:

48
Active Students

32
Training This Week

6
Need Attention

8
Assessments Due

Các KPI phải có:

- Main value
- Description
- Trend nếu có
- Status indicator

--------------------------------------------------
C. TODAY'S SCHEDULE
--------------------------------------------------

Timeline:

09:00
Assessment
Nguyễn Minh Anh

10:30
Workout Review
Trần B

14:00
Progress Review
Lê C

Có status:

Upcoming
In Progress
Completed
Cancelled

--------------------------------------------------
D. NEEDS ATTENTION
--------------------------------------------------

Đây là khu vực quan trọng nhất.

Các alert:

- Student inactive > X days
- Performance decreased
- Form score decreased
- Assessment overdue
- Subscription issue nếu Coach được phép xem
- Injury/limitation note nếu có
- Workout adherence low

Ví dụ:

⚠ Nguyễn A
Form score dropped from 87 → 71

⚠ Trần B
No workout for 6 days

⚠ Lê C
Assessment overdue by 3 days

Click vào alert phải dẫn đến Student Detail.

--------------------------------------------------
E. RECENT ACHIEVEMENTS
--------------------------------------------------

Hiển thị:

- New PR
- New streak
- Level up
- Challenge completed

--------------------------------------------------
F. RECENT WORKOUTS
--------------------------------------------------

Hiển thị:

Student
Workout
Completion
Form Score
Duration
Date

====================================================
VIII. TRANG 2 — STUDENTS
====================================================

Route:

/coach/students

Mục tiêu:

Coach quản lý toàn bộ học viên được phân công.

--------------------------------------------------
A. SEARCH
--------------------------------------------------

Search:

- Name
- Email
- Student ID

--------------------------------------------------
B. FILTER
--------------------------------------------------

Filters:

- Level
- Goal
- Status
- Training frequency
- Performance
- Last active
- Needs attention

--------------------------------------------------
C. STUDENT TABLE
--------------------------------------------------

Columns:

Avatar
Student
Level
Goal
Fitness Score
Streak
Adherence
Last Workout
Status
Actions

Không hiển thị quá nhiều column trên desktop.

Cho phép:

- Column visibility
- Sorting
- Pagination

--------------------------------------------------
D. BULK ACTION
--------------------------------------------------

Nếu cần:

- Assign coach
- Send reminder
- Add tag

Nhưng không over-engineer MVP.

====================================================
IX. TRANG 3 — STUDENT DETAIL
====================================================

Route:

/coach/students/:studentId

Đây là một trong những màn hình QUAN TRỌNG NHẤT.

Header:

Avatar
Name
Level
Goal
Status

Actions:

[Message]
[Create Workout Plan]
[Add Note]

Tabs:

Overview
Assessment
Workout
Progress
AI Analysis
Coach Notes

--------------------------------------------------
OVERVIEW
--------------------------------------------------

Profile:

Age
Height
Weight
Training Experience
Goal
Fitness Level

Fitness Score:

Strength
Endurance
Mobility
Core
Balance

Overall score.

--------------------------------------------------
CURRENT PLAN
--------------------------------------------------

Current plan:

Plan name
Week
Progress
Sessions completed
Adherence

--------------------------------------------------
RECENT PERFORMANCE
--------------------------------------------------

Chart:

Fitness score over time.

--------------------------------------------------
COACH NOTES
--------------------------------------------------

Latest notes.

--------------------------------------------------
AI INSIGHTS
--------------------------------------------------

Ví dụ:

AI detected:

- Elbow flare
- Reduced depth
- Tempo inconsistency

Coach có thể xem nhưng không sửa AI rule ở đây.

====================================================
X. TRANG 4 — FITNESS ASSESSMENT
====================================================

Route:

/coach/assessments

Hiển thị:

Upcoming
Due
Completed
Needs Review

Table:

Student
Assessment
Due Date
Overall Score
Status
Action

--------------------------------------------------
ASSESSMENT DETAIL
--------------------------------------------------

/coach/assessments/:assessmentId

Hiển thị:

Assessment overview

6 fitness metrics:

Strength
Endurance
Mobility
Core
Balance
Overall

So sánh:

Previous
Current
Change

Ví dụ:

Strength
72 → 81
+9

Mobility
69 → 64
-5

Coach Recommendation:

- Improve shoulder mobility
- Maintain current strength volume
- Reduce progression difficulty

Coach có thể thêm:

"Coach Comment"

====================================================
XI. TRANG 5 — WORKOUT PLAN BUILDER
====================================================

Route:

/coach/plans

Đây là màn hình rất quan trọng.

Coach có thể:

- Create Plan
- Edit Plan
- Duplicate Plan
- Assign Plan
- Pause Plan
- Archive Plan

--------------------------------------------------
PLAN BUILDER
--------------------------------------------------

Header:

Plan Name
Student
Goal
Level
Duration
Frequency

Ví dụ:

8 Week Strength Program

--------------------------------------------------
WEEK STRUCTURE
--------------------------------------------------

Week 1

Monday
Push Strength

Tuesday
Rest

Wednesday
Pull Strength

Friday
Core

Sunday
Mobility

Cho phép drag & drop.

--------------------------------------------------
SESSION BUILDER
--------------------------------------------------

Exercise card:

Push Up

Sets: 4
Reps: 10
Rest: 90 sec
Tempo: 2-0-1-0
Intensity: Moderate

Coach có thể:

Edit
Duplicate
Remove

--------------------------------------------------
EXERCISE SELECTOR
--------------------------------------------------

Search exercise.

Filter:

- Muscle
- Equipment
- Difficulty
- Movement pattern

Exercise preview:

Image/Video
Target muscles
Difficulty
Instructions
AI analysis availability

====================================================
XII. TRANG 6 — WORKOUT SESSIONS
====================================================

Route:

/coach/sessions

Hiển thị tất cả session của học viên.

Table:

Student
Workout
Duration
Completion
Form Score
Valid Reps
Date
Status

Click:

/coach/sessions/:sessionId

--------------------------------------------------
SESSION DETAIL
--------------------------------------------------

Workout summary.

Exercise results.

Example:

Push Up

Target:
4 × 10

Actual:

10
10
9
8

Form Score:
84

Valid Reps:
31

Invalid:
6

Coach Feedback:

[Add feedback]

====================================================
XIII. TRANG 7 — AI COACHING & MOTION
====================================================

Route:

/coach/ai-analysis

Mục tiêu:

Coach xem những insight mà AI phát hiện.

Dashboard:

AI analyzed sessions
Average form score
Invalid rep rate
Common errors
Students needing review

--------------------------------------------------
ANALYSIS DETAIL
--------------------------------------------------

Exercise:

Push Up

AI Score:
84 / 100

Reps:
37

Valid:
31

Invalid:
6

Form Breakdown:

Body Alignment
91

Elbow Position
86

Depth
78

Tempo
89

Scapular Control
76

--------------------------------------------------
AI OBSERVATION
--------------------------------------------------

"6 repetitions show excessive elbow flare."

Potential issue:

Shoulder positioning.

Recommendation:

"Keep elbows slightly closer to the torso."

--------------------------------------------------
COACH ACTION
--------------------------------------------------

Buttons:

[Accept Recommendation]

[Add Coach Feedback]

[Mark as Reviewed]

AI chỉ đưa recommendation.

Coach là người đưa quyết định cuối cùng.

====================================================
XIV. TRANG 8 — PROGRESS & PERFORMANCE
====================================================

Route:

/coach/performance

Có thể filter:

Student
Time range
Metric

Charts:

Fitness Score
Strength
Endurance
Mobility
Core
Balance

--------------------------------------------------
PERSONAL RECORD
--------------------------------------------------

Push Up
32 reps

Pull Up
12 reps

Dips
18 reps

Plank
03:42

--------------------------------------------------
ADHERENCE
--------------------------------------------------

Training frequency

Sessions planned
Sessions completed

Adherence %

Streak

====================================================
XV. TRANG 9 — MESSAGES
====================================================

Route:

/coach/messages

Layout:

Left:

Conversation list

Right:

Chat window

Student can send:

- Text
- Workout question
- Assessment question

Coach can send:

- Text
- Feedback
- Workout Plan
- Recommendation

Không xây dựng hệ thống chat quá phức tạp ở MVP.

====================================================
XVI. TRANG 10 — NOTIFICATIONS
====================================================

Route:

/coach/notifications

Types:

Student
Assessment
Workout
AI
Achievement
System

Ví dụ:

New PR
Assessment due
Student needs review
Workout completed

Có:

Mark as read
Mark all as read

====================================================
XVII. TRANG 11 — CALENDAR
====================================================

Route:

/coach/calendar

Views:

Month
Week
Day

Events:

Assessment
Workout Review
Progress Review
Coaching Session

Có:

Create event
Edit event
Cancel event

====================================================
XVIII. COACH PROFILE
====================================================

Route:

/coach/profile

Thông tin:

Name
Avatar
Bio
Specialization
Experience
Certification
Assigned students

Settings:

Notification preferences
Availability
Password
Security

====================================================
XIX. RESPONSIVE DESIGN
====================================================

Desktop:

Primary experience.

Tablet:

Sidebar collapses.

Mobile:

Không cố nhồi toàn bộ dashboard vào mobile.

Ưu tiên:

- Students
- Student Detail
- Workout
- Notifications
- Messages

Tables phải chuyển thành card/list khi màn hình nhỏ.

====================================================
XX. COMPONENT ARCHITECTURE
====================================================

Không viết tất cả trong một file.

Tạo reusable components:

components/
    layout/
    sidebar/
    topbar/
    cards/
    charts/
    tables/
    students/
    assessments/
    workouts/
    ai/
    notifications/
    messages/

Ví dụ:

StudentCard
StudentTable
StudentStatusBadge

FitnessMetricCard
FitnessRadarChart
ProgressLineChart

WorkoutCard
ExerciseCard
WorkoutBuilder

AIInsightCard
FormScoreCard
MotionErrorCard

AssessmentCard
AssessmentComparison

NotificationItem
NotificationBadge

====================================================
XXI. DATA ARCHITECTURE
====================================================

Tạo TypeScript interfaces trước.

Ví dụ:

Student
Coach
FitnessProfile
Assessment
WorkoutPlan
WorkoutSession
Exercise
AIAnalysis
Achievement
Notification
CoachNote

Không dùng:

any

nếu không thật sự bắt buộc.

Mock data phải tuân theo TypeScript interface.

====================================================
XXII. API ARCHITECTURE
====================================================

Tuy hiện tại dùng mock data nhưng code phải chuẩn bị cho Spring Boot API.

Tạo:

services/
    studentService.ts
    assessmentService.ts
    workoutService.ts
    performanceService.ts
    aiService.ts
    notificationService.ts

Không fetch API trực tiếp bên trong component.

Ví dụ KHÔNG làm:

useEffect(() => {
  fetch(...)
}, [])

trực tiếp trong UI component.

Thay vào đó:

const { data } = useStudents();

hoặc:

studentService.getStudents()

====================================================
XXIII. STATE MANAGEMENT
====================================================

Phân biệt:

Server State:
TanStack Query

Local UI State:
useState

Form State:
React Hook Form

Không sử dụng Redux nếu chưa có nhu cầu thực tế.

====================================================
XXIV. ROUTING
====================================================

Tạo routes rõ ràng:

/coach/dashboard

/coach/students
/coach/students/:studentId

/coach/assessments
/coach/assessments/:assessmentId

/coach/plans
/coach/plans/new
/coach/plans/:planId

/coach/sessions
/coach/sessions/:sessionId

/coach/ai-analysis
/coach/ai-analysis/:analysisId

/coach/performance

/coach/messages

/coach/notifications

/coach/calendar

/coach/profile

====================================================
XXV. ROLE BASED ACCESS
====================================================

Coach chỉ được truy cập:

/coach/*

Không cho Coach truy cập:

/admin/*

Nếu backend chưa có authentication thật:

Tạo mock auth layer.

Nhưng không hard-code quyền trong từng component.

Tạo:

useAuth()

hasRole()

ProtectedRoute

====================================================
XXVI. UX STATES
====================================================

Mỗi trang phải xử lý đầy đủ:

Loading
Empty
Error
Success

Ví dụ:

Loading:

Skeleton

Empty:

"No students found"

Error:

"Unable to load students."

Success:

Toast.

Không để màn hình trắng khi API chưa có data.

====================================================
XXVII. FORM VALIDATION
====================================================

Tất cả form phải có:

- Required
- Min/max
- Correct type
- Error message
- Loading state
- Disabled state
- Success feedback

Sử dụng:

React Hook Form
+
Zod

Không validate thủ công lung tung trong component.

====================================================
XXVIII. UX PRINCIPLES
====================================================

1. Coach phải thực hiện action quan trọng trong ≤ 3 clicks.

2. Không hiển thị quá nhiều data cùng lúc.

3. Data quan trọng phải nổi bật.

4. AI insight phải dễ hiểu.

5. Không sử dụng thuật ngữ AI quá kỹ thuật.

6. Không biến dashboard thành spreadsheet.

7. Không dùng chart nếu chart không giúp đưa ra quyết định.

8. Mọi warning phải dẫn đến action.

Ví dụ:

"3 students need attention"

→ Click
→ Danh sách 3 học viên.

====================================================
XXIX. AI CODING RULES — CỰC KỲ QUAN TRỌNG
====================================================

Khi code, TUYỆT ĐỐI KHÔNG:

1. Viết toàn bộ ứng dụng vào một file.

2. Tạo component 1000+ dòng.

3. Hard-code dữ liệu trực tiếp vào JSX quá nhiều.

4. Dùng any.

5. Lặp lại component giống nhau.

6. Fetch API trực tiếp trong UI component.

7. Hard-code URL API.

8. Hard-code role logic ở nhiều nơi.

9. Tạo mock data không có TypeScript type.

10. Cài thêm thư viện nếu thư viện hiện tại đã giải quyết được vấn đề.

11. Thay đổi toàn bộ architecture khi sửa một feature.

12. Xóa code hiện tại nếu chưa hiểu architecture.

13. Tạo fake AI logic rồi gọi đó là AI thật.

14. Tạo fake payment/subscription logic.

15. Đưa business logic vào UI.

====================================================
XXX. MOCK DATA RULE
====================================================

Trong giai đoạn frontend:

ĐƯỢC sử dụng mock data.

Nhưng mock data phải realistic.

Ví dụ:

Student:

{
 id,
 name,
 avatar,
 level,
 goal,
 fitnessScore,
 streak,
 adherence,
 lastWorkout,
 status
}

Không sử dụng:

John Doe
Jane Doe

nếu không cần.

Dữ liệu phải phù hợp với ngữ cảnh Calisthenics.

====================================================
XXXI. AI MOTION DATA
====================================================

AI analysis phải được mô phỏng theo cấu trúc gần với backend thực tế.

Ví dụ:

{
 sessionId,
 exerciseId,
 totalReps,
 validReps,
 invalidReps,
 formScore,
 metrics: {
   alignment,
   elbowPosition,
   depth,
   tempo,
   scapularControl
 },
 errors: [],
 recommendations: []
}

Không hard-code:

"84"

ở hàng chục component khác nhau.

====================================================
XXXII. ACCESSIBILITY
====================================================

Đảm bảo:

- Semantic HTML
- Keyboard navigation
- Focus state
- aria-label
- Contrast
- Button không chỉ có icon
- Tooltip cho icon-only button

====================================================
XXXIII. PERFORMANCE
====================================================

Không render chart/table nặng nếu chưa cần.

Sử dụng:

- Lazy loading routes
- Memoization khi thực sự cần
- Pagination
- Query caching
- Debounce search

Không tối ưu premature.

====================================================
XXXIV. FINAL UI QUALITY
====================================================

Giao diện cuối cùng phải có cảm giác:

"Professional HealthTech Coaching Platform"

Không giống:

- Admin template
- E-commerce dashboard
- Gaming dashboard
- Crypto dashboard

Phải giống một hệ thống mà một Coach thực sự có thể sử dụng hàng ngày.

====================================================
XXXV. DEVELOPMENT PROCESS
====================================================

KHÔNG code toàn bộ một lần.

Hãy triển khai theo từng phase.

PHASE 1:

- Project structure
- Design system
- Layout
- Sidebar
- Topbar
- Routing
- Mock auth

PHASE 2:

- Coach Dashboard
- Students
- Student Detail

PHASE 3:

- Assessment
- Fitness Profile
- Progress

PHASE 4:

- Workout Plan Builder
- Exercise Library integration

PHASE 5:

- Workout Session
- AI Motion Analysis

PHASE 6:

- Messages
- Notifications
- Calendar

PHASE 7:

- API integration preparation
- Error handling
- Loading states
- Responsive
- Accessibility

====================================================
XXXVI. IMPORTANT
====================================================

Trước khi code mỗi phase:

1. Phân tích requirement.
2. Xác định component cần tạo.
3. Xác định data model.
4. Xác định route.
5. Xác định state.
6. Xác định reusable components.
7. Sau đó mới code.

Sau mỗi phase:

- Kiểm tra TypeScript
- Kiểm tra lint
- Kiểm tra build
- Kiểm tra responsive
- Kiểm tra routing
- Kiểm tra console errors

Không tự ý chuyển sang phase tiếp theo nếu phase hiện tại chưa ổn định.

====================================================
XXXVII. OUTPUT MONG MUỐN
====================================================

Đầu tiên hãy phân tích toàn bộ yêu cầu.

Sau đó cung cấp:

1. Information Architecture
2. Sitemap
3. User Flow của Coach
4. Sidebar Architecture
5. Dashboard Layout
6. Page-by-page Specification
7. Component Architecture
8. Data Model
9. TypeScript Interfaces
10. Route Structure
11. Mock API Architecture
12. State Management
13. Permission Model
14. Responsive Strategy
15. Design System
16. Development Roadmap

Sau khi hoàn thành phần phân tích mới bắt đầu code.

Nếu có điểm nào chưa rõ:    

- Không tự ý tạo business rule quan trọng.
- Đưa ra assumption rõ ràng.
- Ưu tiên architecture có thể mở rộng.