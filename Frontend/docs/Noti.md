Bạn hãy đóng vai đồng thời là:

1. Senior Business Analyst (BA)
2. Senior Product Designer / UX Designer
3. Data Architect
4. Database Engineer
5. Backend Architect chuyên Java Spring Boot
6. Product Manager của một nền tảng HealthTech / Fitness AI

Tôi đang xây dựng dự án CALISHEALTH – một nền tảng Web/App hỗ trợ người dùng tập luyện Calisthenics, theo dõi tiến độ thể chất, đánh giá định kỳ và sử dụng AI Coaching / AI Motion Analysis.

Tech stack của hệ thống:

- Backend: Java Spring Boot
- Frontend: React
- Database: MySQL
- REST API
- Authentication & Authorization
- Role-based access control
- Có User App và Admin Dashboard

Trong Admin Dashboard hiện có module:

NỘI DUNG & TRUYỀN THÔNG

Gồm 2 module:

1. QUẢN LÝ NỘI DUNG
2. THÔNG BÁO & AUTOMATION

Hãy phân tích và thiết kế CHI TIẾT, CHUYÊN NGHIỆP, CÓ KHẢ NĂNG TRIỂN KHAI THỰC TẾ cho 2 module này.

==================================================
PHẦN I — MODULE QUẢN LÝ NỘI DUNG
==================================================

MỤC TIÊU:

Module này không dùng để quản lý kiến thức bài tập.

Mục đích chính là để Admin đăng tải những nội dung chính thức của CalisHealth và hiển thị trực tiếp cho người dùng trên User App/Web.

Các loại nội dung gồm:

- News / Tin tức
- Event / Sự kiện
- Challenge / Cuộc thi / Thử thách
- Reward / Giải thưởng
- Community / Hoạt động cộng đồng
- Product Update / Cập nhật sản phẩm
- Campaign / Chiến dịch

Ví dụ:

- CalisHealth Summer Challenge 2026
- Cuộc thi Push Up Challenge
- CalisHealth Community Day
- Trao giải học viên xuất sắc tháng
- Ra mắt AI Coach
- Cập nhật tính năng mới
- Hoạt động offline của CalisHealth

--------------------------------------------------
1. PHÂN TÍCH BUSINESS REQUIREMENT
--------------------------------------------------

Hãy xác định:

- Mục tiêu nghiệp vụ
- Actor
- Business Rules
- Quyền của Admin
- Quyền của Content Manager
- Quyền của Marketing Manager nếu cần
- Quyền của Super Admin
- Workflow tạo và xuất bản nội dung

Thiết kế workflow:

Draft
→ Editing
→ Review
→ Approved
→ Scheduled
→ Published
→ Archived

Giải thích rõ điều kiện chuyển trạng thái.

Ví dụ:

Draft → Review
Review → Approved
Approved → Scheduled
Scheduled → Published
Published → Archived

Không cho phép Admin tùy ý chuyển trạng thái nếu không đúng quyền.

--------------------------------------------------
2. PHÂN TÍCH CÁC LOẠI CONTENT
--------------------------------------------------

Thiết kế cấu trúc dữ liệu phù hợp cho:

A. NEWS

Thông tin:

- title
- slug
- short description
- content
- cover image
- author
- category
- tags
- publish date
- status

B. EVENT

Ngoài các trường cơ bản cần:

- event name
- start date
- end date
- location
- registration URL
- max participants
- event status
- organizer
- banner
- event description

C. CHALLENGE

Cần:

- challenge name
- description
- start date
- end date
- rules
- target
- reward
- max participants
- leaderboard enabled
- challenge status

D. REWARD

Cần:

- reward name
- reward type
- reward value
- eligibility
- quantity
- claim deadline
- image

E. COMMUNITY

Cần:

- activity name
- location
- date
- participants
- description
- gallery

F. PRODUCT UPDATE

Cần:

- version
- feature
- description
- release date
- changelog

Thiết kế sao cho không tạo quá nhiều bảng dư thừa.

Hãy xác định:

- Phần nào là dữ liệu dùng chung?
- Phần nào là dữ liệu riêng theo content type?
- Khi nào nên dùng bảng riêng?
- Khi nào nên dùng metadata?
- Khi nào dùng JSON?
- Không sử dụng JSON cho dữ liệu cần query thường xuyên.

--------------------------------------------------
3. CONTENT TARGETING
--------------------------------------------------

Admin phải có khả năng xác định đối tượng nhìn thấy bài viết.

Audience:

- All Users
- Free
- Pro
- Premium
- Beginner
- Intermediate
- Advanced
- User mới
- User đang Trial

Thiết kế:

- audience_type
- target_plan
- target_level
- target_condition

Phân tích cách backend xác định user nào được phép nhìn thấy content.

Ví dụ:

Premium-only Event
→ chỉ Premium User nhìn thấy.

--------------------------------------------------
4. PUBLISHING
--------------------------------------------------

Thiết kế hệ thống publishing:

- Publish immediately
- Schedule publish
- Schedule unpublish
- Draft
- Preview
- Archive

Cần lưu:

- created_at
- updated_at
- published_at
- scheduled_at
- archived_at
- created_by
- updated_by
- published_by

--------------------------------------------------
5. CONTENT VERSIONING
--------------------------------------------------

Thiết kế version history.

Ví dụ:

Article A:

Version 1
Version 2
Version 3

Admin có thể:

- Xem lịch sử
- So sánh version
- Restore version cũ

Phân tích xem có cần triển khai ngay từ MVP hay để Phase 2.

--------------------------------------------------
6. CONTENT ANALYTICS
--------------------------------------------------

Thiết kế dữ liệu thống kê:

- views
- unique views
- clicks
- shares
- registrations
- likes nếu cần
- engagement rate

Đặc biệt:

Event:
Views → Click → Registration → Attendance

Challenge:
Views → Join → Completion → Reward

Thiết kế funnel phù hợp.

--------------------------------------------------
7. USER EXPERIENCE
--------------------------------------------------

Phân tích content sau khi Admin Publish sẽ xuất hiện ở đâu trên User App:

- Home Banner
- News
- Event
- Challenge
- Notification Center nếu cần

Thiết kế logic:

Admin Publish
→ Backend
→ Content API
→ User App
→ User nhìn thấy content

--------------------------------------------------
8. DATABASE DESIGN — CONTENT
--------------------------------------------------

Hãy đề xuất database chuyên nghiệp.

Ví dụ có thể xem xét:

content
content_categories
content_tags
content_tag_mapping
content_media
content_audience
content_events
content_challenges
content_rewards
content_versions
content_analytics

Nhưng KHÔNG được máy móc sử dụng tất cả.

Hãy phân tích bảng nào thực sự cần.

Với mỗi bảng hãy cung cấp:

- Table name
- Purpose
- Column
- Data type
- PK
- FK
- Nullable
- Default
- Index
- Unique constraint
- Business meaning

--------------------------------------------------
9. CONTENT API
--------------------------------------------------

Đề xuất REST API cho Spring Boot.

Ví dụ:

POST   /api/admin/contents
GET    /api/admin/contents
GET    /api/admin/contents/{id}
PUT    /api/admin/contents/{id}
DELETE /api/admin/contents/{id}

POST   /api/admin/contents/{id}/submit-review
POST   /api/admin/contents/{id}/approve
POST   /api/admin/contents/{id}/publish
POST   /api/admin/contents/{id}/archive

User:

GET /api/contents
GET /api/contents/{slug}
GET /api/events
GET /api/challenges

Hãy bổ sung các API cần thiết.

==================================================
PHẦN II — MODULE THÔNG BÁO & AUTOMATION
==================================================

MỤC TIÊU:

Module này KHÔNG phải CMS.

Nó là hệ thống Communication & Automation của CalisHealth.

Mục đích:

- Gửi Email
- In-App Notification
- Push Notification nếu cần
- Nhắc gia hạn
- Nhắc Trial
- Nhắc tập luyện
- Thông báo thành tích
- Thông báo assessment
- Thông báo payment
- Thông báo hệ thống

--------------------------------------------------
10. PHÂN LOẠI NOTIFICATION
--------------------------------------------------

Thiết kế các nhóm:

A. Subscription

- Subscription expiring
- Subscription expired
- Renewal successful
- Payment failed

B. Trial

- Trial started
- Trial ending soon
- Trial expired

C. Training

- Workout reminder
- Missed workout
- Workout completed
- Training milestone

D. Achievement

- New PR
- New streak
- Level up
- Challenge completed
- Reward earned

E. Assessment

- Assessment due
- Assessment reminder
- Assessment completed
- New result available

F. System

- Security
- Account
- Maintenance
- System update

--------------------------------------------------
11. AUTOMATION ENGINE
--------------------------------------------------

Thiết kế theo mô hình:

EVENT
→ TRIGGER
→ CONDITION
→ ACTION
→ DELIVERY
→ LOG

Ví dụ:

Subscription expires in 3 days
→ Trigger
→ User has active Pro/Premium
→ Send Email
→ Send In-App Notification
→ Log result

Một automation phải có:

- name
- description
- trigger
- conditions
- actions
- channels
- audience
- status
- schedule
- created_by

--------------------------------------------------
12. EVENT-DRIVEN DESIGN
--------------------------------------------------

Phân tích các event từ hệ thống:

UserRegistered
WorkoutCompleted
PRAchieved
AssessmentCompleted
AssessmentDue
SubscriptionCreated
SubscriptionExpiring
SubscriptionExpired
PaymentFailed
ChallengeJoined
ChallengeCompleted
RewardEarned

Thiết kế:

System Event
→ Automation Engine
→ Matching Rule
→ Notification Job
→ Email / Push / In-App
→ Delivery Log

Giải thích cách triển khai phù hợp với Spring Boot.

Nếu phù hợp, đề xuất:

- Application Event
- Event Listener
- Scheduler
- Queue
- Background Job

Không cần microservice nếu hệ thống hiện tại chưa đủ lớn.

--------------------------------------------------
13. NOTIFICATION TEMPLATE
--------------------------------------------------

Thiết kế hệ thống Template.

Ví dụ:

Template:

"Subscription Expiry Reminder"

Subject:

"Gói {{user.plan}} của bạn sắp hết hạn"

Body:

"Xin chào {{user.name}},
gói {{user.plan}} của bạn sẽ hết hạn vào
{{subscription.expiry_date}}."

Các biến động:

{{user.name}}
{{user.email}}
{{user.plan}}
{{subscription.expiry_date}}
{{subscription.price}}
{{assessment.next_date}}
{{workout.name}}
{{achievement.name}}

Phân tích cách lưu template variables.

--------------------------------------------------
14. CHANNEL
--------------------------------------------------

Thiết kế hỗ trợ:

EMAIL
IN_APP
PUSH

Mỗi notification có thể gửi:

Email only
In-App only
Email + In-App
Push + In-App

Thiết kế:

notification_channels

hoặc cách khác hợp lý hơn.

--------------------------------------------------
15. NOTIFICATION PREFERENCES
--------------------------------------------------

User phải có quyền cấu hình:

☑ Workout Reminder
☑ Achievement
☑ Marketing
☑ Event
☑ Subscription
☑ Assessment

Nhưng các notification bắt buộc:

- Payment
- Security
- Subscription status

có thể không cho tắt.

Phân tích rõ:

Transactional Notification
vs
Marketing Notification

--------------------------------------------------
16. NOTIFICATION LOG
--------------------------------------------------

Hệ thống phải lưu:

- recipient
- notification
- channel
- status
- sent_at
- delivered_at
- opened_at
- clicked_at
- failed_at
- error_message

Trạng thái:

PENDING
PROCESSING
SENT
DELIVERED
OPENED
CLICKED
FAILED

Thiết kế index phù hợp.

--------------------------------------------------
17. EMAIL CAMPAIGN
--------------------------------------------------

Admin có thể tạo campaign.

Ví dụ:

"Premium Renewal Campaign"

Audience:

Premium users

Trigger:

Subscription expires in 7 days

Channel:

Email

Schedule:

08:00

Thiết kế:

campaign
campaign_audience
campaign_message
campaign_schedule
campaign_delivery

Nhưng hãy đánh giá xem bảng nào thực sự cần để tránh over-engineering.

--------------------------------------------------
18. AUTOMATION UI
--------------------------------------------------

Thiết kế giao diện Admin.

Ví dụ:

┌─────────────────────────────────────┐
│ Subscription Expiry Reminder       │
│                                     │
│ Trigger: 3 days before expiry      │
│ Audience: Pro + Premium             │
│ Channel: Email + In-App             │
│ Status: ACTIVE                      │
│                                     │
│ Sent: 1,248                         │
│ Delivered: 1,231                    │
│ Opened: 942                         │
│                                     │
│ [Edit] [Analytics] [Disable]       │
└─────────────────────────────────────┘

--------------------------------------------------
19. ANALYTICS
--------------------------------------------------

Admin cần xem:

- Total sent
- Delivered
- Failed
- Open rate
- Click rate
- Conversion rate

Ví dụ:

Subscription reminder:

Sent
→ Opened
→ Clicked
→ Renewed

Challenge notification:

Sent
→ Opened
→ Joined Challenge

Thiết kế funnel.

==================================================
PHẦN III — DATABASE ARCHITECTURE
==================================================

Hãy thiết kế ERD hoàn chỉnh cho hai module.

Phân biệt rõ:

CORE TABLES

CONTENT TABLES

AUTOMATION TABLES

NOTIFICATION TABLES

ANALYTICS TABLES

AUDIT TABLES

Không tạo bảng chỉ vì "có thể cần".

Ưu tiên:

- Normalization hợp lý
- Referential integrity
- Index
- Foreign key
- Unique constraint
- Soft delete nếu cần
- Audit fields
- Scalability
- Query performance

Database:

MySQL 8+

--------------------------------------------------
20. ĐỀ XUẤT DATABASE
--------------------------------------------------

Hãy cung cấp:

1. ERD dạng text
2. Danh sách bảng
3. Chi tiết từng column
4. PK/FK
5. Cardinality
6. Index
7. Constraint
8. Enum
9. Audit fields
10. Soft delete strategy

--------------------------------------------------
21. SPRING BOOT ARCHITECTURE
--------------------------------------------------

Đề xuất package structure:

content/
    controller/
    service/
    repository/
    entity/
    dto/
    mapper/

notification/
    controller/
    service/
    repository/
    entity/
    dto/
    mapper/

automation/
    controller/
    service/
    repository/
    entity/
    dto/

Giải thích trách nhiệm từng layer.

--------------------------------------------------
22. API ARCHITECTURE
--------------------------------------------------

Thiết kế REST API đầy đủ cho:

Admin Content
Admin Notification
Admin Automation
User Content
User Notification
Notification Preferences

Với mỗi API:

- HTTP Method
- Endpoint
- Request
- Response
- Authentication
- Authorization
- Validation
- Error cases

--------------------------------------------------
23. SECURITY
--------------------------------------------------

Thiết kế:

ADMIN
CONTENT_MANAGER
MARKETING_MANAGER
SUPER_ADMIN
USER

Phân tích RBAC.

Ví dụ:

Content Manager:
→ Create/Edit Content

Marketing Manager:
→ Campaign/Notification

Admin:
→ Manage

Super Admin:
→ Full access

--------------------------------------------------
24. AUDIT LOG
--------------------------------------------------

Tất cả hành động quan trọng phải được audit:

- Create content
- Edit content
- Publish content
- Delete content
- Create automation
- Disable automation
- Send campaign
- Change notification template

Lưu:

actor
action
entity
entity_id
old_value nếu cần
new_value nếu cần
timestamp
IP/device nếu hệ thống yêu cầu

==================================================
PHẦN IV — UX/UI DESIGN
==================================================

Thiết kế Admin Dashboard theo phong cách:

CalisHealth HealthTech

Visual style:

- Premium
- Modern
- Clean
- Professional
- Healthcare + Fitness
- Không quá nhiều màu
- Green/Olive là màu chủ đạo
- White background
- Soft gray
- Rounded cards
- Clear hierarchy

--------------------------------------------------
25. CONTENT MANAGEMENT UI
--------------------------------------------------

Thiết kế:

Dashboard
→ Content Library
→ Create Content
→ Content Detail
→ Preview
→ Publish
→ Analytics

Mô tả:

- Header
- KPI
- Search
- Filter
- Table
- Status badge
- Action menu
- Editor
- Preview
- Publish modal

--------------------------------------------------
26. NOTIFICATION UI
--------------------------------------------------

Thiết kế:

Communication Dashboard
→ Automation
→ Campaign
→ Templates
→ Notification Logs
→ Analytics

Mô tả từng màn hình.

==================================================
PHẦN V — BUSINESS FLOW
==================================================

Hãy vẽ bằng text các flow:

FLOW 1:

Admin tạo Event

Admin
→ Create Event
→ Save Draft
→ Preview
→ Publish
→ Backend
→ User App
→ User sees Event

FLOW 2:

Subscription reminder

Subscription
→ 3 days before expiry
→ Automation Engine
→ Find eligible users
→ Generate notification
→ Send Email
→ Send In-App
→ Store Delivery Log

FLOW 3:

Achievement

User completes workout
→ AI/Workout Service calculates PR
→ PR event
→ Automation Engine
→ Achievement rule
→ Notification
→ User

FLOW 4:

Assessment

Assessment due
→ Scheduler
→ Find users
→ Notification
→ Email + In-App

==================================================
PHẦN VI — PHÂN TÁCH MVP VÀ PHASE 2
==================================================

Hãy xác định rõ:

MVP:

- Content CRUD
- News/Event/Challenge
- Publish
- Schedule
- Audience
- Basic Notification
- Email
- In-App Notification
- Subscription Reminder
- Trial Reminder
- Assessment Reminder
- Achievement Notification
- Notification Log

PHASE 2:

- Advanced automation builder
- Push notification
- A/B testing
- Advanced segmentation
- Campaign analytics
- Content versioning
- Recommendation engine
- Behavioral automation
- Advanced conversion tracking

Giải thích tại sao.

==================================================
PHẦN VII — OUTPUT CUỐI CÙNG
==================================================

Hãy trả kết quả theo cấu trúc:

1. Business Overview
2. Functional Requirements
3. Actors & Permissions
4. Content Management Architecture
5. Notification & Automation Architecture
6. Business Rules
7. User Flow
8. Admin Flow
9. ERD
10. Database Tables
11. Column Definitions
12. Relationships
13. Index & Constraints
14. REST API
15. Spring Boot Architecture
16. React UI Architecture
17. Automation/Event Architecture
18. Notification Template Architecture
19. Analytics
20. Audit Log
21. Security
22. MVP Scope
23. Phase 2
24. Recommended Final Architecture

Yêu cầu quan trọng:

- Không thiết kế quá đơn giản.
- Không over-engineering.
- Không tạo bảng database không có mục đích.
- Các bảng phải có quan hệ rõ ràng.
- Thiết kế có thể triển khai thực tế bằng Java Spring Boot + React + MySQL.
- Ưu tiên khả năng mở rộng trong tương lai.
- Giải thích rõ lý do lựa chọn từng kiến trúc.
- Nếu có nhiều phương án, hãy so sánh và chọn phương án tốt nhất cho CalisHealth.
- Đặc biệt phải đảm bảo Content Management và Notification Automation là hai module độc lập nhưng có thể tích hợp với nhau.
- Khi Admin publish một Event/Challenge, User App phải có khả năng lấy và hiển thị nội dung đó.
- Khi hệ thống phát sinh event như Subscription Expiring, Workout Completed, PR Achieved hoặc Assessment Due, Automation Engine phải có khả năng tự động kích hoạt notification.