# Rule chấm form cho các bài đường Baseline L0–L3: bản nháp và việc Coach cần làm

Trạng thái: **bản nháp kỹ thuật, chưa kiểm chứng trên video thật, chưa có Coach duyệt.** Code: `MotionBenchmarkSpecs` (dữ liệu), `MotionBenchmarkSeeder` (nạp vào DB), `MotionBenchmarkSpecsTest` (kiểm tra cơ học).

## 1. Hiện trạng trước khi có bản nháp (đo ngày 2026-10-09 trên DB `calishealth`)
Trong 28 bài của bộ test V2: **0 rule PUBLISHED**; chỉ `push-up` có 7 rule (PENDING_REVIEW) và có cấu hình đếm rep; 27 bài còn lại chưa khai báo kiểu chuyển động (rep hay giữ) và ngưỡng đếm.

## 2. Phạm vi bản nháp (đợt 1)
12 bài trên đường L0–L3 (mandatory theo `levelMin ≤ 3`, cộng bài nền `assisted-squat`): `incline-push-up`, `dips`, `pull-up`, `australian-pull-up`, `bodyweight-squat`, `assisted-squat`, `bulgarian-split-squat`, `shrimp-squat`, `dead-hang`, `plank`, `hollow-body-hold`, `l-sit`. Đợt 1: **37 rule**; đợt 2: **thêm 10 bài**. `push-up` đã có bộ tham chiếu riêng (7 rule, chờ duyệt).

| Bài | Kiểu | Chỉ số đếm (landmark) | Đỉnh / đáy | Rule nháp |
|---|---|---|---|---|
| incline-push-up | REPS | góc khuỷu (11-13-15) | 160° / 100° | thân thẳng, biên độ ≥ 55°, đủ chu kỳ, camera thấy |
| dips | REPS | góc khuỷu | 155° / 95° | biên độ ≥ 50°, đủ chu kỳ, nhịp hạ ≥ 0,5 s, camera thấy |
| pull-up | REPS | góc khuỷu | 160° / 85° | biên độ ≥ 65°, đủ chu kỳ, đung đưa ≤ 25°, camera thấy |
| australian-pull-up | REPS | góc khuỷu | 160° / 80° | thân thẳng ≤ 15°, biên độ ≥ 60°, đủ chu kỳ, camera thấy |
| bodyweight-squat | REPS | góc gối (23-25-27) | 165° / 100° | biên độ ≥ 55°, đủ chu kỳ, nhịp hạ, camera thấy |
| assisted-squat | REPS | góc gối | 165° / 115° | biên độ ≥ 40°, đủ chu kỳ, camera thấy |
| bulgarian-split-squat | REPS | góc gối chân trước (trái) | 160° / 100° | biên độ ≥ 50°, đủ chu kỳ, camera thấy |
| shrimp-squat | REPS | góc gối | 160° / 85° | biên độ ≥ 65°, đủ chu kỳ, camera thấy |
| dead-hang | HOLD | góc khuỷu | giữ khi 160–190° | đung đưa ≤ 20°, camera thấy |
| plank | HOLD | góc vai-hông-cổ chân (11-23-27) | giữ khi 160–190° | thân thẳng ≤ 10°, camera thấy |
| hollow-body-hold | HOLD | góc vai-hông-cổ chân | giữ khi 135–172° | gối thẳng ≥ 160°, camera thấy |
| l-sit | HOLD | góc vai-hông-cổ chân | giữ khi 65–115° | gối thẳng ≥ 155°, camera thấy |

Mọi rule: trạng thái **DRAFT**, nguồn `COACHING_BENCHMARK`, chưa có `last_tested_at`. Mỗi rule kèm câu phản hồi tiếng Việt (chữ và giọng nói).

## 3. Đã kiểm chứng gì, chưa kiểm chứng gì
Đã kiểm chứng (tự động):
- Mọi rule hợp lệ theo `MotionRuleValidator` và bộ 37 rule qua được **Rule Tester thật** của hệ thống trên DB scratch (37/37, không lỗi, template phản hồi đủ).
- Cơ học đếm: mỗi bài REPS đếm đúng 3 rep khi đủ biên độ, không có rep hợp lệ khi chỉ xuống nửa chừng, vẫn đếm đủ rep khi bật toàn bộ rule; mỗi bài HOLD tính đúng 3 giây khi giữ trong dải và 0 giây khi ngoài dải (`MotionBenchmarkSpecsTest`).

**Chưa kiểm chứng:** ngưỡng góc có đúng với người tập thật hay không, camera đặt đâu thì đo tốt, mức cảnh báo có quá gắt hoặc quá lỏng không. Việc này cần video thật và Coach.

## 4. Hạn chế đã biết (Coach cần biết khi xem xét)
1. **Chỉ dùng landmark bên TRÁI** (11/13/15, 23/25/27), giống bộ Push-Up tham chiếu: camera phải đặt phía trái người tập. Nếu người tập quay bên phải về phía camera thì landmark trái bị che và lần đo bị loại (không phải kết quả kém). Cần bổ sung chọn bên rõ hơn.
2. **Hollow body:** không đo được lưng dưới áp sàn (chỉ đo góc hông và gối thẳng).
3. **Pull-up:** "cằm qua xà" chưa đo trực tiếp, chỉ gián tiếp qua biên độ khuỷu; đung đưa đo bằng độ lệch thân.
4. **Squat:** chưa có rule gối đổ vào trong (cần camera trước), chưa đo độ nghiêng thân.
5. **Bulgarian / shrimp:** chưa phân biệt chân đang làm; chỉ đo gối trái.
6. **Dips:** chưa có rule vai nhô ra trước.
7. Tham số `min/max rep` và `debounce` là giá trị khởi đầu.

## 5. Đợt 2: bài bậc L3–L4 và kỹ năng (đã có bản nháp)
Thêm 10 bài, cùng mức tin cậy như đợt 1 (nháp kỹ thuật, chưa kiểm chứng video thật), tổng cộng **22 bài**: `muscle-up` (REPS khuỷu 160°/70°), `handstand-push-up` (160°/90°), `chest-to-bar-pull-up` (160°/70°), `pseudo-planche-push-up` (160°/90°), `pistol-squat` (gối 160°/65°), `hanging-leg-raise` (hông 175°/100°), `wall-pike-hold` (giữ hông 70–115°), `crow-pose` (giữ khuỷu 60–130°), `chest-to-wall-handstand` và `handstand` (giữ hông 160–190°). Mỗi bài có rule biên độ, đủ chu kỳ hoặc thân thẳng, gối/tay thẳng (bài giữ), camera thấy.
Hạn chế riêng: kipping của muscle-up chưa phân biệt được; bài đảo ngược chỉ đo độ thẳng hàng vai-hông-cổ chân; crow-pose chưa đo chân đã nhấc khỏi sàn; pistol chưa kiểm tra chân kia; hanging-leg-raise chưa đo đung đưa.
Chưa có bản nháp: 3 bài đo độ linh hoạt (`shoulder-flexion-test`, `pike-fold-test`, `overhead-squat-test`) vì chúng là bài đo góc, không phải bài chấm form (đo góc đã làm ở frontend, xem spec §37, §43).

## 6. Quy trình đưa vào dùng
1. **Backup DB, rồi nạp bản nháp** một lần trên DB cần dùng: chạy backend với `APP_SEED_MOTION_BENCHMARKS=true` (hoặc `--app.seed.motion-benchmarks=true`). Idempotent: bài đã có cấu hình thì không bị ghi đè, rule đã tồn tại thì bỏ qua. Chưa nạp lên DB chính.
2. **Coach** vào "AI Coaching & Motion": với từng rule, quay video thật hoặc nhập mẫu vào Rule Tester, chỉnh ngưỡng nếu cần, xác nhận nguồn, **gửi duyệt**.
3. **Người duyệt** (Admin hoặc Coach khác theo quy trình hiện có) xuất bản. Chỉ bản PUBLISHED mới chạy khi tập/đo thật.
4. Làm theo thứ tự ưu tiên: bài mandatory L1 (incline-push-up, australian-pull-up, dead-hang, plank, bodyweight-squat, assisted-squat, push-up), rồi L2, rồi L3.

## 7. Câu hỏi cho Coach
- Camera đặt bên nào, cách bao xa, góc nhìn cố định hay cho chọn?
- Ngưỡng đáy từng bài có hợp với chuẩn "rep hợp lệ" mà trung tâm áp dụng không (squat song song, dips vai ngang khuỷu, pull-up cằm qua xà)?
- Mức nào thì rep bị coi là KHÔNG hợp lệ (làm mất rep) và mức nào chỉ cảnh báo? Bản nháp chỉ cho phép "mất rep" với độ sâu và đủ chu kỳ.
- Bài nào cần rule bổ sung ở mục 4?
