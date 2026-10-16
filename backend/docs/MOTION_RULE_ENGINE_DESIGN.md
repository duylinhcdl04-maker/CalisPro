# CalisHealth — Exercise Motion Rule Engine: thiết kế & triển khai

> Phiên bản 1.0 · 2026-10-07 · Dựa trên `ruleEniges.md` (yêu cầu), `LEVEL_ASSESSMENT_ROADMAP_DESIGN.md` (Level Engine),
> `Media.md` / `congifMedia.md` (pipeline MediaPipe) và **code AI Motion đang có** trong dự án.

---

## 0. Tóm tắt

Rule Engine là nguồn sự thật **tất định** cho câu hỏi *"động tác này có đạt tiêu chí đã cấu hình không?"*.
Cùng một Motion Profile + bộ Rule được dùng lại cho: huấn luyện realtime, xác định rep hợp lệ, chấm chất lượng động tác,
bài đánh giá định kỳ và (gián tiếp qua Level Engine) năng lực / level.

```
Camera → MediaPipe Pose (33 landmark, chạy ở trình duyệt)
       → [batch khung hình] → Feature Engine (Java) → Motion Features
       → Rule Engine (Strategy theo loại chỉ số) → ThresholdClassifier → RulePersistenceTracker
       → Violation Aggregator (ưu tiên, cooldown) → Feedback Resolver (feedbackCode → template → audio cache)
       → Rep Validator (rep hợp lệ / không) → Movement Quality
       → [Đánh giá định kỳ] kết quả bài test → Level Engine
Gemini: chỉ diễn giải vi phạm ĐÃ xác thực (đường "phức hợp").  Viettel AI: chỉ chuyển văn bản → giọng nói (module Voice).
```

## 1. Hiện trạng & khoảng trống (trước khi làm)

| # | Hiện trạng | Vấn đề |
|---|---|---|
| G1 | Form rule (frontend) gửi `phase`, landmark A/B/C, `tolerance`, `feedbackTextVi`… nhưng `MotionRuleDto` backend chỉ có `thresholdMin/Max`, `warning/criticalThreshold` | Phase, landmark, phản hồi **không được lưu** → rule không thể tính được |
| G2 | `RuleEvaluator` cũ: thiếu số đo thì lấy `thresholdMin` làm giá trị đo | Báo "đạt" giả; vi phạm nguyên tắc "không có dữ liệu ≠ form tốt" |
| G3 | `/admin/ai/evaluate` gọi TTS ở **mỗi** request | Trái nguyên tắc "không gọi Viettel AI mỗi khung hình" |
| G4 | Realtime (`useLivePoseTracking`) viết cứng `if (PUSH_UP && flare > 70)` | Không dùng rule đã cấu hình; không mở rộng được cho hàng trăm bài |
| G5 | "Min/Val + Max + Dung sai ±" | Mơ hồ: không rõ đâu là chuẩn, đâu là ngưỡng cảnh báo/lỗi |
| G6 | Rule không có version / quy trình duyệt | Sửa rule đang dùng làm sai lịch sử đánh giá |
| G7 | 197 rule cũ không có landmark/phase; vd. `LESS_OR_EQUAL` nhưng chỉ có `min` | Không thể chạy đúng nếu giữ nguyên |

## 2. Mô hình miền

```
Exercise ─1:N─ Motion Profile (exercise_ai_profiles: góc camera, kiểu chuyển động, máy trạng thái rep, ngưỡng tin cậy)
                 ├─1:N─ Motion Phase (motion_profile_phases: TOP, DESCENDING, BOTTOM, ASCENDING, HOLD…)
                 ├─1:N─ Landmark yêu cầu (ai_landmark_requirements)
                 ├─1:N─ Motion Rule (ai_motion_rules — mỗi dòng = 1 PHIÊN BẢN của rule_code)
                 │        ├─ Measurement (metric type + landmark/tham số theo loại)
                 │        ├─ Chuẩn: target, normal range, operator
                 │        ├─1:N─ Severity thresholds (motion_rule_thresholds: WARNING/ERROR/CRITICAL, cận rõ ràng)
                 │        ├─ Execution: persistence, cooldown, tần suất, invalid rep, stop exercise
                 │        └─ feedbackCode ──► Feedback Template (motion_feedback_templates: UI text + voice text)
                 │                                   └─► Audio asset (ai_voice_warning_cache — module Voice quản lý)
                 └─ Audit (ai_configuration_audit_logs)
Runtime: movement_sessions ─1:N─ motion_rep_results, motion_violation_events; tổng kết → form_analysis
```

**Phân biệt bắt buộc (ruleEniges §53):** Motion Rule (đạt/không) ≠ Movement Quality (điểm 0–100) ≠ Competency ≠ Fitness Level.

## 3. Ngữ nghĩa ngưỡng (thay cho "Min + Max + Dung sai")

### 3.1 Toán tử xác định **vùng chuẩn (NORMAL)**

| Operator | Vùng NORMAL | Ghi chú |
|---|---|---|
| `BETWEEN` | normalMin ≤ v ≤ normalMax | Hai phía đều có thể có dải WARNING/ERROR/CRITICAL |
| `OUTSIDE` | v < normalMin hoặc v > normalMax | Dùng hiếm (vùng cấm ở giữa) |
| `MINIMUM_REQUIRED`, `GREATER_THAN(_OR_EQUAL)` | v ≥ normalMin (hoặc >) | Dải lỗi chỉ ở phía THẤP (vd. ROM, độ tin cậy) |
| `MAXIMUM_ALLOWED`, `LESS_THAN(_OR_EQUAL)` | v ≤ normalMax (hoặc <) | Dải lỗi chỉ ở phía CAO |
| `DEVIATION_FROM_TARGET` | \|v − target\| ≤ normalMax | Engine đổi giá trị thành độ lệch rồi xét phía CAO |
| `EQUAL` / `NOT_EQUAL` | v = target / v ≠ target | Chỉ số rời rạc (REP_SEQUENCE, REP_VALIDATION) |

`target` là giá trị lý tưởng để hiển thị và tính độ lệch — **không** mặc định bằng điểm giữa vùng chuẩn.

### 3.2 Dải mức độ (motion_rule_thresholds)

Mỗi dòng = một khoảng **tường minh**: `severity ∈ {WARNING, ERROR, CRITICAL}`, `min_value`/`max_value` (null = mở),
`min_inclusive`, `max_inclusive`. Ví dụ (push-up, góc mở khuỷu):

| Mức | Phía thấp | Phía cao |
|---|---|---|
| NORMAL | 45 ≤ v ≤ 70 | |
| WARNING | 40 ≤ v < 45 | 70 < v ≤ 75 |
| ERROR | 30 ≤ v < 40 | 75 < v ≤ 85 |
| CRITICAL | v < 30 | v > 85 |

Giao diện cho nhập theo "bậc thang" (40 / 30 phía thấp, 75 / 85 phía cao) rồi **tự sinh và hiển thị** các khoảng nửa mở như trên —
không bao giờ có khe hở (44.5°) hay chồng lấn. Backend kiểm tra lại: không chồng lấn với nhau, không chồng vùng NORMAL,
và (cảnh báo) có khe hở. Giá trị không thuộc NORMAL và không thuộc dải nào → `UNCLASSIFIED` → **không** tạo vi phạm
(không đoán ngưỡng).

### 3.3 Dung sai

Chỉ là **công cụ nhập nhanh** trên giao diện: target 60 ± 5 → điền sẵn normalMin = 55, normalMax = 65 và hiển thị rõ ràng.
Không lưu, không dùng khi chạy.

## 4. Loại chỉ số (Metric Type) — Strategy

| Metric type | Cấu hình đo | Đơn vị | Thời điểm xét | Operator cho phép |
|---|---|---|---|---|
| `ANGLE_3_POINT` | A, B (đỉnh), C | DEGREE | mỗi khung | BETWEEN, OUTSIDE, LT(E), GT(E), DEVIATION_FROM_TARGET |
| `DISTANCE` | A, B; chuẩn hoá theo chiều dài thân (vai–hông) | BODY_RATIO | mỗi khung | BETWEEN, LT(E), GT(E), MAXIMUM_ALLOWED, MINIMUM_REQUIRED |
| `ALIGNMENT` | Tập landmark (≥ 3) + phương pháp: `COLLINEARITY` (độ lệch khỏi đường thẳng) hoặc `AXIS_DEVIATION` (đoạn A→B so với trục VERTICAL/HORIZONTAL) | DEGREE | mỗi khung | MAXIMUM_ALLOWED, DEVIATION_FROM_TARGET, BETWEEN |
| `SYMMETRY` | Cặp góc trái (A,B,C) & phải (A',B',C') hoặc cặp landmark + trục | DEGREE | mỗi khung | MAXIMUM_ALLOWED |
| `ROM` | Khớp (A,B,C); biên độ = max − min trong 1 rep | DEGREE | cuối rep | MINIMUM_REQUIRED, BETWEEN |
| `VELOCITY` / `ACCELERATION` | Landmark + trục; chuẩn hoá theo chiều dài thân | BODY_RATIO_PER_SEC(²) | mỗi khung | MAXIMUM_ALLOWED, BETWEEN |
| `TEMPO` | Pha (vd. DESCENDING) — thời lượng pha trong rep | SECOND | cuối rep | BETWEEN, MINIMUM_REQUIRED, MAXIMUM_ALLOWED |
| `DURATION` | Thời gian giữ trong pha HOLD | SECOND | mỗi khung | MINIMUM_REQUIRED |
| `STABILITY` | Landmark + cửa sổ N khung — độ dao động (độ lệch chuẩn) | BODY_RATIO | mỗi khung | MAXIMUM_ALLOWED |
| `LANDMARK_VISIBILITY` | Tập landmark — visibility nhỏ nhất | RATIO | mỗi khung | MINIMUM_REQUIRED |
| `POSE_CONFIDENCE` | (không cần landmark) — visibility trung bình | RATIO | mỗi khung | MINIMUM_REQUIRED |
| `REP_SEQUENCE` | — thứ tự pha hợp lệ trong rep (1 = đúng) | BOOLEAN | cuối rep | EQUAL |
| `REP_VALIDATION` | — thời lượng rep trong [min, max] của profile (1 = đúng) | BOOLEAN | cuối rep | EQUAL |

Mỗi loại là một `MetricEvaluator` (Strategy, chọn qua `MetricEvaluatorFactory`): khai báo operator hợp lệ, đơn vị chuẩn,
landmark bắt buộc, thời điểm xét, cách lấy giá trị từ `MotionFeatures`. **Không** loại nào tự tính từ landmark thô —
việc tính toán thuộc `FeatureEngine` (ruleEniges §27, §63).

## 5. Thời gian: persistence, cooldown, tần suất

* **Persistence** `FRAME` (N khung liên tiếp) hoặc `TIME` (ms liên tục). Đếm theo **từng mức**: `count[s]` = số khung liên tiếp
  có mức ≥ s. Mức được báo = mức cao nhất có `count[s]` ≥ ngưỡng. Vì vậy `E,E,PASS,E` **không** tạo lỗi duy trì, còn
  `W,E,E,E,E,E` (5 khung) báo ERROR. Khung không tin cậy (UNRELIABLE) **không** tính và **không** reset (bỏ qua).
* **Cooldown** (ms, theo rule): vi phạm vẫn được ghi nhận (để chấm rep/chất lượng) nhưng phản hồi cùng `feedbackCode` không
  phát lại trước khi hết cooldown.
* **Tần suất đánh giá** (ms): rule chỉ xét khi đã qua ≥ khoảng này từ lần xét trước.

## 6. Độ tin cậy dữ liệu

Trước khi xét rule: landmark của rule phải có visibility ≥ ngưỡng của profile (`min_landmark_visibility`, hoặc
`ai_landmark_requirements.min_visibility` riêng); pose confidence ≥ `min_pose_confidence`; rule có `camera_view` khác
góc quay của phiên → bỏ qua. Không đạt → `MEASUREMENT_UNRELIABLE`, **không** sinh cảnh báo form (ruleEniges §28).

## 7. Tổng hợp vi phạm & phản hồi

1. Gom theo `ruleCode` / `feedbackCode`, bỏ trùng.
2. Lọc cooldown (chỉ ảnh hưởng *phát phản hồi*).
3. Xếp hạng: priority (1–10, 10 cao nhất) ↓ → severity ↓ → độ lệch tương đối ↓.
4. Chọn **1** phản hồi chính. Nếu ≥ 2 vi phạm khác nhau (mức ≥ WARNING) cùng lúc ở cùng pha → `mode = COMBINED`
   (gợi ý gọi Gemini để gộp thành 1 câu); ngược lại `SIMPLE` → phát audio dựng sẵn ngay.
5. `FeedbackResolver`: `feedbackCode` → template (UI text + voice text) → tra audio cache theo hash (giọng & tốc độ hiện
   hành). Có → trả `audioUrl`; chưa có → `needsTts = true` (client dùng đường TTS của module Voice; server **không** gọi TTS
   trong vòng lặp realtime).

## 8. Rep, chất lượng, đánh giá định kỳ

* **Máy trạng thái rep** (FeatureEngine) dùng chỉ số chính của profile (vd. góc khuỷu 11-13-15) với `rep_top_threshold`,
  `rep_bottom_threshold`, `rep_direction`, `debounce`, `min/max_rep_duration`: TOP → DESCENDING → BOTTOM → ASCENDING → TOP = 1 rep.
  Bài giữ tĩnh (`movement_type = HOLD`) dùng pha HOLD + thời gian giữ.
* **Rep không hợp lệ:** trong rep có vi phạm (sau persistence) của rule `invalid_rep = true` ở đúng pha → rep invalid; vẫn lưu
  (`motion_rep_results`: số rep, hợp lệ, mã vi phạm, chỉ số, thời gian).
* **Chất lượng rep** = 100 − Σ phạt theo mức của các rule bị vi phạm trong rep (INFO 0, WARNING 5, ERROR 15, CRITICAL 30;
  PRODUCT_RULE — hằng số tại `MotionScoring`); chất lượng phiên = trung bình.
* **Đánh giá định kỳ:** phiên runtime gắn `assessment_session_id` + `test_item_id`; khi kết thúc, kết quả (valid/total reps hoặc
  giây giữ, form score, ROM, lỗi CRITICAL, pose confidence / visibility / tỉ lệ khung theo dõi được) được **nộp tự động** vào
  bài test của Level Engine (`PeriodicAssessmentService.submitResult`, nguồn `AI_MEASURED`). Không có định nghĩa "đúng form"
  riêng cho đánh giá (ruleEniges §54).

## 9. Version, trạng thái, phê duyệt, audit

* Mỗi dòng `ai_motion_rules` là một phiên bản của `rule_code` (`rule_version` 1, 2, …). Sửa rule **PUBLISHED** → tạo bản
  **DRAFT** mới (`previous_version_id`); xuất bản bản mới → bản PUBLISHED cũ thành **ARCHIVED**. Bản DRAFT/PENDING sửa tại chỗ.
* Trạng thái: `DRAFT → PENDING_REVIEW → PUBLISHED → ARCHIVED`; chỉ **PUBLISHED** được chạy realtime/đánh giá.
* Gửi duyệt yêu cầu: hợp lệ + **đã chạy Rule Tester** ít nhất một lần trên bản hiện tại (`last_tested_at`).
* Lưu `created_by`, `updated_by`, `submitted_by/at`, `approved_by/at`, `source_type`, `source_reference`, `change_note`;
  mọi thao tác ghi `ai_configuration_audit_logs` (giá trị cũ/mới dạng JSON).
* Mỗi `motion_violation_events` / `motion_rep_results` lưu `rule_id` (đúng phiên bản), `rule_version`, profile version
  → trả lời được "rep này sai vì rule nào, bản nào, đo được bao nhiêu, kỳ vọng bao nhiêu, phát audio nào".

## 10. API

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/v1/admin/motion/catalog` | Metric types (operator, đơn vị, cấu hình đo), landmark MediaPipe, mức độ, nguồn ngưỡng |
| GET/POST | `/api/v1/admin/exercises/{exerciseId}/motion-profiles` | Danh sách / tạo profile |
| GET/PUT | `/api/v1/admin/motion-profiles/{id}` | Cấu hình profile (camera, rep state machine, tin cậy, pha) |
| GET/POST | `/api/v1/admin/motion-profiles/{id}/rules` | Rule hiện hành (bản mới nhất mỗi mã) / tạo rule DRAFT |
| GET/PUT | `/api/v1/admin/motion-rules/{id}` | Chi tiết / lưu (PUBLISHED → tạo version mới) |
| POST | `/api/v1/admin/motion-rules/{id}/test` | Rule Tester: giá trị đo, hoặc chuỗi giá trị (replay) |
| POST | `/api/v1/admin/motion-rules/{id}/submit-review` · `/publish` · `/archive` | Quy trình |
| GET | `/api/v1/admin/motion-rules/{id}/versions` · `/audit` | Lịch sử |
| GET/POST | `/api/v1/admin/motion-profiles/{id}/feedback-templates` | Feedback code + trạng thái audio |
| POST | `/api/v1/motion/sessions` | Bắt đầu phiên phân tích (TRAINING / ASSESSMENT) |
| POST | `/api/v1/motion/sessions/{id}/frames` | Gửi **lô** khung landmark (không gửi video) → phản hồi đã tổng hợp |
| POST | `/api/v1/motion/sessions/{id}/finish` | Kết thúc: rep hợp lệ/không, chất lượng, độ tin cậy; tự nộp bài test nếu là đánh giá |

**Realtime:** client gửi lô khung (mặc định 4–8 khung / 250–500 ms, đã lấy mẫu theo tần suất đánh giá), không gửi mỗi khung
một request và không gửi video. Dự án hiện chưa có `spring-boot-starter-websocket` trong kho Maven offline; `MotionRuntimeService`
tách khỏi transport nên có thể bọc bằng WebSocket handler sau mà không đổi engine.

## 11. Ranh giới Gemini / Viettel AI

* Gemini nhận **JSON vi phạm đã xác thực** (mã, mức, giá trị đo, kỳ vọng) chỉ khi `mode = COMBINED` / cần ngữ cảnh — không
  quyết định đạt/không, không đổi ngưỡng, không đổi invalidRep (ruleEniges §24).
* Viettel AI chỉ được gọi bởi module Voice khi tạo audio cho feedback template (hoặc client fallback); không chạy trong vòng
  lặp đánh giá.

## 12. An toàn khoa học

Mọi ngưỡng có `source_type` (`SCIENTIFIC_EVIDENCE | COACHING_BENCHMARK | PRODUCT_RULE | COACH_CONFIGURED | DATA_DERIVED`) và
`source_reference`. Bộ rule mẫu push-up là **COACHING_BENCHMARK**, cần coach duyệt — không khẳng định góc nào đúng với mọi người.
Lưu ý góc đo phụ thuộc góc quay: góc mở khuỷu (cánh tay–thân) cần camera **phía trước**; độ sâu (góc khuỷu) và đường thẳng
thân người cần camera **bên hông** → rule mang `camera_view`.

## 13. Kiểm thử

`MotionRuleEngineTest` phủ 20 ca ở ruleEniges §61 (normal / warning / error / critical, biên, biên inclusive, landmark không hợp lệ,
pose confidence thấp, persistence chưa đạt / đã đạt, cooldown còn / hết, nhiều vi phạm, ưu tiên, invalid rep, critical stop,
khác pha, khác phiên bản, rule DRAFT / ARCHIVED không chạy).

## 14. Trạng thái triển khai

**Engine (thuần Java, `engine/motion`)** — `MotionTypes`, `ThresholdClassifier`, `MotionRuleValidator`, `MetricEvaluator` +
`MetricEvaluatorFactory` (14 metric type), `FeatureEngine` (đặc trưng + máy trạng thái rep), `RulePersistenceTracker`,
`ViolationAggregator`, `MotionScoring`, `MotionRuleEngine`. Test: `MotionRuleEngineTest` (22 ca).

**Dữ liệu** — cột mới trên `ai_motion_rules` (version, trạng thái, vùng chuẩn, phép đo JSON, persistence, cooldown, camera,
nguồn, người duyệt, `invalid_rep_min_severity`…), `exercise_ai_profiles` (camera, kiểu chuyển động, chỉ số đếm rep, ngưỡng
đỉnh/đáy, tin cậy), bảng mới `motion_profile_phases`, `motion_rule_thresholds`, `motion_feedback_templates`,
`motion_violation_events`, `motion_rep_results`; `movement_sessions` thêm user/profile/context/camera/summary;
`ai_configuration_audit_logs.target_ref`. Hibernate `ddl-auto: update` tự thêm cột.

**Service / API (§10)** — `service/motion`: `MotionConfigService` (catalog, profile, rule, quy trình, Rule Tester, audit),
`MotionFeedbackService` (template, trạng thái audio, tạo audio qua module Voice), `MotionRuntimeService` (phiên realtime, lưu
vi phạm/rep/FormAnalysis, tự nộp bài test đánh giá định kỳ), `MotionRuleMapper`, `LegacyMotionRuleConverter`,
`MotionEngineSeeder`. Controller: `AdminMotionController`, `MotionSessionController`. Thêm so với bảng §10:
`POST /motion-rules/{id}/reject`, `DELETE /motion-rules/{id}` (chỉ DRAFT), `PUT /motion-profiles/{id}/feedback-templates/{tid}`,
`POST /motion-feedback-templates/{tid}/generate-audio`, `GET /motion-profiles?exerciseId=`.

**Khởi tạo (seeder, idempotent)**
* Rule định dạng cũ → `DRAFT` v1: đổi tên toán tử (`LESS_OR_EQUAL → LESS_THAN_OR_EQUAL`, `OUTSIDE_RANGE → OUTSIDE`…),
  điều kiện "đạt" cũ → vùng chuẩn, `ANGLE`/`ALIGNMENT` cũ → `ANGLE_3_POINT` (giá trị cũ là góc khớp), câu cảnh báo cũ →
  feedback template `<MÃ>_P<profileId>`. Cấu hình cũ **không lưu landmark** nên các rule này không chạy cho tới khi admin chọn
  phép đo, chạy Rule Tester và duyệt; giá trị gốc ghi trong `change_note`.
* Bộ rule tham chiếu Push-Up (camera SIDE, rep 11-13-15, đỉnh 160° / đáy 90°): `PUSHUP_BODY_LINE`, `PUSHUP_DEPTH`,
  `PUSHUP_ECCENTRIC_TEMPO`, `PUSHUP_HEAD_NEUTRAL`, `PUSHUP_FULL_REP`, `PUSHUP_ELBOW_FLARE` (camera FRONT),
  `PUSHUP_CAMERA_VISIBILITY` — nguồn `COACHING_BENCHMARK`, trạng thái **PENDING_REVIEW**: HLV/admin bấm "Duyệt & xuất bản"
  thì mới chạy (§12).

**Tương thích luồng cũ**
* Exercise Builder vẫn đồng bộ rule `BUILDER_*`, nay vào hệ thống dưới dạng DRAFT có version; khi đồng bộ lại chỉ xoá bản
  DRAFT, không xoá bản đã gửi duyệt / xuất bản / lưu trữ.
* Endpoint cũ `/api/v1/admin/ai/rules` từ chối sửa/xoá bản không phải DRAFT; `RuleEvaluator` cũ hiểu tên toán tử mới.
* Frontend: tab "Bộ Quy tắc Form" dùng `features/motion-rules` (editor 8 phần: thông tin, phép đo theo landmark, chuẩn +
  công cụ dung sai, thang mức độ, thực thi, feedback, Rule Tester, phiên bản/duyệt). `MotionRulesTable` /
  `MotionRuleEditorModal` cũ đã gỡ. `useLivePoseTracking` (chế độ `EXERCISE_RULES`) bỏ luật hardcode, gửi lô landmark
  ~15 khung/giây mỗi 400 ms tới phiên runtime; audio lấy từ cache, thiếu thì đọc bằng giọng trình duyệt.

**Khác thiết kế / còn mở**
* Ngưỡng visibility riêng từng landmark (`ProfileDef.landmarkMinVisibility`) có trong engine nhưng chưa có cột/giao diện —
  đang dùng ngưỡng chung của profile.
* Chưa có màn hình học viên dùng chế độ `EXERCISE_RULES` (Camera Test Lab hiện ở chế độ kiểm tra tư thế); hook đã sẵn
  tham số `exerciseId`, `context = ASSESSMENT`, `assessmentSessionId`, `testItemId`.
* Phiên runtime giữ trong bộ nhớ một instance (tự đóng sau 30 phút không hoạt động); chạy nhiều instance cần sticky session.
* Gemini giải thích lỗi (mode `COMBINED`) chưa nối vào runtime — runtime chỉ trả mã + câu template.
