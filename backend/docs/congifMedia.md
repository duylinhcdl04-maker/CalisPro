============================================================
CALISHEALTH – PHÂN TÍCH KIẾN TRÚC AI MOTION COACHING
============================================================

Hãy đóng vai:

- Senior Software Architect
- Senior AI Architect
- Senior Computer Vision Engineer
- Senior Backend Engineer
- Senior Frontend Engineer
- Senior Data Engineer
- Senior AI Product Engineer

Bạn đang phân tích kiến trúc cho dự án CalisHealth – một nền tảng
Calisthenics AI Coaching.

Tech stack chính:

Frontend:
React + TypeScript

Backend:
Java Spring Boot

Database:
MySQL

Computer Vision:
MediaPipe Pose / MediaPipe Pose Landmarker

Generative AI:
Google Gemini API

Text To Speech:
Viettel AI TTS API

============================================================
MỤC TIÊU
============================================================

Phân tích thật chi tiết và chuyên nghiệp vai trò của:

1. MediaPipe
2. Gemini
3. Viettel AI

trong hệ thống AI Coaching của CalisHealth.

Không chỉ mô tả từng công nghệ riêng lẻ.

Phải thiết kế được một architecture hoàn chỉnh cho phép:

Camera
→ phát hiện chuyển động
→ hiểu cấu trúc cơ thể
→ đo các thông số chuyển động
→ so sánh với tiêu chuẩn bài tập
→ xác định lỗi
→ giải thích lỗi
→ tạo hướng dẫn sửa
→ chuyển hướng dẫn thành giọng nói
→ phản hồi cho người dùng.

============================================================
PHẦN 1 – XÁC ĐỊNH VAI TRÒ CỦA 3 CÔNG NGHỆ
============================================================

Hãy phân tích và khẳng định rõ:

------------------------------------------------------------
MEDIA PIPE
------------------------------------------------------------

MediaPipe là:

"BODY MOVEMENT / POSE PERCEPTION LAYER"

MediaPipe chịu trách nhiệm:

- nhận camera stream
- phát hiện người
- phát hiện body landmarks
- tracking body
- cung cấp tọa độ các điểm cơ thể
- cung cấp visibility / confidence
- hỗ trợ realtime pose tracking

MediaPipe KHÔNG chịu trách nhiệm:

- hiểu mục tiêu của bài tập
- biết bài tập nào đúng
- tự xây dựng tiêu chuẩn kỹ thuật
- tự tạo lời hướng dẫn
- tạo giọng nói
- chẩn đoán y khoa

Phân tích rõ tại sao MediaPipe chỉ là tầng perception.

------------------------------------------------------------
GEMINI
------------------------------------------------------------

Gemini là:

"AI REASONING / COACHING INTELLIGENCE LAYER"

Gemini chịu trách nhiệm:

- phân tích dữ liệu chuyển động đã được xử lý
- hiểu context của bài tập
- phân tích các lỗi form
- ưu tiên lỗi quan trọng nhất
- giải thích lỗi
- tạo hướng dẫn sửa
- tạo feedback tự nhiên
- chuyển kết quả kỹ thuật thành ngôn ngữ con người
- tạo nội dung phù hợp cho voice coaching

Gemini KHÔNG nên chịu trách nhiệm:

- xử lý camera realtime
- xử lý từng frame
- tính toán tất cả angle từ raw landmarks
- thay thế MediaPipe
- tự quyết định threshold nếu hệ thống đã có standard
- trực tiếp phát audio

------------------------------------------------------------
VIETTEL AI
------------------------------------------------------------

Viettel AI là:

"VOICE OUTPUT / TEXT-TO-SPEECH LAYER"

Viettel AI chịu trách nhiệm:

Text
→ Speech

Ví dụ:

Gemini tạo:

"Giữ khuỷu tay gần thân hơn."

Viettel AI:

→ chuyển câu trên thành audio tiếng Việt.

Viettel AI KHÔNG chịu trách nhiệm:

- nhận diện pose
- phân tích form
- đánh giá đúng sai
- hiểu bài tập
- quyết định lỗi
- phân tích dữ liệu MediaPipe
- thay thế Gemini.

============================================================
PHẦN 2 – PHÂN TÍCH VAI TRÒ THEO LỚP KIẾN TRÚC
============================================================

Hãy thiết kế kiến trúc theo các layer:

LAYER 1
Camera / Input

LAYER 2
Pose Perception

LAYER 3
Movement Metric Calculation

LAYER 4
Exercise Standard

LAYER 5
Deterministic Rule Engine

LAYER 6
AI Reasoning

LAYER 7
Voice Generation

LAYER 8
User Interface

LAYER 9
Data Persistence

Phải chỉ rõ:

Layer nào sử dụng MediaPipe.

Layer nào sử dụng Gemini.

Layer nào sử dụng Viettel AI.

Layer nào nằm ở React.

Layer nào nằm ở Spring Boot.

Layer nào nằm ở MySQL.

============================================================
PHẦN 3 – LUỒNG DỮ LIỆU CHI TIẾT
============================================================

Thiết kế flow:

USER
↓
CAMERA
↓
REACT
↓
MEDIAPIPE
↓
LANDMARKS
↓
METRIC CALCULATOR
↓
EXERCISE STANDARD
↓
RULE ENGINE
↓
GEMINI
↓
COACHING RESPONSE
↓
VIETTEL AI
↓
AUDIO
↓
USER

Phân tích từng bước.

Ở mỗi bước phải trả lời:

1. Input là gì?
2. Output là gì?
3. Xử lý ở đâu?
4. Có lưu database không?
5. Có gọi API external không?
6. Có cần realtime không?
7. Có thể fail ở đâu?

============================================================
PHẦN 4 – MEDIA PIPE HOẠT ĐỘNG NHƯ THẾ NÀO
============================================================

Phân tích chi tiết:

Camera
→ video frame
→ Pose Landmarker
→ landmarks

Giải thích:

- landmark là gì
- x/y/z là gì
- visibility là gì
- confidence là gì
- tại sao cần confidence
- khi landmark không đáng tin cậy thì xử lý thế nào

Ví dụ:

LEFT_SHOULDER
RIGHT_SHOULDER
LEFT_ELBOW
RIGHT_ELBOW
LEFT_WRIST
RIGHT_WRIST
LEFT_HIP
RIGHT_HIP
LEFT_KNEE
RIGHT_KNEE
LEFT_ANKLE
RIGHT_ANKLE

Phân tích cách sử dụng những landmarks này
để phân tích Calisthenics.

============================================================
PHẦN 5 – TỪ LANDMARK ĐẾN METRIC
============================================================

Không gửi raw landmarks trực tiếp cho Gemini.

Thiết kế:

Landmarks
↓
Metric Calculator
↓
Structured Metrics

Các metric có thể gồm:

- joint angle
- body alignment
- hip position
- shoulder position
- knee angle
- elbow angle
- ROM
- movement depth
- movement velocity
- tempo
- symmetry
- body position
- movement duration

Phân tích cách tính.

Ví dụ:

Shoulder
→ Elbow
→ Wrist

tạo:

Elbow Angle

Hip
→ Shoulder
→ Ankle

có thể dùng để đánh giá:

Body Alignment

Phải phân biệt:

RAW DATA

và

DERIVED DATA

============================================================
PHẦN 6 – EXERCISE STANDARD
============================================================

CalisHealth phải có database chứa:

Exercise Standard.

Ví dụ:

PUSH UP

Elbow Angle:
45–60°

Body Alignment:
170–180°

ROM:
>=80%

Hip Deviation:
<=5°

Không được để Gemini tự nghĩ ra các threshold này.

Standard phải thuộc CalisHealth database.

Thiết kế quan hệ:

Exercise
↓
Exercise AI Profile
↓
Landmark Requirements
↓
Metric Definitions
↓
Motion Standards
↓
Feedback Rules

============================================================
PHẦN 7 – RULE ENGINE
============================================================

Trước Gemini phải có:

DETERMINISTIC RULE ENGINE.

Mục tiêu:

Biến dữ liệu số thành:

PASS
WARNING
ERROR
CRITICAL

Ví dụ:

Actual:

Elbow = 78°

Standard:

45–60°

Rule Engine:

ELBOW_TOO_WIDE

Severity:

WARNING

Phân tích:

Tại sao cần Rule Engine?

Tại sao không để Gemini làm toàn bộ?

Phân tích:

- reliability
- consistency
- latency
- cost
- explainability
- reproducibility

============================================================
PHẦN 8 – GEMINI LÀM GÌ SAU RULE ENGINE
============================================================

Gemini nhận:

Exercise

+

Exercise Standard

+

Actual Metrics

+

Rule Results

+

Context

Ví dụ:

{
  "exercise": "PUSH_UP",

  "standard": {
    "elbowAngle": {
      "min": 45,
      "max": 60
    }
  },

  "actual": {
    "elbowAngle": 78
  },

  "ruleResult": {
    "code": "ELBOW_TOO_WIDE",
    "severity": "WARNING"
  }
}

Gemini không cần xem raw video.

Gemini không cần xem từng frame.

Gemini phải trả:

- diagnosis kỹ thuật của lỗi form
- priority
- correction
- display message
- voice message

============================================================
PHẦN 9 – GEMINI OUTPUT STRUCTURE
============================================================

Yêu cầu Gemini trả JSON.

Ví dụ:

{
  "status": "NEEDS_CORRECTION",

  "score": 68,

  "primaryError": {
    "code": "ELBOW_TOO_WIDE",
    "severity": "WARNING"
  },

  "displayText":
    "Khuỷu tay của bạn đang mở quá rộng.",

  "correction":
    "Giữ khuỷu tay gần thân hơn.",

  "voiceText":
    "Hãy giữ khuỷu tay gần thân hơn.",

  "secondaryErrors": []
}

Phân tích từng field.

============================================================
PHẦN 10 – GEMINI KHÔNG ĐƯỢC LÀM GÌ
============================================================

Thiết lập các giới hạn:

Gemini không được:

1. thay đổi standard
2. tự tạo threshold mới
3. tự thay đổi exercise rules
4. chẩn đoán bệnh
5. chẩn đoán chấn thương
6. xử lý raw camera stream
7. được gọi mỗi frame
8. tạo audio trực tiếp
9. truy cập API key Viettel
10. truy cập database trực tiếp.

Gemini chỉ nhận dữ liệu cần thiết từ Backend.

============================================================
PHẦN 11 – VIETTEL AI
============================================================

Sau khi Gemini trả:

voiceText

Backend gọi:

Viettel AI TTS.

Flow:

Gemini
↓
voiceText
↓
Viettel AI
↓
Audio
↓
Frontend
↓
Audio Player

Phân tích:

Input:

Vietnamese text

Output:

audio

Các configuration:

- language
- voice
- speed
- pitch nếu API hỗ trợ

============================================================
PHẦN 12 – KHÔNG GỌI VIETTEL AI LIÊN TỤC
============================================================

Không được:

30 FPS
→ 30 TTS requests.

Không được:

Gemini feedback
→ TTS mỗi frame.

Phải có:

ERROR DETECTION
↓
PERSISTENCE
↓
DEBOUNCE
↓
COOLDOWN
↓
GEMINI
↓
VIETTEL

Ví dụ:

Lỗi tồn tại > 500ms

→ trigger feedback.

Sau feedback:

Cooldown 2–3 seconds.

Trong cooldown:

Không gọi TTS lại cùng lỗi.

============================================================
PHẦN 13 – VOICE PRIORITY
============================================================

Nếu có nhiều lỗi:

CRITICAL
>
ERROR
>
WARNING
>
INFO

Ví dụ:

Body Alignment:
ERROR

Elbow:
WARNING

Chỉ đọc:

Body Alignment.

Không đọc đồng thời 5 lỗi.

Mục tiêu:

Không làm người dùng bị quá tải.

============================================================
PHẦN 14 – CACHE VIETTEL AI
============================================================

Nếu nhiều người nhận cùng feedback:

"Hãy giữ khuỷu tay gần thân hơn."

Không nên gọi TTS API nhiều lần.

Tạo:

voice cache.

Hash:

SHA256(
text
+
language
+
voice
+
speed
)

Nếu cache hit:

return audio.

Nếu cache miss:

call Viettel AI.

Phân tích kiến trúc cache.

============================================================
PHẦN 15 – REALTIME VÀ NON-REALTIME
============================================================

Phân chia rõ:

REALTIME:

Camera
MediaPipe
Landmark tracking
Metric calculation
Rep counting
Basic rule evaluation
UI visualization

NEAR REALTIME:

Feedback trigger
Gemini analysis
Voice generation

NON-REALTIME:

Session summary
Progress analysis
Historical analysis
Coach report
Performance trends

Giải thích tại sao phải chia như vậy.

============================================================
PHẦN 16 – PERFORMANCE
============================================================

Phân tích:

Không gửi video lên Backend.

Không gửi frame lên Gemini.

Không gửi frame lên Viettel.

MediaPipe chạy client-side.

Chỉ gửi structured data khi cần.

Ví dụ:

Không gửi:

33 landmarks × 30 FPS.

Thay vào đó gửi:

Rep summary.

Ví dụ:

{
  "rep": 12,
  "elbowAngle": {
    "min": 45,
    "max": 78,
    "avg": 63
  },
  "rom": 72,
  "bodyAlignment": 164
}

============================================================
PHẦN 17 – SPRING BOOT
============================================================

Spring Boot đóng vai trò:

ORCHESTRATION LAYER.

Nó chịu trách nhiệm:

- load exercise standard
- load AI profile
- validate metrics
- run rule engine
- gọi Gemini
- validate Gemini output
- gọi Viettel AI
- cache audio
- save analysis
- authentication
- authorization
- logging
- monitoring

Không để React gọi trực tiếp:

Gemini

hoặc

Viettel AI.

============================================================
PHẦN 18 – REACT
============================================================

React chịu trách nhiệm:

- camera
- MediaPipe
- skeleton
- realtime metrics
- rep counter UI
- feedback UI
- audio player

React không chứa:

GEMINI_API_KEY

VIETTEL_API_KEY

Không gọi trực tiếp external AI APIs.

============================================================
PHẦN 19 – DATABASE
============================================================

Phân tích database cần thiết:

exercises

exercise_ai_profiles

ai_landmark_requirements

ai_metric_definitions

ai_motion_rules

ai_feedback_templates

ai_analysis_sessions

ai_analysis_results

ai_voice_configs

ai_voice_cache

ai_configuration_versions

Giải thích relationship giữa các bảng.

============================================================
PHẦN 20 – VÍ DỤ HOÀN CHỈNH
============================================================

Hãy mô phỏng một Push Up thực tế.

User thực hiện:

REP 12.

MediaPipe phát hiện:

Elbow Angle:
78°

Body Alignment:
164°

ROM:
72%

Database standard:

Elbow:
45–60°

Body:
170–180°

ROM:
>=80%

Rule Engine:

ELBOW_TOO_WIDE
BODY_ALIGNMENT_ERROR
INSUFFICIENT_ROM

Sau đó:

Gemini phải chọn lỗi quan trọng nhất.

Ví dụ:

BODY_ALIGNMENT_ERROR

Gemini:

"Bạn đang bị võng lưng. Hãy siết cơ bụng và giữ cơ thể
thành một đường thẳng."

Viettel AI:

Text
→ Audio.

Frontend:

Hiển thị warning.

Audio:

phát lời hướng dẫn.

Phân tích toàn bộ flow từ đầu đến cuối.

============================================================
PHẦN 21 – ERROR HANDLING
============================================================

Phân tích các trường hợp:

MediaPipe fail

Camera fail

Landmark missing

Low confidence

Backend unavailable

Gemini timeout

Gemini invalid response

Gemini quota exceeded

Viettel AI timeout

Viettel AI unavailable

Audio generation fail

Database fail

Trong mọi trường hợp:

Workout không được crash.

Thiết kế fallback.

============================================================
PHẦN 22 – FALLBACK
============================================================

Nếu Gemini fail:

Rule Engine
↓
Predefined Feedback Template

Ví dụ:

ELBOW_TOO_WIDE

→

"Giữ khuỷu tay gần thân hơn."

Nếu Viettel AI fail:

Hiển thị text.

Không được mất feedback.

Nếu cả Gemini và Viettel fail:

Rule Engine vẫn hoạt động.

============================================================
PHẦN 23 – SECURITY
============================================================

API keys:

GEMINI_API_KEY

VIETTEL_AI_API_KEY

chỉ nằm Backend.

Sử dụng environment variables.

Không:

hard-code

commit Git

database

frontend

browser.

============================================================
PHẦN 24 – AI SAFETY
============================================================

Gemini không được đưa ra:

- medical diagnosis
- injury diagnosis
- treatment
- dangerous instructions

Gemini chỉ được:

exercise technique coaching.

Nếu phát hiện vấn đề bất thường:

đề nghị dừng bài tập và tham khảo Coach/chuyên gia.

============================================================
PHẦN 25 – KIẾN TRÚC CUỐI CÙNG
============================================================

Hãy tạo architecture diagram theo:

                    USER
                     │
                     ▼
                  CAMERA
                     │
                     ▼
              ┌──────────────┐
              │    REACT     │
              └──────┬───────┘
                     │
                     ▼
              ┌──────────────┐
              │  MEDIAPIPE   │
              │     POSE     │
              └──────┬───────┘
                     │
                     ▼
                LANDMARKS
                     │
                     ▼
             METRIC CALCULATOR
                     │
                     ▼
              RULE ENGINE
                     │
                     ▼
              SPRING BOOT
                     │
          ┌──────────┴──────────┐
          │                     │
          ▼                     ▼
      MYSQL STANDARD          GEMINI
                                │
                                ▼
                         COACHING TEXT
                                │
                                ▼
                          VIETTEL AI
                                │
                                ▼
                              AUDIO
                                │
                                ▼
                              REACT
                                │
                                ▼
                              USER

============================================================
PHẦN 26 – BẢNG SO SÁNH
============================================================

Tạo bảng so sánh:

                    MediaPipe | Gemini | Viettel AI

Input
Output
Nhiệm vụ
Realtime?
Backend/Frontend?
External API?
Cost
Latency
Database dependency
Có lưu dữ liệu?
Có tạo feedback?
Có tạo audio?
Có phân tích form?
Có xử lý camera?

============================================================
PHẦN 27 – PHÂN TÍCH TẠI SAO KHÔNG DÙNG GEMINI
============================================================

Giải thích tại sao không nên:

Camera
→ Gemini

So sánh:

Latency
Cost
Reliability
Realtime
Privacy
Scalability
Deterministic result

============================================================
PHẦN 28 – PHÂN TÍCH TẠI SAO KHÔNG ĐỂ MEDIAPIPE TỰ ĐÁNH GIÁ
============================================================

Giải thích:

MediaPipe chỉ cung cấp landmarks.

Nó không tự biết:

Push Up đúng là gì.

Squat đúng là gì.

Dip đúng là gì.

Do đó cần:

Exercise Standard

+

Metric Calculator

+

Rule Engine

+

Gemini.

============================================================
PHẦN 29 – PHÂN TÍCH TẠI SAO GEMINI KHÔNG NÊN TỰ TẠO STANDARD
============================================================

Ví dụ:

Database:

Elbow:
45–60°

Gemini không được tự thay:

40–65°.

Standard phải là:

CalisHealth-controlled knowledge.

Gemini chỉ reasoning trên standard.

============================================================
PHẦN 30 – PHÂN TÍCH TẠI SAO VIETTEL AI KHÔNG PHÂN TÍCH
============================================================

Viettel AI chỉ làm:

TEXT
↓
SPEECH

Không sử dụng Viettel AI để:

- form analysis
- pose analysis
- exercise evaluation.

Giữ trách nhiệm từng service rõ ràng.

============================================================
PHẦN 31 – OBSERVABILITY
============================================================

Thiết kế monitoring:

MediaPipe FPS

Pose detection confidence

Rule Engine latency

Gemini latency

Gemini success rate

Viettel latency

Viettel success rate

Voice cache hit rate

Average feedback latency

Average exercise score

============================================================
PHẦN 32 – COST OPTIMIZATION
============================================================

Phân tích cách giảm chi phí:

1. Không gọi Gemini mỗi frame.
2. Không gọi TTS mỗi frame.
3. Rule Engine xử lý lỗi đơn giản.
4. Gemini chỉ xử lý lỗi cần reasoning.
5. Cache TTS.
6. Aggregate theo rep.
7. Chỉ gửi dữ liệu cần thiết.
8. Fallback bằng predefined feedback.

============================================================
PHẦN 33 – SCALABILITY
============================================================

Thiết kế để có thể mở rộng:

Exercise:

5
→ 50
→ 500+

Không được:

if exercise == pushup

if exercise == squat

if exercise == dip

Mọi exercise phải được cấu hình:

Exercise AI Profile.

Khi thêm exercise:

Admin:

Create Exercise
↓
Create AI Profile
↓
Select Landmarks
↓
Configure Metrics
↓
Configure Standards
↓
Configure Rules
↓
Configure Feedback
↓
Test
↓
Publish

Không sửa source code.

============================================================
PHẦN 34 – VERSION CONTROL
============================================================

Exercise AI Profile phải có:

v1
v2
v3

Cho phép:

Draft
Testing
Active
Archived

Có rollback.

Khi Coach/Admin thay đổi standard:

không ảnh hưởng historical analysis.

Historical session phải biết:

profile_version

đã dùng để phân tích.

============================================================
PHẦN 35 – KẾT QUẢ PHÂN TÍCH PHẢI EXPLAINABLE
============================================================

Một feedback phải giải thích được:

Actual value

Standard value

Rule

Error

Correction

Ví dụ:

Elbow Angle:
78°

Standard:
45–60°

Rule:
ELBOW_TOO_WIDE

Gemini:
"Giữ khuỷu tay gần thân hơn."

Như vậy Coach có thể kiểm tra tại sao AI đưa ra feedback.

============================================================
PHẦN 36 – OUTPUT MONG MUỐN
============================================================

Sau khi phân tích, hãy cung cấp đầy đủ:

1. Executive Summary
2. Responsibility Matrix
3. System Architecture
4. Data Flow
5. Sequence Diagram
6. Component Diagram
7. MediaPipe Flow
8. Metric Calculation Flow
9. Rule Engine Flow
10. Gemini Flow
11. Viettel AI Flow
12. Realtime Architecture
13. Backend Architecture
14. Frontend Architecture
15. Database Architecture
16. API Flow
17. Error Handling
18. Fallback Strategy
19. Security
20. Performance
21. Cost Optimization
22. Scalability
23. Version Control
24. Example Push Up
25. Example Squat
26. Example Pull Up
27. Example failure cases
28. Recommended implementation order

============================================================
PHẦN 37 – QUY TẮC QUAN TRỌNG NHẤT
============================================================

Hãy luôn duy trì nguyên tắc:

MEDIA PIPE
=
SEE

METRIC ENGINE
=
MEASURE

DATABASE STANDARD
=
DEFINE CORRECT FORM

RULE ENGINE
=
DETERMINE

GEMINI
=
UNDERSTAND + EXPLAIN + COACH

VIETTEL AI
=
SPEAK

SPRING BOOT
=
ORCHESTRATE + SECURE

MYSQL
=
STORE KNOWLEDGE + HISTORY

REACT
=
VISUALIZE + INTERACT

Không được đảo ngược trách nhiệm này nếu không có lý do kỹ thuật
rõ ràng.

============================================================
PHẦN 38 – FINAL ARCHITECTURAL PRINCIPLE
============================================================

Kiến trúc phải đảm bảo:

"MediaPipe tells us what the body is doing.
The CalisHealth rules tell us whether it is correct.
Gemini explains what is wrong and how to correct it.
Viettel AI tells the user what to do through voice."

Đây là nguyên tắc trung tâm của toàn bộ AI Coaching System.

Hãy phân tích toàn bộ kiến trúc theo nguyên tắc trên,
không được bỏ qua bất kỳ layer nào.