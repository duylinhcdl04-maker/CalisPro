# ============================================================
# CALISHEALTH – AI MOTION COACHING INTEGRATION
# ============================================================

Bạn đang phát triển dự án CalisHealth – nền tảng AI Coaching
cho Calisthenics.

Hãy đóng vai:

- Senior Software Architect
- Senior Java Spring Boot Engineer
- Senior React/TypeScript Engineer
- Senior Computer Vision Engineer
- Senior AI Engineer
- Senior Data Engineer
- Senior API Integration Engineer

Mục tiêu:

Xây dựng hoàn chỉnh hệ thống AI Motion Coaching sử dụng:

1. React + TypeScript
2. MediaPipe Pose / Pose Landmarker
3. Java Spring Boot
4. MySQL
5. Google Gemini API
6. Viettel AI Text-to-Speech API

============================================================
1. KIẾN TRÚC TỔNG THỂ
============================================================

Hệ thống phải được thiết kế theo pipeline:

Camera
   ↓
React
   ↓
MediaPipe Pose
   ↓
33 Body Landmarks
   ↓
Movement Analysis
   ↓
Metric Calculator
   ↓
Rule Engine
   ↓
Exercise Standard từ Database
   ↓
Movement Analysis Result
   ↓
Gemini
   ↓
Correction / Coaching Instruction
   ↓
Viettel AI TTS
   ↓
Audio
   ↓
User

Kiến trúc backend:

React
   │
   ├── Camera
   ├── MediaPipe
   ├── Pose Visualization
   ├── Realtime Metrics
   └── Workout UI
             │
             ↓
       Spring Boot API
             │
      ┌──────┼───────────┐
      ↓      ↓           ↓
   Exercise Rules    Gemini      Viettel AI
      ↓              ↓             ↓
    MySQL        Analysis       Text-to-Speech

============================================================
2. NGUYÊN TẮC KIẾN TRÚC QUAN TRỌNG
============================================================

KHÔNG được thiết kế:

Camera
→ Gemini
→ Form analysis

KHÔNG được gửi video trực tiếp cho Gemini để Gemini tự quyết định
form đúng/sai trong realtime.

KHÔNG được gọi Gemini cho từng frame.

KHÔNG được gọi Viettel AI cho từng frame.

KHÔNG được đưa API key của Gemini hoặc Viettel AI vào React.

KHÔNG được hard-code API key.

KHÔNG được hard-code toàn bộ exercise rules trong JavaScript/Java.

Thay vào đó:

MediaPipe:
→ phát hiện pose.

Metric Calculator:
→ tính toán dữ liệu chuyển động.

Database:
→ chứa chuẩn của từng động tác.

Rule Engine:
→ xác định dữ liệu có nằm trong giới hạn chuẩn hay không.

Gemini:
→ phân tích kết quả tổng hợp + đưa ra hướng dẫn sửa.

Viettel AI:
→ chuyển câu hướng dẫn của Gemini thành giọng nói.

============================================================
3. CẤU HÌNH MEDIA PIPE
============================================================

Frontend sử dụng:

@mediapipe/tasks-vision

Cài đặt:

npm install @mediapipe/tasks-vision

Tạo module:

src/features/ai-coaching/mediapipe/

Cấu trúc:

mediapipe/
├── poseLandmarker.ts
├── poseConfig.ts
├── poseTypes.ts
├── poseDetector.ts
└── poseUtils.ts

============================================================
4. POSE LANDMARKER CONFIGURATION
============================================================

Tạo PoseLandmarker service.

Sử dụng:

FilesetResolver
PoseLandmarker

Cấu hình:

runningMode:
VIDEO

numPoses:
1

delegate:
GPU nếu browser/device hỗ trợ.

Các threshold phải configurable:

minPoseDetectionConfidence
minPosePresenceConfidence
minTrackingConfidence

Không hard-code các threshold trong component.

Tạo:

PoseConfig

Ví dụ:

{
  "runningMode": "VIDEO",
  "numPoses": 1,
  "minPoseDetectionConfidence": 0.5,
  "minPosePresenceConfidence": 0.5,
  "minTrackingConfidence": 0.5,
  "delegate": "GPU"
}

Có thể lấy configuration từ Backend nếu cần.

============================================================
5. MODEL MANAGEMENT
============================================================

Không nhúng model path rải rác trong source code.

Tạo:

PoseModelConfig

Ví dụ:

{
  "model": "POSE_LANDMARKER_FULL",
  "modelUrl": "...",
  "version": "1.0"
}

Hỗ trợ:

LITE
FULL
HEAVY

Default:

FULL

Có khả năng thay đổi sau này.

Không reload model mỗi frame.

PoseLandmarker phải được initialize một lần.

============================================================
6. CAMERA SERVICE
============================================================

Tạo:

CameraService

Chịu trách nhiệm:

- request camera permission
- start camera
- stop camera
- switch camera
- detect camera availability
- cleanup stream

Sử dụng:

navigator.mediaDevices.getUserMedia()

Video configuration:

width:
1280

height:
720

audio:
false

facingMode:
"user"

Phải xử lý:

- Permission denied
- Camera unavailable
- Browser không hỗ trợ camera
- Camera đang được sử dụng bởi application khác

============================================================
7. REALTIME POSE DETECTION
============================================================

Không xử lý MediaPipe trong React component chính.

Tạo:

usePoseDetection()

Hook.

Flow:

Camera
↓
Video Element
↓
PoseLandmarker.detectForVideo()
↓
PoseLandmarkerResult

Không gọi:

detectForVideo()

nhiều lần trên cùng timestamp.

Sử dụng:

requestAnimationFrame()

và kiểm tra:

video.currentTime

============================================================
8. POSE DATA MODEL
============================================================

Tạo TypeScript types:

Landmark

PoseFrame

PoseResult

PoseMetrics

ExerciseAnalysis

Ví dụ:

Landmark:

{
  index: number;
  x: number;
  y: number;
  z: number;
  visibility: number;
}

PoseFrame:

{
  timestamp: number;
  landmarks: Landmark[];
}

Không lưu toàn bộ raw frame vào database.

Raw landmarks chỉ dùng realtime hoặc debug/test nếu cần.

============================================================
9. REQUIRED LANDMARKS
============================================================

Exercise không phải lúc nào cũng cần toàn bộ landmarks.

Mỗi Exercise AI Profile phải định nghĩa:

required landmarks.

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

Backend phải quản lý danh sách required landmarks.

Frontend chỉ sử dụng những landmarks cần thiết.

Nếu landmark có visibility thấp:

Không đánh giá frame đó.

============================================================
10. VISIBILITY / CONFIDENCE
============================================================

Mỗi landmark có:

visibility

Nếu:

visibility < configured threshold

thì:

LANDMARK_UNRELIABLE

Không sử dụng frame đó để đánh giá form.

Không gửi dữ liệu không đáng tin cậy cho Gemini.

============================================================
11. MOVEMENT ANALYSIS ENGINE
============================================================

Tạo:

src/features/ai-coaching/analysis/

Bao gồm:

angleCalculator.ts
distanceCalculator.ts
alignmentCalculator.ts
romCalculator.ts
velocityCalculator.ts
symmetryCalculator.ts
tempoCalculator.ts
repCounter.ts

============================================================
12. ANGLE CALCULATION
============================================================

Tạo function:

calculateAngle(A, B, C)

Tính góc:

A → B → C

Ví dụ:

Shoulder → Elbow → Wrist

=

Elbow Angle

Không hard-code exercise.

Generic calculation.

============================================================
13. CÁC METRIC HỖ TRỢ
============================================================

Hệ thống phải hỗ trợ:

ANGLE
DISTANCE
ALIGNMENT
ROM
VELOCITY
ACCELERATION
TEMPO
SYMMETRY
DEPTH
POSITION
DURATION

Ví dụ:

Elbow Angle
Spine Alignment
Hip Position
Knee Angle
Shoulder Angle
Chest Depth
ROM
Movement Speed

============================================================
14. EXERCISE AI PROFILE
============================================================

Mỗi Exercise phải có AI Profile.

Quan hệ:

Exercise
    ↓
ExerciseAIProfile
    ↓
Landmark Requirements
    ↓
Metric Definitions
    ↓
Motion Rules
    ↓
Feedback Rules

Không có AI Profile thì Exercise không được sử dụng AI Coaching.

============================================================
15. DATABASE DESIGN
============================================================

Kiểm tra database hiện tại trước khi tạo bảng.

KHÔNG tạo duplicate table.

Nếu bảng đã tồn tại:

ALTER/MIGRATE.

Nếu chưa tồn tại:

CREATE.

Các bảng cần có:

exercises

exercise_ai_profiles

ai_landmark_requirements

ai_metric_definitions

ai_motion_rules

ai_rule_conditions

ai_feedback_templates

ai_feedback_priorities

ai_configuration_versions

ai_configuration_audit_logs

ai_analysis_sessions

ai_analysis_results

ai_voice_configs

ai_voice_cache

============================================================
16. EXERCISE AI PROFILE
============================================================

exercise_ai_profiles:

id
exercise_id
profile_name
version
pose_model
camera_view
tracking_mode
analysis_enabled
rep_counting_enabled
form_analysis_enabled
status
created_at
updated_at

Status:

DRAFT
TESTING
ACTIVE
ARCHIVED

============================================================
17. LANDMARK REQUIREMENTS
============================================================

ai_landmark_requirements:

id
profile_id
landmark_name
required
min_visibility
side

Ví dụ:

LEFT_ELBOW
required = true
min_visibility = 0.7

============================================================
18. METRIC DEFINITIONS
============================================================

ai_metric_definitions:

id
profile_id
metric_code
metric_name
metric_type
unit
landmark_a
landmark_b
landmark_c
enabled

Ví dụ:

ELBOW_ANGLE

metric_type:
ANGLE

landmark_a:
SHOULDER

landmark_b:
ELBOW

landmark_c:
WRIST

============================================================
19. MOTION RULES
============================================================

ai_motion_rules:

id
profile_id
metric_id
rule_code
operator
optimal_min
optimal_max
warning_min
warning_max
critical_min
critical_max
severity
invalid_rep
priority
enabled

Ví dụ:

PUSHUP_ELBOW_ANGLE

optimal:
45–60°

warning:
60–75°

critical:
>75°

============================================================
20. RULE ENGINE
============================================================

Tạo:

RuleEngine

RuleEvaluator

RuleResult

RuleEngine phải:

1. Nhận metrics.
2. Nhận exercise standard.
3. So sánh.
4. Xác định trạng thái.
5. Xác định severity.
6. Xác định error code.
7. Trả kết quả có cấu trúc.

Ví dụ:

Input:

elbowAngle = 78

Rule:

optimal = 45–60
warning = 60–75
critical >75

Output:

{
  "metric": "ELBOW_ANGLE",
  "actual": 78,
  "status": "CRITICAL",
  "errorCode": "ELBOW_TOO_WIDE"
}

============================================================
21. REP COUNTING
============================================================

Rep Counter phải dùng state machine.

KHÔNG dùng:

if(angle < threshold)
rep++

Phải có:

START
↓
DESCENDING
↓
BOTTOM
↓
ASCENDING
↓
COMPLETED

Một rep chỉ được count khi hoàn thành đầy đủ state.

Ví dụ Push Up:

TOP
↓
DOWN
↓
BOTTOM
↓
UP
↓
TOP

= 1 rep.

============================================================
22. MOVEMENT BUFFER
============================================================

Không gửi từng frame đến Backend/Gemini.

Tạo:

MovementBuffer

Thu thập metrics trong khoảng:

500ms–2000ms

hoặc theo từng repetition.

Sau đó tạo:

MetricSummary

Ví dụ:

{
  "exercise": "PUSH_UP",
  "rep": 12,
  "elbowAngle": {
    "min": 48,
    "max": 81,
    "average": 67
  },
  "bodyAlignment": {
    "average": 165
  },
  "rom": 72
}

============================================================
23. GEMINI ROLE
============================================================

Gemini KHÔNG làm:

- raw pose detection
- landmark detection
- frame-by-frame analysis
- camera processing
- basic angle calculation

Gemini làm:

1. Phân tích tổng hợp.
2. Đọc Rule Results.
3. So sánh với Exercise Standard đã cung cấp.
4. Ưu tiên lỗi.
5. Xác định lỗi chính.
6. Đưa ra hướng dẫn sửa.
7. Tạo câu nói ngắn gọn cho người dùng.

============================================================
24. GEMINI INPUT
============================================================

Gemini request phải chứa:

Exercise information

Exercise standard

Actual metrics

Rule engine results

User context nếu cần

Ví dụ:

{
  "exercise": {
    "code": "PUSH_UP",
    "name": "Push Up"
  },

  "standard": {
    "elbowAngle": {
      "optimalMin": 45,
      "optimalMax": 60
    },
    "bodyAlignment": {
      "optimalMin": 170,
      "optimalMax": 180
    },
    "rom": {
      "minimum": 80
    }
  },

  "actual": {
    "elbowAngle": 78,
    "bodyAlignment": 164,
    "rom": 72
  },

  "ruleResults": [
    {
      "code": "ELBOW_TOO_WIDE",
      "severity": "WARNING"
    },
    {
      "code": "BODY_ALIGNMENT",
      "severity": "ERROR"
    },
    {
      "code": "INSUFFICIENT_ROM",
      "severity": "WARNING"
    }
  ]
}

============================================================
25. GEMINI SYSTEM PROMPT
============================================================

Tạo System Prompt:

You are CalisHealth AI Coaching Assistant.

You analyze structured exercise metrics.

You MUST use the exercise standards provided by CalisHealth.

You MUST NOT invent biomechanical thresholds.

You MUST NOT modify the exercise standards.

You MUST NOT diagnose medical conditions.

You MUST prioritize the most important form correction.

You must generate concise Vietnamese coaching instructions.

The instruction must be:

- safe
- short
- actionable
- easy to understand
- suitable for real-time voice feedback

Return JSON only.

Schema:

{
  "status": "GOOD | NEEDS_CORRECTION",
  "score": number,
  "primaryError": {
    "code": string,
    "severity": string
  },
  "displayText": string,
  "voiceText": string,
  "secondaryErrors": []
}

============================================================
26. GEMINI OUTPUT
============================================================

Ví dụ:

{
  "status": "NEEDS_CORRECTION",

  "score": 68,

  "primaryError": {
    "code": "BODY_ALIGNMENT",
    "severity": "ERROR"
  },

  "displayText":
    "Bạn đang bị võng lưng. Hãy siết cơ bụng và giữ cơ thể thẳng.",

  "voiceText":
    "Siết cơ bụng và giữ cơ thể thành một đường thẳng.",

  "secondaryErrors": [
    {
      "code": "ELBOW_TOO_WIDE",
      "severity": "WARNING"
    }
  ]
}

============================================================
27. GEMINI VALIDATION
============================================================

Backend KHÔNG được tin tuyệt đối output của Gemini.

Validate:

JSON schema

status

score

error code

text length

severity

Không cho Gemini trả:

- HTML
- executable code
- SQL
- URL không cần thiết
- nội dung y khoa nguy hiểm

Nếu Gemini trả sai schema:

retry tối đa một số lần giới hạn.

Nếu vẫn lỗi:

fallback về predefined feedback template.

============================================================
28. FEEDBACK FALLBACK
============================================================

Nếu Gemini:

- timeout
- quota exceeded
- API error
- invalid JSON
- network error

thì không được làm crash workout.

Dùng:

ai_feedback_templates

Ví dụ:

ELBOW_TOO_WIDE

→

"Giữ khuỷu tay gần thân hơn."

BODY_ALIGNMENT

→

"Siết cơ bụng và giữ cơ thể thẳng."

============================================================
29. GEMINI API KEY
============================================================

Gemini API key chỉ được lưu ở Backend.

Environment variable:

GEMINI_API_KEY

Không được:

- hard-code
- commit vào Git
- lưu database
- đưa vào React
- đưa vào browser

application.yml:

gemini:
  enabled: ${GEMINI_ENABLED:true}
  api-key: ${GEMINI_API_KEY}
  model: ${GEMINI_MODEL}

Tạo:

.env.example

GEMINI_ENABLED=true
GEMINI_API_KEY=
GEMINI_MODEL=

============================================================
30. VIETTEL AI ROLE
============================================================

Viettel AI chỉ có nhiệm vụ:

TEXT → SPEECH

Không gửi:

- video
- landmarks
- raw metrics
- exercise database
- Gemini prompt

Chỉ gửi:

voiceText

Ví dụ:

"Siết cơ bụng và giữ cơ thể thành một đường thẳng."

============================================================
31. VIETTEL AI SERVICE
============================================================

Tạo interface:

ViettelTtsService

Method:

synthesize(
    String text,
    VoiceConfiguration configuration
)

Implementation:

ViettelTtsServiceImpl

Service phải xử lý:

- authentication
- request
- response
- timeout
- retry
- audio storage
- error handling

============================================================
32. VIETTEL API KEY
============================================================

API key không được đưa lên frontend.

Environment variable:

VIETTEL_AI_API_KEY

Ví dụ:

VIETTEL_AI_API_KEY=

application.yml:

viettel:
  ai:
    enabled: true
    api-key: ${VIETTEL_AI_API_KEY}
    base-url: ${VIETTEL_AI_BASE_URL}

Không hard-code endpoint hoặc credential nếu API documentation yêu cầu
configuration khác.

Hãy đọc API documentation chính thức của Viettel AI trước khi implement
request/response thực tế.

Không tự bịa endpoint.

============================================================
33. VIETTEL VOICE CONFIGURATION
============================================================

Database:

ai_voice_configs

Fields:

id
provider
language
voice
speed
pitch
enabled
created_at
updated_at

Ví dụ:

provider:
VIETTEL_AI

language:
vi-VN

============================================================
34. AUDIO CACHE
============================================================

Không gọi Viettel AI nếu câu nói giống nhau đã tồn tại.

Tạo hash:

SHA256(
    text
    +
    language
    +
    voice
    +
    speed
)

Check:

ai_voice_cache

Nếu tồn tại:

return audio URL.

Nếu chưa:

Viettel AI
↓
generate audio
↓
store audio
↓
save cache
↓
return URL

============================================================
35. AUDIO STORAGE
============================================================

Không lưu audio binary trực tiếp vào MySQL.

MySQL chỉ lưu:

audio_url
storage_key
hash
duration
status

Audio có thể lưu:

local storage trong development

hoặc

Object Storage trong production.

Tạo interface:

AudioStorageService

để sau này có thể thay:

LocalStorage
S3
MinIO
Cloud Storage

============================================================
36. REALTIME WARNING SYSTEM
============================================================

Không gọi Gemini/Viettel AI mỗi frame.

Flow:

MediaPipe
↓
Rule Engine
↓
Error persistence
↓
Debounce
↓
Warning Trigger
↓
Gemini
↓
Viettel AI

Ví dụ:

Error phải tồn tại:

>= 500ms

mới trigger.

Sau khi phát:

Cooldown:

2–3 seconds.

============================================================
37. WARNING PRIORITY
============================================================

Nếu nhiều lỗi:

CRITICAL
ERROR
WARNING
INFO

Chỉ chọn lỗi quan trọng nhất.

Ví dụ:

Body Alignment ERROR
+
Elbow WARNING

→ chỉ nói Body Alignment.

============================================================
38. VOICE INTERRUPTION
============================================================

Nếu audio hiện tại đang phát:

Không bắt đầu audio mới ngay lập tức.

Quản lý:

VoiceQueue

Priority:

CRITICAL
ERROR
WARNING

Nếu lỗi mới có priority cao hơn:

Có thể interrupt.

Nếu thấp hơn:

queue hoặc bỏ qua.

============================================================
39. FRONTEND WORKOUT UI
============================================================

Tạo:

WorkoutAIView

Components:

CameraView
PoseSkeleton
ExerciseHeader
RepCounter
FormScore
MetricPanel
FeedbackPanel
VoiceIndicator

UI:

--------------------------------

PUSH UP

12 / 20 REPS

FORM SCORE
86

[Camera + Skeleton]

--------------------------------

Current Feedback:

⚠️ Keep your body straight.

--------------------------------

Metrics:

Elbow Angle       78°
Body Alignment    164°
ROM                72%

--------------------------------

🔊 AI Coach is speaking...

============================================================
40. POSE SKELETON
============================================================

Overlay skeleton lên camera.

Hiển thị:

- landmarks
- connections
- current posture

Không render quá nhiều UI gây lag.

Pose visualization phải chạy độc lập với backend.

============================================================
41. PERFORMANCE
============================================================

MediaPipe phải chạy client-side.

Không upload camera stream lên Spring Boot.

Không gửi frame lên Gemini.

Không gửi frame lên Viettel.

Chỉ gửi:

- session result
- summarized metrics
- analysis result

Backend không trở thành bottleneck của realtime pose tracking.

============================================================
42. SESSION FLOW
============================================================

User:

Start Workout

↓

Frontend:

Load Exercise AI Profile

↓

Initialize MediaPipe

↓

Start Camera

↓

Detect Pose

↓

Calculate Metrics

↓

Rep Counter

↓

Rule Engine

↓

Collect metrics

↓

Gemini analysis khi cần

↓

Viettel voice khi cần

↓

Workout complete

↓

Send session summary

↓

Spring Boot

↓

MySQL

============================================================
43. WORKOUT SESSION DATABASE
============================================================

Nếu chưa có, tạo:

ai_analysis_sessions

Fields:

id
user_id
exercise_id
profile_id
started_at
ended_at
total_reps
correct_reps
incorrect_reps
average_score
status

ai_analysis_results:

id
session_id
rep_number
score
status
primary_error
metrics_json
gemini_feedback
voice_text
created_at

Không lưu raw video mặc định.

============================================================
44. PRIVACY
============================================================

Camera data phải được xử lý local càng nhiều càng tốt.

Không upload video nếu không có requirement rõ ràng.

Không gửi raw video sang Gemini.

Không gửi raw video sang Viettel.

Chỉ gửi structured metrics.

Cho user biết camera đang được sử dụng.

============================================================
45. ADMIN CONFIGURATION
============================================================

Tạo Admin UI:

/admin/ai-motion

Tabs:

1. Overview
2. Pose Configuration
3. Landmarks
4. Metrics
5. Rep Counting
6. Form Rules
7. Feedback
8. Gemini
9. Viettel AI
10. Test Lab
11. Version History

============================================================
46. TEST LAB
============================================================

Admin có thể:

Upload test video
hoặc
Use webcam

Hiển thị:

Pose landmarks
Metrics
Rule results
Gemini result
Viettel voice status

Ví dụ:

Elbow Angle
Actual: 78°
Standard: 45–60°
Status: WARNING

Gemini:

"Giữ khuỷu tay gần thân hơn."

Viettel:

Audio generated ✓

============================================================
47. VERSION CONTROL
============================================================

AI configuration phải có version.

Ví dụ:

Push Up AI Profile:

v1
v2
v3

Không sửa trực tiếp ACTIVE configuration.

Flow:

ACTIVE v1

↓

Create Draft v2

↓

Test

↓

Approve

↓

Publish

↓

v2 ACTIVE

v1 ARCHIVED

Có rollback.

============================================================
48. SECURITY
============================================================

Spring Security + RBAC.

ADMIN:

- edit AI configuration
- publish
- rollback
- configure Gemini
- configure Viettel

COACH:

- view configuration
- view analysis
- view performance

MEMBER:

- use AI coaching
- receive feedback

Không cho MEMBER:

/api/admin/**

============================================================
49. API ENDPOINTS
============================================================

Exercise AI Profile:

GET
/api/v1/exercises/{exerciseId}/ai-profile

Admin:

POST
/api/v1/admin/exercises/{exerciseId}/ai-profile

PUT
/api/v1/admin/ai-profiles/{profileId}

Metrics:

GET
/api/v1/admin/ai-profiles/{profileId}/metrics

Rules:

GET
/api/v1/admin/ai-profiles/{profileId}/rules

POST
/api/v1/admin/ai-profiles/{profileId}/rules

PUT
/api/v1/admin/ai-rules/{ruleId}

Feedback:

GET
/api/v1/admin/ai-rules/{ruleId}/feedback

POST
/api/v1/admin/ai-rules/{ruleId}/feedback

Gemini:

POST
/api/v1/admin/ai/gemini/test

Viettel:

POST
/api/v1/admin/ai/viettel/test

Analysis:

POST
/api/v1/ai-analysis/evaluate

Voice:

POST
/api/v1/ai-analysis/voice

Session:

POST
/api/v1/workout-sessions

============================================================
50. IMPORTANT – ANALYSIS API
============================================================

Frontend không gửi raw frames.

Frontend gửi:

{
  "exerciseId": 15,

  "repNumber": 12,

  "metrics": {
    "elbowAngle": 78,
    "bodyAlignment": 164,
    "rom": 72
  }
}

Backend:

1. Validate request.
2. Load Exercise AI Profile.
3. Load standards.
4. Run Rule Engine.
5. Create Rule Results.
6. Nếu cần Gemini:
   call Gemini.
7. Nhận voiceText.
8. Nếu voice enabled:
   call Viettel AI.
9. Return response.

============================================================
51. ANALYSIS RESPONSE
============================================================

API response:

{
  "status": "NEEDS_CORRECTION",

  "score": 68,

  "rep": 12,

  "primaryError": {
    "code": "BODY_ALIGNMENT",
    "severity": "ERROR"
  },

  "displayText":
    "Bạn đang bị võng lưng. Hãy siết cơ bụng.",

  "voiceText":
    "Siết cơ bụng và giữ cơ thể thẳng.",

  "audioUrl":
    "/audio/abc123.mp3"
}

============================================================
52. FALLBACK ARCHITECTURE
============================================================

Case 1:

Gemini unavailable

→ Rule Engine vẫn hoạt động.

→ predefined feedback.

Case 2:

Viettel unavailable

→ Text feedback vẫn hiển thị.

Case 3:

Gemini + Viettel unavailable

→ Rule Engine + predefined text feedback.

Workout không được crash.

============================================================
53. RATE LIMIT
============================================================

Gemini và Viettel đều phải có rate limit.

Không gọi liên tục.

Sử dụng:

debounce
cooldown
cache
request deduplication

============================================================
54. LOGGING
============================================================

Log:

- Gemini request latency
- Gemini status
- Gemini error
- Viettel TTS latency
- Viettel status
- Cache hit
- Cache miss
- Analysis latency

KHÔNG log:

- API keys
- sensitive user information
- raw camera stream

============================================================
55. MONITORING
============================================================

Admin dashboard có thể hiển thị:

Gemini requests
Gemini success rate
Gemini average latency
Viettel TTS requests
Viettel success rate
TTS cache hit rate
AI analysis latency
Average form score

Không hard-code số liệu.

============================================================
56. TEST CASES
============================================================

Bắt buộc tạo test:

1. MediaPipe initialization.
2. Camera permission denied.
3. Missing landmark.
4. Low visibility.
5. Angle calculation.
6. ROM calculation.
7. Rep counting.
8. Rule evaluation.
9. Correct exercise.
10. Incorrect exercise.
11. Gemini success.
12. Gemini timeout.
13. Gemini invalid JSON.
14. Gemini fallback.
15. Viettel success.
16. Viettel timeout.
17. Viettel fallback.
18. Voice cache hit.
19. Voice cache miss.
20. Warning cooldown.
21. Warning priority.
22. Multiple errors.
23. Admin authorization.
24. Coach authorization.
25. Member authorization.
26. Configuration versioning.
27. Rollback.

============================================================
57. PROJECT STRUCTURE – BACKEND
============================================================

Spring Boot:

com.calishealth

├── ai
│   ├── controller
│   ├── service
│   ├── engine
│   ├── dto
│   ├── entity
│   ├── repository
│   ├── mapper
│   ├── validator
│   └── integration
│       ├── gemini
│       └── viettel
│
├── exercise
├── workout
├── user
├── coach
├── security
└── common

============================================================
58. PROJECT STRUCTURE – FRONTEND
============================================================

src/

features/

ai-coaching/

├── camera/
│   ├── CameraView.tsx
│   └── cameraService.ts
│
├── mediapipe/
│   ├── poseLandmarker.ts
│   ├── poseDetector.ts
│   ├── poseConfig.ts
│   └── poseTypes.ts
│
├── analysis/
│   ├── angleCalculator.ts
│   ├── movementAnalyzer.ts
│   ├── repCounter.ts
│   └── metrics.ts
│
├── components/
│   ├── PoseSkeleton.tsx
│   ├── RepCounter.tsx
│   ├── FormScore.tsx
│   ├── FeedbackPanel.tsx
│   ├── MetricPanel.tsx
│   └── VoiceIndicator.tsx
│
├── hooks/
│   ├── usePoseDetection.ts
│   ├── useWorkoutAnalysis.ts
│   └── useVoiceFeedback.ts
│
└── services/
    ├── aiAnalysisApi.ts
    └── exerciseApi.ts

============================================================
59. API INTEGRATION RULES
============================================================

Frontend chỉ gọi Spring Boot.

Frontend KHÔNG gọi trực tiếp:

Gemini API

Viettel AI API

API keys chỉ tồn tại Backend.

============================================================
60. ENVIRONMENT VARIABLES
============================================================

Frontend:

VITE_API_BASE_URL=

Backend:

GEMINI_ENABLED=true
GEMINI_API_KEY=
GEMINI_MODEL=

VIETTEL_AI_ENABLED=true
VIETTEL_AI_API_KEY=
VIETTEL_AI_BASE_URL=

Không commit .env.

Chỉ commit:

.env.example

============================================================
61. DATABASE MIGRATION
============================================================

Tạo migration:

Vxxx__create_ai_motion_coaching.sql

Không drop existing tables.

Không xóa dữ liệu.

Tạo:

foreign keys
indexes
unique constraints

Index:

exercise_id
profile_id
rule_code
status
text_hash

============================================================
62. SEED DATA
============================================================

Tạo AI profile mẫu cho:

Push Up
Squat
Pull Up
Dip
Plank

Mỗi bài:

Required landmarks
Metrics
Form rules
Rep rules
Feedback templates

============================================================
63. KHÔNG HARDCODE EXERCISE RULE
============================================================

Không được viết:

if (exercise === "pushup") ...

if (elbowAngle > 70) ...

Các rules phải lấy từ database.

Code chỉ thực thi rule.

============================================================
64. GEMINI KHÔNG ĐƯỢC TỰ Ý THAY ĐỔI STANDARD
============================================================

Nếu database nói:

Elbow Angle:

45–60°

Gemini không được tự trả:

40–65°

Gemini chỉ được phân tích actual value so với standard.

============================================================
65. GEMINI KHÔNG PHẢI MEDICAL DIAGNOSTIC SYSTEM
============================================================

Không được sử dụng Gemini để:

- chẩn đoán bệnh
- chẩn đoán chấn thương
- đưa ra medical diagnosis

Chỉ đưa ra:

exercise technique feedback

Nếu phát hiện tình huống bất thường:

khuyến nghị dừng tập và tham khảo Coach/chuyên gia phù hợp,
không đưa ra chẩn đoán y tế.

============================================================
66. FINAL PIPELINE
============================================================

FINAL ARCHITECTURE:

                    CAMERA
                       ↓
                   REACT
                       ↓
               MEDIAPIPE POSE
                       ↓
                 LANDMARKS
                       ↓
              MOVEMENT ANALYZER
                       ↓
              METRIC CALCULATOR
                       ↓
                 RULE ENGINE
                       ↓
             ┌─────────┴─────────┐
             ↓                   ↓
       PASS / WARNING         ERROR
             │                   │
             └─────────┬─────────┘
                       ↓
                 METRIC SUMMARY
                       ↓
                    GEMINI
                       ↓
              ANALYSIS + COACHING
                       ↓
                 VOICE TEXT
                       ↓
                 VIETTEL AI
                       ↓
                    AUDIO
                       ↓
                     USER

============================================================
67. IMPLEMENTATION ORDER
============================================================

Không được code tất cả cùng lúc.

Thực hiện theo thứ tự:

PHASE 1
Analyze existing project.

PHASE 2
Analyze existing database.

PHASE 3
Design ERD.

PHASE 4
Create database migrations.

PHASE 5
Implement Exercise AI Profile backend.

PHASE 6
Implement MediaPipe in React.

PHASE 7
Implement Metric Calculator.

PHASE 8
Implement Rule Engine.

PHASE 9
Implement Rep Counter.

PHASE 10
Implement Gemini integration.

PHASE 11
Implement Viettel AI TTS.

PHASE 12
Implement audio cache.

PHASE 13
Implement realtime feedback.

PHASE 14
Implement Admin AI Configuration.

PHASE 15
Implement Test Lab.

PHASE 16
Implement workout result persistence.

PHASE 17
Security.

PHASE 18
Tests.

PHASE 19
Documentation.

============================================================
68. BEFORE CODING
============================================================

Trước khi tạo code:

1. Đọc source code hiện tại.
2. Đọc database hiện tại.
3. Liệt kê entities đã tồn tại.
4. Liệt kê bảng đã tồn tại.
5. Xác định module exercise hiện tại.
6. Xác định module workout hiện tại.
7. Xác định module authentication hiện tại.
8. Xác định cấu trúc React hiện tại.

Không tạo code duplicate.

Nếu phát hiện architecture conflict:

Hãy báo rõ:

- Conflict ở đâu.
- Tại sao conflict.
- Đề xuất solution.
- File nào cần sửa.

============================================================
69. DOCUMENTATION
============================================================

Tạo:

docs/

ai-motion-architecture.md
mediapipe-integration.md
gemini-integration.md
viettel-ai-integration.md
ai-rule-engine.md
ai-database.md
ai-security.md

Documentation phải giải thích:

MediaPipe hoạt động ở đâu.

Gemini hoạt động ở đâu.

Viettel AI hoạt động ở đâu.

Dữ liệu đi qua các service như thế nào.

API key được bảo vệ như thế nào.

============================================================
70. FINAL REQUIREMENT
============================================================

Hệ thống cuối cùng phải đạt:

MediaPipe:
REALTIME POSE DETECTION

Rule Engine:
DETERMINISTIC FORM EVALUATION

Gemini:
INTELLIGENT COACHING ANALYSIS

Viettel AI:
VIETNAMESE TEXT-TO-SPEECH

Spring Boot:
SECURE ORCHESTRATION API

MySQL:
EXERCISE STANDARD + AI CONFIGURATION +
WORKOUT ANALYSIS HISTORY

React:
REALTIME USER EXPERIENCE

Không xây dựng hệ thống chỉ để demo UI.

Code phải có kiến trúc có thể mở rộng production.

Đặc biệt:

Một Exercise mới được thêm vào database
→ Admin cấu hình AI Profile
→ chọn landmarks
→ cấu hình metrics
→ cấu hình form rules
→ cấu hình feedback
→ test
→ publish

mà KHÔNG cần sửa source code của Rule Engine.

Đó là yêu cầu kiến trúc bắt buộc.