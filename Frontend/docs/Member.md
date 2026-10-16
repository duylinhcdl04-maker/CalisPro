You are a Senior Product Designer, UX/UI Designer, SaaS Product Architect and Frontend Engineer specializing in:

- HealthTech
- Fitness SaaS
- Subscription Management
- Payment Systems
- Revenue Analytics
- AI-powered Fitness Platforms
- Enterprise Admin Dashboard

You are designing a production-ready Admin Dashboard for:

CALISHEALTH
Health-Tech & AI Platform

============================================================
1. PAGE INFORMATION
============================================================

Page name:

"Quản lý Gói Hội viên & Doanh thu"

English:

"Subscription & Revenue Management"

This page belongs to:

"Kinh doanh & Báo cáo"

inside the CalisHealth Admin Dashboard.

The purpose of this page is NOT simply to manage subscription plans.

It must function as:

"CALISHEALTH SUBSCRIPTION & REVENUE CONTROL CENTER"

The Admin should be able to understand:

1. How many active subscribers exist?
2. Which plans are most popular?
3. How much recurring revenue is generated?
4. How much revenue was generated this month?
5. How many users are currently on trial?
6. How many users convert from Trial → Paid?
7. Which subscription plan generates the most revenue?
8. How many subscriptions are renewing?
9. How many users cancel?
10. What is the churn rate?
11. Which payments failed?
12. Which subscriptions are expiring?
13. Which users are about to renew?
14. What features does each plan provide?
15. How can Admin create/edit/configure plans?

The page must combine:

SUBSCRIPTION MANAGEMENT
+
REVENUE ANALYTICS
+
CUSTOMER LIFECYCLE
+
PAYMENT MONITORING
+
PLAN CONFIGURATION

============================================================
2. BUSINESS MODEL
============================================================

CalisHealth has the following subscription plans.

------------------------------------------------------------
PLAN 01
------------------------------------------------------------

CALIS FREE TRIAL

Duration:
7 days

Price:
0 VND

Purpose:
Free Trial

Features:

Basic Exercises
✓

Advanced Exercises
✕

Exercise Library
Limited

Personalized Workout
Limited

Periodic Assessment
✓

AI Coach
✕

AI Motion Analysis
Limited

Progress Tracking
✓

After 7 days:

Trial expires unless user subscribes to a paid plan.

IMPORTANT:

Treat this as:

FREE TRIAL

not a permanent FREE subscription.

------------------------------------------------------------
PLAN 02
------------------------------------------------------------

CALIS PRO

Price:

199,000 VND / month

Features:

Basic Exercises
✓

Intermediate Exercises
✓

Advanced Exercises
✓

Full Exercise Library
✓

Personalized Workout
✓

Periodic Assessment
✓

AI Coach
✕

AI Motion Analysis
Based on configured limits

Progress Tracking
✓

------------------------------------------------------------
PLAN 03
------------------------------------------------------------

CALIS PREMIUM

Price:

299,000 VND / month

Features:

Basic Exercises
✓

Intermediate Exercises
✓

Advanced Exercises
✓

Full Exercise Library
✓

Personalized Workout
✓

Periodic Assessment
✓

AI Coach
✓

AI Motion Analysis
✓

Progress Tracking
✓

------------------------------------------------------------
PLAN 04
------------------------------------------------------------

CALIS PREMIUM ANNUAL

Price:

1,199,000 VND / year

Includes:

Full Exercise Library
✓

Basic → Advanced
✓

Personalized Workout
✓

Periodic Assessment
✓

AI Coach
✓

AI Motion Analysis
✓

Progress Tracking
✓

Annual billing.

Compared with:

299,000 × 12
=
3,588,000 VND

Annual price:

1,199,000 VND

Display:

"Tiết kiệm 2,389,000đ / năm"

and:

"Tiết kiệm ~66.6%"

============================================================
3. IMPORTANT BUSINESS RULE
============================================================

Subscription lifecycle:

USER REGISTER
        ↓
FREE TRIAL – 7 DAYS
        ↓
TRIAL ACTIVE
        ↓
TRIAL EXPIRING
        ↓
       ┌────────────────┐
       │                │
       ↓                ↓
   CONVERT          EXPIRE
       │                │
       ↓                ↓
     PAID             EXPIRED
       │
       ↓
   ACTIVE
       │
       ├───────────────┐
       ↓               ↓
    RENEW           CANCEL
       │               │
       ↓               ↓
    ACTIVE         CANCELLED
                       │
                       ↓
                    EXPIRED

Payment lifecycle:

PENDING
↓
SUCCESS
↓
REFUNDED

or:

PENDING
↓
FAILED

Subscription status:

TRIAL
ACTIVE
PAST_DUE
GRACE_PERIOD
CANCELLED
EXPIRED

IMPORTANT:

"CANCELLED" does NOT necessarily mean immediately expired.

If a user cancels auto-renewal:

Subscription remains ACTIVE
until the end of the paid period.

============================================================
4. TECHNOLOGY
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

Architecture must be prepared for:

Java Spring Boot REST API
+
MySQL

Use realistic mock data initially.

Mock data must follow future API structures.

Do not put business logic directly inside UI components.

============================================================
5. VISUAL DESIGN SYSTEM
============================================================

Maintain the existing CalisHealth Admin visual identity.

Reference style:

Premium HealthTech SaaS
Modern
Clean
Professional
Data-driven
Minimal
Trustworthy
Enterprise

Primary brand:

#7C9B5B

Dark Green:

#55733C

Light Green:

#EEF4E8

Background:

#F7F8F4

Card:

#FFFFFF

Text:

#172019

Secondary:

#687268

Border:

#E3E7DF

Success:

#3FA56B

Warning:

#D99A35

Danger:

#D85B5B

Info:

#5B86C5

Use green mainly for:

- Active states
- Positive growth
- Success
- Primary CTA
- Selected navigation
- Healthy subscription status

Do NOT make the entire dashboard green.

Avoid:

- excessive gradients
- excessive shadows
- overly colorful charts
- gaming aesthetics
- crypto dashboard aesthetics
- generic Bootstrap dashboard appearance

Use:

border-radius: 18px

subtle shadows

thin borders

generous whitespace

strong typography hierarchy

============================================================
6. GLOBAL ADMIN LAYOUT
============================================================

Keep the existing CalisHealth layout.

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

Đánh giá & Thể chất

Công nghệ AI & Motion

Kinh doanh & Báo cáo
    - Gói Hội viên & Doanh thu ← ACTIVE
    - Phân tích & Báo cáo

Nội dung & Truyền thông

Hệ thống & Bảo mật

Active item:

"Gói Hội viên & Doanh thu"

Use:

green background
strong typography
appropriate icon

============================================================
7. TOP HEADER
============================================================

Header:

Sidebar toggle

Global search:

"Tìm kiếm dữ liệu..."

Shortcut:

⌘ K

Right side:

"AI Vision: 99.9% Online"

"Xem App Học Viên"

Notification

Admin avatar

Keep the same header style as existing CalisHealth pages.

============================================================
8. PAGE HEADER
============================================================

Title:

"Quản lý Gói Hội viên & Doanh thu"

Badge:

"Subscription Management"

Subtitle:

"Quản lý gói dịch vụ, hội viên, thanh toán, gia hạn và hiệu quả doanh thu của CalisHealth."

Right side:

Primary button:

"+ Tạo gói mới"

Secondary:

"Xuất báo cáo"

Do NOT place "Về Dashboard" as the only action.

The primary action should be:

"+ Tạo gói mới"

============================================================
9. KPI SECTION
============================================================

Create 4 KPI cards.

------------------------------------------------------------

KPI 01

HỘI VIÊN ĐANG HOẠT ĐỘNG

4,281

"+8.4% so với tháng trước"

Icon:

Users

------------------------------------------------------------

KPI 02

MRR

480,000,000đ

"+9.4% so với tháng trước"

Description:

"Doanh thu định kỳ hàng tháng"

Icon:

TrendingUp

------------------------------------------------------------

KPI 03

DOANH THU THÁNG NÀY

512,400,000đ

"+12.8% so với tháng trước"

Icon:

Wallet

------------------------------------------------------------

KPI 04

TỈ LỆ GIA HẠN

84.2%

"+3.8% so với tháng trước"

Icon:

RefreshCw

Each KPI must include:

- label
- primary value
- trend
- comparison
- icon

Use subtle positive/negative indicators.

============================================================
10. SECONDARY KPI ROW
============================================================

Create a smaller analytics row.

Metrics:

Active Trials

1,284

Trial → Paid Conversion

31.2%

Churn Rate

5.8%

Upcoming Renewals

382

Expected Revenue

86,420,000đ

Do not make these cards as visually dominant as the main KPI cards.

============================================================
11. MAIN TABS
============================================================

Create 4 primary tabs:

[ Tổng quan ]

[ Gói hội viên ]

[ Hội viên ]

[ Thanh toán ]

Default:

Tổng quan

Tabs must be visually clear.

============================================================
12. OVERVIEW TAB
============================================================

The Overview tab is the main dashboard.

Structure:

KPI

↓

Filters

↓

Revenue Analytics
+
Subscription Analytics

↓

Plan Distribution

↓

Subscription Funnel

↓

Renewal & Churn

↓

Upcoming Renewals

↓

Recent Transactions

============================================================
13. GLOBAL FILTER TOOLBAR
============================================================

Create:

Search:

"Tìm kiếm người dùng, giao dịch..."

Filters:

[ Khoảng thời gian ]

[ Gói ]

[ Billing ]

[ Status ]

[ Payment Status ]

Date presets:

7 ngày
30 ngày
3 tháng
6 tháng
12 tháng

Buttons:

"Đặt lại"

"Xuất báo cáo"

Selected filters should appear as removable chips.

============================================================
14. REVENUE ANALYTICS
============================================================

Create a large card:

Title:

"Doanh thu theo thời gian"

Subtitle:

"Theo dõi xu hướng doanh thu và doanh thu định kỳ"

Use Recharts.

Line/Area chart.

X axis:

Weeks / Months

Y axis:

VND

Metrics:

Revenue
MRR

Example:

January
320M

February
348M

March
371M

April
402M

May
441M

June
480M

Provide toggle:

[ Revenue ]

[ MRR ]

[ Both ]

Tooltip:

Month
Revenue
MRR
Growth

Time controls:

30 ngày
3 tháng
6 tháng
12 tháng

============================================================
15. REVENUE BY PLAN
============================================================

Create a card:

"Doanh thu theo gói"

Use donut chart.

Example:

Calis Pro
36%

Calis Premium
51%

Calis Premium Annual
13%

Do NOT include Free Trial in revenue distribution.

Below chart:

Plan
Subscribers
Revenue
% Revenue

Example:

Premium
1,021
304.9M
51%

Pro
1,842
366.5M
36%

Annual
134
160.6M
13%

Allow clicking a plan to filter data.

============================================================
16. SUBSCRIPTION DISTRIBUTION
============================================================

Create:

"Phân bổ hội viên theo gói"

Donut chart:

Free Trial
30%

Pro
43%

Premium
24%

Annual
3%

Below:

Total Subscribers

4,281

Use legend with:

Plan
Users
Percentage

============================================================
17. SUBSCRIPTION FUNNEL
============================================================

This is extremely important because CalisHealth uses a 7-day trial.

Title:

"Trial → Paid Conversion"

Display:

10,000

New Trials

↓

4,200

Completed Trial

↓

1,302

Converted to Paid

↓

1,084

Currently Active Paid

Show conversion rates between each step.

Example:

Trial Completion:

42%

Paid Conversion:

31%

Overall Trial → Active Paid:

10.8%

Use horizontal funnel visualization.

Add CTA:

"Xem danh sách Trial sắp hết hạn"

============================================================
18. PLAN MANAGEMENT TAB
============================================================

When clicking:

"Gói hội viên"

Display plan cards.

Four cards:

Calis Free Trial
Calis Pro
Calis Premium
Calis Premium Annual

Each card must contain:

Plan name
Plan code
Price
Billing cycle
Subscribers
Revenue
Status
Features
Conversion
Churn

Example:

------------------------------------------------

CALIS PREMIUM

299,000đ / tháng

1,021 subscribers

24% of paid users

MRR:

304,179,000đ

Trial Conversion:

31.4%

Churn:

4.2%

Status:

ACTIVE

Features:

✓ Full Exercise Library
✓ Basic → Advanced
✓ Personalized Workout
✓ Periodic Assessment
✓ AI Coach
✓ AI Motion Analysis

Actions:

[Xem chi tiết]

[Chỉnh sửa]

[⋮]

------------------------------------------------

Use a "Popular" badge on Premium.

Use a "Best Value" badge on Annual.

============================================================
19. PLAN DETAIL / EDIT DRAWER
============================================================

Click:

"Chỉnh sửa"

Open right-side drawer.

Width:

600px.

Title:

"Chỉnh sửa gói"

Tabs:

Thông tin cơ bản
Giá & Thanh toán
Quyền sử dụng
Giới hạn
Analytics

------------------------------------------------
TAB 1
THÔNG TIN CƠ BẢN
------------------------------------------------

Plan Name

[Calis Premium]

Plan Code

[CALIS_PREMIUM]

Description

[Toàn bộ bài tập + AI Coach...]

Status:

[Active]

------------------------------------------------
TAB 2
PRICING
------------------------------------------------

Price:

299,000

Currency:

VND

Billing:

Monthly

Trial:

7 days

Auto Renewal:

ON

Grace Period:

3 days

------------------------------------------------
TAB 3
FEATURES
------------------------------------------------

Exercise Library
[✓]

Basic Exercises
[✓]

Intermediate
[✓]

Advanced
[✓]

Personalized Workout
[✓]

Periodic Assessment
[✓]

AI Coach
[✓]

AI Motion Analysis
[✓]

Progress Analytics
[✓]

Achievement System
[✓]

------------------------------------------------
TAB 4
LIMITS
------------------------------------------------

AI Coaching Sessions

Unlimited

AI Motion Analysis

Unlimited

Assessments / Month

1

Workout Plans

Unlimited

Workout History

365 days

------------------------------------------------

Bottom buttons:

"Huỷ"

"Lưu thay đổi"

Show confirmation before saving important pricing changes.

============================================================
20. CREATE NEW PLAN
============================================================

When clicking:

"+ Tạo gói mới"

Open a large modal or multi-step drawer.

Step 1:

Basic Information

Step 2:

Pricing

Step 3:

Features

Step 4:

Usage Limits

Step 5:

Review

Progress indicator:

01
02
03
04
05

At Review:

Show a plan preview exactly as users will see it.

Buttons:

"Quay lại"

"Lưu nháp"

"Tạo gói"

============================================================
21. SUBSCRIBERS TAB
============================================================

Create:

"Hội viên"

Table.

Columns:

Avatar
User
Plan
Billing
Start Date
Expiry Date
Auto Renewal
Amount
Status
Actions

Example:

Nguyễn Minh Anh
Calis Premium
Monthly
01/09/2026
01/10/2026
ON
299,000đ
Active

Statuses:

Trial
Active
Past Due
Grace Period
Cancelled
Expired

Features:

Search
Sort
Filter
Pagination
Column visibility
Export

============================================================
22. SUBSCRIBER DETAIL DRAWER
============================================================

Click a subscriber.

Open drawer.

Header:

Avatar
Name
Email
Plan
Status

Show:

Current Subscription

Plan:
Calis Premium

Price:
299,000đ/month

Started:
01/09/2026

Renewal:
01/10/2026

Auto Renewal:
ON

Then:

Payment History

Subscription Events

Feature Usage

Assessment History

Workout Usage

AI Coach Usage

Buttons:

"Xem hồ sơ học viên"

"Đổi gói"

"Huỷ gia hạn"

"Hoàn tiền"

============================================================
23. PAYMENT TAB
============================================================

Create:

"Thanh toán & Giao dịch"

KPI:

Successful Payments

Failed Payments

Refunded

Pending

Total Revenue

Create transaction table:

Transaction ID
User
Plan
Amount
Payment Method
Created At
Status
Actions

Payment methods:

VNPay
MoMo
Bank Transfer
Credit Card

Status:

Success
Pending
Failed
Refunded

Use appropriate status colors.

============================================================
24. PAYMENT DETAIL
============================================================

Click transaction.

Open drawer.

Show:

Transaction ID

User

Subscription

Amount

Payment Method

Payment Gateway

Created At

Completed At

Status

Invoice ID

Gateway Transaction ID

Payment Timeline

Example:

Payment Created
↓
Processing
↓
Success

Actions:

"Xem Invoice"

"Refund"

"Retry Payment"

Only show actions appropriate to transaction state.

============================================================
25. RENEWAL MANAGEMENT
============================================================

Create section:

"Gia hạn sắp tới"

Show:

Renewals next 7 days

382

Expected Revenue

86,420,000đ

Auto Renewal ON

342

Auto Renewal OFF

40

Create table:

User
Plan
Amount
Renewal Date
Auto Renewal
Status

Highlight:

Renewal in 24 hours

with warning state.

============================================================
26. CHURN ANALYTICS
============================================================

Create card:

"Churn & Retention"

Metrics:

Churn Rate

5.8%

Retention Rate

94.2%

Cancelled This Month

142

Reactivated

38

Use line chart:

Retention over time.

Show:

30 days
60 days
90 days

Also show cancellation reasons:

Too expensive
18%

Not enough time
22%

Not using AI
12%

Not satisfied
8%

Other
40%

============================================================
27. SUBSCRIPTION LIFECYCLE
============================================================

Create a visual lifecycle component:

TRIAL

↓

ACTIVE

↓

RENEWING

↓

RENEWED

or

ACTIVE

↓

CANCELLED

↓

EXPIRED

or

PAYMENT FAILED

↓

PAST DUE

↓

GRACE PERIOD

↓

EXPIRED

Use clear status badges.

============================================================
28. UPCOMING EXPIRATIONS
============================================================

Create:

"Subscription sắp hết hạn"

Show:

User
Plan
Expiry
Days Remaining
Auto Renewal
Expected Action

Example:

Nguyễn A
Premium
30/09
2 days
OFF

Badge:

"Needs Attention"

This section should help Admin proactively monitor churn.

============================================================
29. RECENT TRANSACTIONS
============================================================

Create:

"Giao dịch gần đây"

Display 8–10 latest transactions.

Columns:

User
Plan
Amount
Time
Status

Example:

Nguyễn Minh Anh
Premium
299,000đ
2 min ago
Success

Use compact table.

============================================================
30. REVENUE FORECAST
============================================================

Create:

"Doanh thu dự kiến"

Show:

Current MRR

480M

Expected Next Month

512M

Expected Renewals

86.4M

Potential Churn Loss

24.2M

Forecast:

+6.7%

Use a subtle area chart.

Clearly label forecast data as:

"Dự báo"

Do not make forecast look like actual revenue.

============================================================
31. BUSINESS INSIGHTS
============================================================

Create a section:

"Business Insights"

Examples:

"Calis Premium đang tạo ra 51% doanh thu định kỳ."

"Trial → Paid Conversion tăng 4.2% trong tháng này."

"40 subscription sắp hết hạn và đang tắt Auto Renewal."

"Annual Plan có tỷ lệ giữ chân cao hơn Monthly Plan."

Each insight should have:

Icon
Title
Explanation
Action

Example:

⚠

40 subscriptions

"có nguy cơ không gia hạn."

Button:

"Xem danh sách"

This makes the dashboard actionable.

============================================================
32. ALERT SYSTEM
============================================================

Show alerts when:

Payment failure increases

Churn increases > threshold

Trial conversion decreases

Large number of subscriptions expire

MRR decreases

Example:

WARNING

"Trial conversion giảm 8.2% so với tháng trước."

Action:

"Phân tích"

============================================================
33. EMPTY STATES
============================================================

Create professional empty states.

No subscriptions:

"Chưa có hội viên"

No transactions:

"Chưa có giao dịch"

No plans:

"Chưa có gói hội viên"

No upcoming renewals:

"Không có gia hạn trong 7 ngày tới"

Do not leave blank white areas.

============================================================
34. LOADING STATES
============================================================

Use skeleton loading for:

KPI cards
Charts
Tables
Plan cards
Drawers

Do not show blank containers.

============================================================
35. ERROR STATES
============================================================

Show:

"Không thể tải dữ liệu doanh thu."

Button:

"Thử lại"

Never expose raw backend exceptions.

============================================================
36. RESPONSIVE DESIGN
============================================================

Optimize:

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

KPI cards:

4 columns desktop
2 columns tablet
1 column mobile

Charts:

Full width.

Tables:

Horizontal scroll or card layout.

============================================================
37. ACCESSIBILITY
============================================================

Implement:

Semantic HTML
Keyboard navigation
ARIA labels
Focus states
Accessible charts
Readable contrast

Do not rely only on color.

Example:

Instead of:

green = active

Use:

● Active

green + label.

============================================================
38. MICRO INTERACTIONS
============================================================

Use subtle animations.

Card hover:

translateY(-2px)

Drawer:

slide from right

Modal:

fade + scale

Charts:

smooth entrance

Progress:

animated

Do not use excessive animation.

============================================================
39. TYPESCRIPT DATA MODELS
============================================================

Create:

SubscriptionPlan

PlanFeature

PlanFeatureLimit

Subscription

SubscriptionEvent

Payment

Invoice

Refund

RevenueMetric

SubscriptionAnalytics

Renewal

ChurnMetric

Example:

interface SubscriptionPlan {
  id: string;
  code: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: "TRIAL" | "MONTHLY" | "ANNUAL";
  trialDays: number;
  status: "ACTIVE" | "INACTIVE";
  subscriberCount: number;
  mrr: number;
  churnRate: number;
  features: PlanFeature[];
}