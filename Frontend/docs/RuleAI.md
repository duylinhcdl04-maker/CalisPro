Bạn đang tham gia phát triển dự án CalisHealth – nền tảng Health-Tech & AI Calisthenics Coaching.

Hãy đóng vai trò:
- Senior Software Architect
- Senior Backend Engineer Java Spring Boot
- Senior Frontend Engineer React
- Data Engineer MySQL
- AI/Computer Vision Engineer
- UX/UI Engineer

Mục tiêu:
Xây dựng hoàn chỉnh module "AI Coaching & Motion Configuration" cho hệ thống CalisHealth.

====================================================
I. TECH STACK BẮT BUỘC
====================================================

Backend:
- Java 21+
- Spring Boot
- Spring Web
- Spring Data JPA
- Spring Security
- Bean Validation
- Lombok
- MySQL
- RESTful API
- Maven

Frontend:
- React
- TypeScript
- React Router
- TanStack Query
- React Hook Form
- Zod
- Tailwind CSS
- shadcn/ui
- Lucide React
- Recharts nếu cần biểu đồ

AI / Computer Vision:
- Google MediaPipe Pose / Pose Landmarker
- 33 body landmarks
- Rule Engine tự xây dựng
- Gemini API dùng cho TEXT-TO-SPEECH / voice warning
- KHÔNG dùng Gemini để quyết định trực tiếp form đúng/sai.

Database:
- MySQL
- Thiết kế quan hệ rõ ràng
- UUID hoặc BIGINT tùy architecture hiện tại nhưng phải thống nhất toàn hệ thống.

====================================================
II. NGUYÊN TẮC KIẾN TRÚC QUAN TRỌNG
====================================================

KHÔNG được xây dựng hệ thống theo kiểu:

Video
→ Gemini
→ Gemini tự quyết định form đúng/sai

Thay vào đó phải xây dựng:

Camera / Video
        ↓
MediaPipe Pose
        ↓
33 Landmarks
        ↓
Metric Calculator
        ↓
Rule Engine
        ↓
Form Analysis Result
        ↓
Warning Text
        ↓
Gemini TTS
        ↓
Audio Warning

Trong đó:

1. MediaPipe:
- Detect body landmarks
- Không chịu trách nhiệm quyết định form đúng/sai.

2. Metric Calculator:
- Tính angle
- Distance
- Alignment
- ROM
- Depth
- Tempo
- Symmetry
- Các chỉ số cần thiết khác.

3. Rule Engine:
- Đọc configuration của từng exercise.
- So sánh metric thực tế với threshold.
- Xác định:
  - PASS
  - WARNING
  - ERROR
  - CRITICAL

4. Warning Generator:
- Tạo warning text dựa trên lỗi đã được Rule Engine xác định.

5. Gemini:
- Chỉ dùng để chuyển warning text thành audio.
- Không được để Gemini thay đổi nội dung chuyên môn của warning mà Rule Engine đã xác định.

====================================================
III. QUAN HỆ GIỮA EXERCISE VÀ AI CONFIGURATION
====================================================

Điểm quan trọng nhất:

AI configuration phải thuộc về một Exercise cụ thể.

Không được tạo các rule độc lập không biết thuộc exercise nào.

Thiết kế:

Exercise
    ↓
Exercise AI Profile
    ↓
Motion Configuration
    ↓
Motion Rules
    ↓
Feedback Configuration

Ví dụ:

Push Up
    ↓
Push Up AI Profile
    ↓
Required Landmarks
    ↓
Elbow Angle Rule
    ↓
Body Alignment Rule
    ↓
Chest Depth Rule
    ↓
Rep Counting Rule
    ↓
Feedback Rule

Pull Up sẽ có configuration riêng.

Squat sẽ có configuration riêng.

Không được sử dụng một bộ rule chung cho tất cả exercise.

====================================================
IV. DATABASE – KIỂM TRA DATABASE HIỆN TẠI
====================================================

Trước khi code:

1. Kiểm tra toàn bộ database hiện tại.
2. Tìm các bảng:
   - exercises
   - exercise categories
   - muscles
   - body muscles mapping
   - workout
   - workout sessions
   - users
   - coaches
   - AI-related tables

3. KHÔNG tạo bảng trùng nếu bảng tương ứng đã tồn tại.

4. Nếu bảng chưa có thì tạo.

5. Nếu database hiện tại chưa đủ quan hệ thì ALTER/MIGRATE thay vì phá bỏ dữ liệu cũ.

6. Tạo migration SQL rõ ràng.

====================================================
V. DATABASE TABLES CẦN CÓ
====================================================

Nếu chưa tồn tại, hãy thiết kế các bảng sau.

-----------------------------------------
1. exercises
-----------------------------------------

Lưu thông tin động tác.

Các field đề xuất:

id
name
slug
description
category_id
difficulty
movement_pattern
instruction
status
created_at
updated_at

movement_pattern ví dụ:

HORIZONTAL_PUSH
VERTICAL_PUSH
HORIZONTAL_PULL
VERTICAL_PULL
SQUAT
HINGE
LUNGE
ISOMETRIC
ROTATION
OTHER

-----------------------------------------
2. exercise_ai_profiles
-----------------------------------------

Mỗi exercise có thể có một AI profile đang active.

Fields:

id
exercise_id
profile_name
pose_model
tracking_mode
analysis_enabled
rep_counting_enabled
form_analysis_enabled
version
status
created_at
updated_at

Quan hệ:

exercises 1 --- 1/many exercise_ai_profiles

Cho phép nhiều version nhưng chỉ một version ACTIVE.

-----------------------------------------
3. ai_landmark_requirements
-----------------------------------------

Xác định exercise cần landmark nào.

Fields:

id
ai_profile_id
landmark_name
required
min_visibility
side
created_at

Ví dụ Push Up:

LEFT_SHOULDER
RIGHT_SHOULDER
LEFT_ELBOW
RIGHT_ELBOW
LEFT_WRIST
RIGHT_WRIST
LEFT_HIP
RIGHT_HIP
LEFT_ANKLE
RIGHT_ANKLE

-----------------------------------------
4. ai_motion_rules
-----------------------------------------

Đây là bảng quan trọng nhất.

Fields:

id
ai_profile_id
rule_code
rule_name
rule_type
metric_type
operator
threshold_min
threshold_max
warning_threshold
critical_threshold
severity
invalid_rep
enabled
priority
feedback_message
created_at
updated_at

Ví dụ:

PUSH_ELBOW_ANGLE
PUSH_BODY_ALIGNMENT
PUSH_CHEST_DEPTH
PUSH_SCAPULAR_POSITION
PUSH_TEMPO

metric_type:

ANGLE
DISTANCE
DEPTH
ALIGNMENT
VELOCITY
ROM
TEMPO
SYMMETRY
CUSTOM

operator:

BETWEEN
GREATER_THAN
LESS_THAN
GREATER_OR_EQUAL
LESS_OR_EQUAL
EQUAL
OUTSIDE_RANGE

severity:

INFO
WARNING
ERROR
CRITICAL

-----------------------------------------
5. ai_rule_conditions
-----------------------------------------

Dùng khi một rule có nhiều điều kiện.

Fields:

id
rule_id
condition_group
metric_name
operator
value
logical_operator
created_at

Hỗ trợ:

AND
OR

Ví dụ:

Elbow Angle > 70
AND
Shoulder Rotation > threshold

→ lỗi form.

-----------------------------------------
6. ai_feedback_templates
-----------------------------------------

Quản lý nội dung cảnh báo.

Fields:

id
rule_id
language
feedback_type
text_template
priority
enabled
created_at
updated_at

Ví dụ:

language = vi

text_template:

"Giữ khuỷu tay gần thân hơn."

Không hard-code text cảnh báo vào Java code.

-----------------------------------------
7. ai_voice_configurations
-----------------------------------------

Cấu hình TTS.

Fields:

id
name
provider
model
language
voice_name
speed
pitch
enabled
created_at
updated_at

Ví dụ:

provider = GEMINI
language = vi-VN

KHÔNG lưu API key trong database.

-----------------------------------------
8. ai_voice_warning_cache
-----------------------------------------

Cache audio đã tạo.

Fields:

id
feedback_id
text_hash
language
voice_name
audio_url
storage_key
duration
status
created_at

Mục đích:

Nếu cùng một warning:

"Giữ lưng thẳng."

được phát 10.000 lần thì KHÔNG gọi Gemini 10.000 lần.

Tạo hash:

SHA-256(text + language + voice + model)

Nếu đã tồn tại:
→ lấy audio cache.

Nếu chưa tồn tại:
→ gọi Gemini TTS
→ lưu audio
→ lưu cache record.

-----------------------------------------
9. ai_configuration_versions
-----------------------------------------

Quản lý version configuration.

Fields:

id
ai_profile_id
version_number
configuration_snapshot
status
created_by
approved_by
created_at
published_at

Status:

DRAFT
TESTING
ACTIVE
ARCHIVED

-----------------------------------------
10. ai_configuration_audit_logs
-----------------------------------------

Theo dõi Admin thay đổi rule.

Fields:

id
profile_id
user_id
action
old_value
new_value
reason
created_at

Action:

CREATE
UPDATE
PUBLISH
ROLLBACK
DELETE

====================================================
VI. DATABASE RELATIONSHIP
====================================================

Thiết kế quan hệ:

EXERCISE
    |
    | 1:N
    ↓
EXERCISE_AI_PROFILE
    |
    ├── 1:N → AI_LANDMARK_REQUIREMENTS
    |
    ├── 1:N → AI_MOTION_RULES
    |              |
    |              └── 1:N → AI_RULE_CONDITIONS
    |
    ├── 1:N → AI_FEEDBACK_TEMPLATES
    |
    └── 1:N → AI_CONFIGURATION_VERSIONS

AI_FEEDBACK_TEMPLATE
        ↓
AI_VOICE_WARNING_CACHE

AI_VOICE_CONFIGURATION
        ↓
Gemini TTS Service

Không tạo quan hệ vòng không cần thiết.

====================================================
VII. ADMIN UI – AI MOTION CONFIGURATION
====================================================

Thiết kế trang:

/admin/ai

Tiêu đề:

"Quản trị Động cơ AI & Motion Tracking"

Các KPI:

1. Model Accuracy
2. Average Latency
3. Form Errors Detected
4. AI Recommendation Acceptance Rate

Nhưng các KPI phải là dữ liệu thực tế hoặc mock rõ ràng.

Không được hard-code số liệu giả trong production component.

====================================================
VIII. EXERCISE SELECTOR
====================================================

Admin phải chọn Exercise trước.

UI:

Exercise
[ Search exercise... ]

[ Push Up ]
Horizontal Push
AI Analysis: Enabled

Sau khi chọn Push Up:

Hiển thị:

AI Profile
Version
Status
Last Updated

Ví dụ:

Push Up
AI Profile v1.4
● ACTIVE

====================================================
IX. TAB 1 – OVERVIEW
====================================================

Hiển thị:

Exercise information
Movement Pattern
Difficulty
AI Model
Profile Version
Required Landmarks
Rules count
Feedback count
Voice configuration
Last updated
Updated by

Buttons:

Edit
Test Configuration
Create New Version
Publish
Rollback

====================================================
X. TAB 2 – POSE DETECTION
====================================================

Cho phép cấu hình:

Pose Model
Tracking Mode
Required Landmarks
Minimum Visibility
Confidence Threshold

Hiển thị 33 landmarks.

Có preview skeleton.

Ví dụ:

33 Landmarks
● Nose
● Left Shoulder
● Right Shoulder
● Left Elbow
...

Cho phép Admin chọn landmark cần thiết.

Không nên cho Admin tùy tiện xóa landmark bắt buộc nếu rule đang sử dụng landmark đó.

Nếu xóa:
→ cảnh báo:

"This landmark is currently used by 3 motion rules."

====================================================
XI. TAB 3 – REP COUNTING
====================================================

Cấu hình:

Start Position
End Position
Motion Direction
Minimum ROM
Maximum ROM
Debounce Time
Minimum Rep Duration
Maximum Rep Duration

Ví dụ Push Up:

START
Elbow > 150°

DOWN
Elbow 45°–90°

UP
Elbow > 150°

Một repetition chỉ được count khi hoàn thành:

START → DOWN → UP

Không count duplicate frames.

====================================================
XII. TAB 4 – FORM RULES
====================================================

Đây là màn hình quan trọng nhất.

Hiển thị table:

Rule
Metric
Threshold
Severity
Invalid Rep
Feedback
Status
Actions

Ví dụ:

Elbow Angle
45°–60°
WARNING
YES

Body Alignment
170°–180°
ERROR
YES

Chest Depth
< 5cm
WARNING
NO

Mỗi rule có:

Edit
Duplicate
Disable
Delete

====================================================
XIII. FORM RULE EDITOR
====================================================

Form:

Rule Name
Rule Code
Metric Type
Operator
Min
Max
Warning Threshold
Critical Threshold
Severity
Invalid Rep
Priority
Feedback Message

Ví dụ:

Rule:

Elbow Angle

Metric:
ANGLE

Operator:
BETWEEN

Min:
45

Max:
60

Warning:
70

Critical:
80

Severity:
WARNING

Invalid Rep:
YES

Feedback:

"Giữ khuỷu tay gần thân hơn."

====================================================
XIV. KHÔNG CHO ADMIN NHẬP RULE KHÔNG HỢP LỆ
====================================================

Validation:

Min <= Max

Warning threshold phải hợp logic.

Critical threshold phải hợp logic.

Rule phải có metric.

Rule phải có feedback nếu severity >= WARNING.

Rule không được sử dụng landmark chưa được khai báo.

Nếu metric cần:

LEFT_ELBOW
RIGHT_ELBOW

nhưng landmark chưa được bật:

→ báo lỗi.

Không cho Publish.

====================================================
XV. FEEDBACK CONFIGURATION
====================================================

Mỗi lỗi form có:

Text Warning
Visual Warning
Voice Warning

Ví dụ:

ERROR:

"Bạn đang võng lưng. Hãy siết core và giữ cơ thể thành một đường thẳng."

Visual:

RED

Voice:

Enabled

Severity:

ERROR

====================================================
XVI. HAI OPTION CẢNH BÁO
====================================================

Bắt buộc hỗ trợ 2 option:

OPTION 1:
TEXT WARNING

OPTION 2:
VOICE WARNING

Admin có thể bật/tắt:

[✓] Text Warning
[✓] Voice Warning

Có thể:

Text only

Voice only

Text + Voice

Không được mặc định gọi Gemini nếu Voice Warning OFF.

====================================================
XVII. VOICE WARNING FLOW
====================================================

Khi Rule Engine phát hiện:

Elbow Angle = 82°

Rule:

Elbow Angle > 70°

Result:

ERROR

Feedback Template:

"Giữ khuỷu tay gần thân hơn."

Nếu:

voiceEnabled = true

Backend gọi:

Gemini TTS Service

Input:

"Giữ khuỷu tay gần thân hơn."

Gemini tạo audio.

Backend trả:

audioUrl

Frontend:

- Hiển thị warning text.
- Phát audio.

====================================================
XVIII. GEMINI API KEY
====================================================

TUYỆT ĐỐI KHÔNG:

- Hard-code API key.
- Lưu API key trong database.
- Commit API key vào Git.
- Đưa API key vào React frontend.
- Gửi API key từ browser.

API key chỉ tồn tại ở Backend.

Dùng:

Environment Variable:

GEMINI_API_KEY

Ví dụ:

application.yml:

gemini:
  api-key: ${GEMINI_API_KEY}
  model: ${GEMINI_TTS_MODEL}
  enabled: true

Không ghi giá trị thật vào repository.

Tạo:

.env.example

GEMINI_API_KEY=
GEMINI_TTS_MODEL=

====================================================
XIX. GEMINI SERVICE
====================================================

Tạo interface:

GeminiTtsService

Methods:

generateSpeech(
    String text,
    String language,
    String voice
)

Implementation:

GeminiTtsServiceImpl

Service chịu trách nhiệm:

1. Validate text.
2. Check cache.
3. Nếu cache tồn tại → trả audio.
4. Nếu chưa tồn tại → gọi Gemini.
5. Nhận audio.
6. Lưu audio.
7. Lưu cache.
8. Trả URL.

Không để Controller trực tiếp gọi Gemini.

Architecture:

Controller
    ↓
Service
    ↓
GeminiTtsService
    ↓
Gemini API

====================================================
XX. AUDIO CACHE
====================================================

Không gọi Gemini liên tục cho cùng một warning.

Hash:

SHA256(
    text
    +
    language
    +
    voice
    +
    model
)

Nếu hash tồn tại:

RETURN CACHE

Nếu không:

CALL GEMINI

Điều này giúp:

- giảm API cost
- giảm latency
- giảm số lượng request
- tăng ổn định realtime

====================================================
XXI. REALTIME WARNING
====================================================

Không gọi Gemini cho mọi frame.

Ví dụ:

30 FPS

Không được:

30 Gemini calls / second.

Thay vào đó:

MediaPipe:
30 FPS

Rule Engine:
30 FPS

Warning aggregator:

chỉ tạo warning khi:

1. lỗi tồn tại liên tục trong N frames
2. hoặc lỗi kéo dài X milliseconds.

Ví dụ:

Elbow Error
persist > 500ms

→ trigger warning.

Sau khi phát warning:

cooldown:

2–3 seconds

Không phát lại cùng warning liên tục.

====================================================
XXII. WARNING PRIORITY
====================================================

Nếu cùng lúc có nhiều lỗi:

Ví dụ:

Elbow Error
Back Error
Depth Warning

Không phát cả 3 audio cùng lúc.

Priority:

CRITICAL
ERROR
WARNING
INFO

Chỉ chọn warning quan trọng nhất trong mỗi cooldown window.

Ví dụ:

Back Error
→ ưu tiên phát.

====================================================
XXIII. WARNING STATE MACHINE
====================================================

Thiết kế state:

NORMAL
    ↓
WARNING_DETECTED
    ↓
WARNING_CONFIRMED
    ↓
WARNING_DISPLAYED
    ↓
VOICE_PLAYING
    ↓
COOLDOWN
    ↓
NORMAL

Không trigger liên tục.

====================================================
XXIV. API ENDPOINTS
====================================================

Thiết kế REST API.

--------------------------------
Exercise AI Profile
--------------------------------

GET
/api/admin/exercises/{exerciseId}/ai-profile

POST
/api/admin/exercises/{exerciseId}/ai-profile

PUT
/api/admin/ai-profiles/{profileId}

--------------------------------
Landmarks
--------------------------------

GET
/api/admin/ai-profiles/{profileId}/landmarks

PUT
/api/admin/ai-profiles/{profileId}/landmarks

--------------------------------
Rules
--------------------------------

GET
/api/admin/ai-profiles/{profileId}/rules

POST
/api/admin/ai-profiles/{profileId}/rules

PUT
/api/admin/rules/{ruleId}

DELETE
/api/admin/rules/{ruleId}

--------------------------------
Feedback
--------------------------------

GET
/api/admin/rules/{ruleId}/feedback

POST
/api/admin/rules/{ruleId}/feedback

PUT
/api/admin/feedback/{feedbackId}

--------------------------------
Voice
--------------------------------

GET
/api/admin/voice/config

PUT
/api/admin/voice/config

POST
/api/admin/voice/test

--------------------------------
Configuration
--------------------------------

POST
/api/admin/ai-profiles/{profileId}/test

POST
/api/admin/ai-profiles/{profileId}/publish

POST
/api/admin/ai-profiles/{profileId}/rollback

GET
/api/admin/ai-profiles/{profileId}/versions

====================================================
XXV. TEST CONFIGURATION
====================================================

Admin phải có nút:

"Test Configuration"

Cho phép:

Upload video
hoặc
Use webcam

System:

Video
↓
MediaPipe
↓
Landmarks
↓
Metrics
↓
Rules
↓
Result

Hiển thị:

Detected Metrics

Elbow Angle:
52°

Body Alignment:
176°

Chest Depth:
4.2cm

Result:

PASS

Hoặc:

FAIL

Reasons:

Elbow angle outside target range.

====================================================
XXVI. AI CONFIGURATION TEST MODE
====================================================

Test mode phải cho Admin xem:

Raw landmarks
Calculated metrics
Triggered rules
Feedback
Warning priority
Audio generation status

Ví dụ:

Rule:
PUSH_ELBOW_01

Metric:
Elbow Angle

Actual:
82°

Expected:
45°–60°

Result:
FAIL

Severity:
ERROR

Feedback:
"Giữ khuỷu tay gần thân hơn."

Voice:
Generated

Audio:
Ready

====================================================
XXVII. VERSION CONTROL
====================================================

Không được sửa trực tiếp configuration ACTIVE.

Khi Admin sửa:

ACTIVE v1.4

↓

Create Draft v1.5

↓

Test

↓

Approve

↓

Publish

↓

v1.5 ACTIVE

v1.4 ARCHIVED

Có rollback:

v1.5
↓
Rollback
↓
v1.4 ACTIVE

====================================================
XXVIII. COACH VIEW
====================================================

Coach có quyền:

View AI Configuration
View detected errors
View metrics
View warning history

Nhưng:

Coach không được chỉnh hệ thống AI nếu role không có permission.

Admin mới có quyền:

CREATE
UPDATE
PUBLISH
ROLLBACK

====================================================
XXIX. SECURITY
====================================================

Spring Security.

RBAC:

ADMIN:
- Full AI configuration

COACH:
- Read configuration
- View analysis
- View results

MEMBER:
- Execute exercise
- Receive feedback
- Receive audio

Không cho MEMBER truy cập:

/api/admin/**

Không expose:

GEMINI_API_KEY

====================================================
XXX. FRONTEND STRUCTURE
====================================================

Tạo:

src/modules/ai-motion/

components/
pages/
hooks/
services/
types/
schemas/
utils/

Pages:

AIMotionDashboard.tsx

ExerciseAIConfiguration.tsx

PoseConfiguration.tsx

RepCountingConfiguration.tsx

FormRules.tsx

RuleEditor.tsx

FeedbackConfiguration.tsx

VoiceConfiguration.tsx

AITestLab.tsx

VersionHistory.tsx

====================================================
XXXI. UI DESIGN
====================================================

Thiết kế theo style hiện tại của CalisHealth Admin.

Desktop-first.

Sidebar hiện tại giữ nguyên.

Màu chủ đạo:

CalisHealth green

AI:
cyan/blue accent

Warning:
amber

Error:
red

Success:
green

Không lạm dụng gradient.

Không tạo UI quá nhiều card.

Ưu tiên:

- Data table
- Tabs
- Form sections
- Status badges
- Validation messages
- Preview panel
- Rule visualization

====================================================
XXXII. RULE BUILDER UX
====================================================

Rule builder phải trực quan.

Ví dụ:

IF

[Elbow Angle]

[is greater than]

[70°]

THEN

Severity:
[ERROR]

Invalid Rep:
[YES]

Feedback:
[Giữ khuỷu tay gần thân hơn]

Voice:
[✓ Enabled]

[Save Rule]

====================================================
XXXIII. API ERROR HANDLING
====================================================

Nếu Gemini lỗi:

KHÔNG làm crash workout session.

Text warning vẫn hoạt động.

Ví dụ:

Gemini unavailable.

→ Text Warning:
"Giữ lưng thẳng."

Voice:
"Temporarily unavailable"

Không block AI motion analysis.

====================================================
XXXIV. FALLBACK
====================================================

Nếu Gemini TTS:

- timeout
- quota exceeded
- API error
- network failure

→ hệ thống phải:

1. Log error.
2. Return text warning.
3. Không retry vô hạn.
4. Có exponential backoff.
5. Không làm gián đoạn workout.

====================================================
XXXV. LOGGING
====================================================

Log:

Gemini request
Gemini response status
Latency
Cache hit
Cache miss
TTS generation failure

KHÔNG log:

API key
Sensitive user data
Raw video nếu không cần.

====================================================
XXXVI. DATA VALIDATION
====================================================

Backend validation bắt buộc.

Không tin dữ liệu từ Frontend.

Validate:

Exercise ID
Profile ID
Rule ID
Metric
Threshold
Severity
Feedback
Voice config

Frontend validation chỉ là UX.

Backend validation mới là security boundary.

====================================================
XXXVII. MIGRATION
====================================================

Nếu database hiện tại chưa có các bảng trên:

Tạo migration:

Vxxx__create_ai_motion_configuration.sql

Nếu đã có bảng:

ALTER TABLE phù hợp.

Không drop bảng production.

Không xóa dữ liệu hiện tại.

Tạo foreign key.

Tạo index:

exercise_id
profile_id
rule_id
status
rule_code
text_hash

Unique:

exercise_id + active profile

rule_code + profile_id

text_hash + language + voice

====================================================
XXXVIII. SEED DATA
====================================================

Tạo seed cho ít nhất:

Push Up
Pull Up
Squat
Plank
Dip

Mỗi exercise:

- AI profile
- Required landmarks
- Motion rules
- Feedback templates

Ví dụ Push Up:

Elbow Angle
Body Alignment
Chest Depth
Rep Counting

====================================================
XXXIX. KHÔNG HARDCODE RULE TRONG CODE
====================================================

TUYỆT ĐỐI KHÔNG viết:

if (elbowAngle > 70) {
    error = "Wrong form";
}

trực tiếp trong business code.

Thay vào đó:

Database
↓
AI Motion Rule
↓
Rule Engine
↓
Dynamic Evaluation

Code chỉ thực thi rule.

====================================================
XL. RULE ENGINE DESIGN
====================================================

Tạo:

RuleEngine

MetricCalculator

RuleEvaluator

FeedbackGenerator

WarningManager

Ví dụ:

MetricCalculator:

calculateElbowAngle()

calculateBodyAlignment()

calculateChestDepth()

RuleEvaluator:

evaluate(rule, metrics)

FeedbackGenerator:

generate(ruleResult)

WarningManager:

prioritize()
deduplicate()
cooldown()

====================================================
XLI. IMPORTANT – GEMINI KHÔNG ĐƯỢC THAY THẾ RULE ENGINE
====================================================

Gemini chỉ được dùng:

TEXT
↓
VOICE

Gemini không được dùng:

VIDEO
↓
GEMINI
↓
FORM SCORE

Không xây architecture phụ thuộc vào LLM để xác định:

- elbow angle
- squat depth
- body alignment
- rep count
- invalid rep

Các chỉ số này phải do:

MediaPipe + mathematical calculations + rule engine

xử lý.

====================================================
XLII. DOCUMENTATION
====================================================

Sau khi code:

Tạo documentation:

/docs/ai-motion-architecture.md

Nội dung:

1. Architecture
2. Database ERD
3. Exercise → AI Profile relationship
4. Rule Engine
5. Gemini TTS
6. Voice cache
7. API documentation
8. Security
9. Error handling
10. Deployment

Tạo:

/docs/gemini-tts.md

Hướng dẫn:

GEMINI_API_KEY

environment variables

local development

production

quota handling

====================================================
XLIII. DELIVERABLE
====================================================

Không chỉ tạo UI mockup.

Phải tạo:

1. Database migration
2. Entity
3. Repository
4. DTO
5. Service
6. Controller
7. Rule Engine
8. Metric Calculator
9. Gemini TTS Service
10. Audio Cache Service
11. Security
12. React pages
13. React components
14. API integration
15. Validation
16. Error handling
17. Seed data
18. Documentation
19. Unit tests
20. Integration tests

====================================================
XLIV. TEST CASES BẮT BUỘC
====================================================

Test:

1. Create exercise AI profile.
2. Create rule.
3. Invalid rule rejected.
4. Rule references missing landmark.
5. Evaluate valid Push Up.
6. Evaluate invalid Push Up.
7. Warning generated.
8. Voice disabled → no Gemini request.
9. Voice enabled → Gemini request.
10. Same warning → cache hit.
11. Gemini failure → text fallback.
12. Multiple warnings → priority.
13. Cooldown prevents duplicate warning.
14. Publish configuration.
15. Rollback configuration.
16. Coach cannot edit configuration.
17. Member cannot access admin API.
18. Gemini API key never exposed to frontend.

====================================================
XLV. FINAL ARCHITECTURE
====================================================

Final system should look like:

                    EXERCISE LIBRARY
                           │
                           ↓
                 EXERCISE AI PROFILE
                           │
          ┌────────────────┼────────────────┐
          ↓                ↓                ↓
      LANDMARKS        METRICS           RULES
          │                │                │
          └────────────────┼────────────────┘
                           ↓
                     RULE ENGINE
                           ↓
                  FORM ANALYSIS RESULT
                           ↓
                  WARNING MANAGER
                           ↓
                 ┌─────────┴─────────┐
                 ↓                   ↓
             TEXT WARNING       VOICE WARNING
                                     ↓
                                GEMINI TTS
                                     ↓
                                AUDIO CACHE
                                     ↓
                              USER DEVICE

====================================================
XLVI. IMPORTANT CODING RULES
====================================================

1. Không phá code hiện tại.
2. Không duplicate database table.
3. Không hard-code Gemini API key.
4. Không expose Gemini API key frontend.
5. Không hard-code exercise rule trong Java.
6. Không hard-code feedback.
7. Không gọi Gemini mỗi frame.
8. Không để Gemini quyết định form.
9. Không để TTS failure làm crash workout.
10. Có cache audio.
11. Có cooldown.
12. Có warning priority.
13. Có configuration versioning.
14. Có audit log.
15. Có RBAC.
16. Có validation Backend.
17. Có unit test.
18. Có integration test.
19. Có migration.
20. Code phải production-oriented, không chỉ demo.

====================================================
XLVII. CÁCH TRIỂN KHAI
====================================================

Trước tiên hãy:

STEP 1:
Phân tích source code hiện tại.

STEP 2:
Phân tích database hiện tại.

STEP 3:
Liệt kê các bảng đã có.

STEP 4:
Liệt kê các bảng còn thiếu.

STEP 5:
Xác định bảng nào cần ALTER.

STEP 6:
Đề xuất ERD cuối cùng.

STEP 7:
Chờ xác nhận architecture nếu phát hiện conflict lớn.

Sau khi architecture hợp lý:

STEP 8:
Tạo database migration.

STEP 9:
Tạo Backend domain model.

STEP 10:
Tạo Rule Engine.

STEP 11:
Tạo Gemini TTS Service.

STEP 12:
Tạo API.

STEP 13:
Tạo Frontend.

STEP 14:
Tạo Test Lab.

STEP 15:
Tạo test.

STEP 16:
Tạo documentation.

Không được bỏ qua bước phân tích database hiện tại.