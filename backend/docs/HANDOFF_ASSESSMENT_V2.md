# Bàn giao Assessment V2 (cập nhật 2026-10-11)

Spec: `ASSESSMENT_FRAMEWORK_V2.md` (§30–§43). Rule chấm form nháp: `MOTION_RULES_L1_L3.md`. Script e2e tạm: `Frontend/scripts/e2e-scratch/README.md`.

## 1. Đã xong và đã kiểm chứng
- Chuỗi giao diện học viên V2: sàng lọc an toàn → khảo sát → Baseline → đo định kỳ, kèm **thẻ nhắc hành trình** ở Trang chủ và trang Đánh giá, nhãn "Cần làm" ở menu (chỉ nhắc, không chặn; §42).
- Coach: xác minh an toàn, xác nhận L4, soạn rule set; Admin: duyệt rule set, tài khoản Coach.
- Ghi hình L4, đo góc linh hoạt bằng khung xương (frontend), Stability bằng chất lượng buổi tập thật (phương án (a), §41).
- **Chuỗi L4 đã chạy thật trong trình duyệt với khung xương tổng hợp** (§43): hộp thoại đồng ý → 7 lần đo (gồm 3 bài đo góc) → video gắn đúng attempt → gói L4 → Coach xác nhận → học viên L4 COACH_VERIFIED. Baseline qua L1→L2→L3 trên giao diện cũng đã chạy.
- Rule chấm form nháp **22 bài, 70 rule** (đợt 1: 12 bài L0–L3; đợt 2: 10 bài L3–L4/kỹ năng), tất cả qua Rule Tester thật trên DB scratch; test cơ học `MotionBenchmarkSpecsTest`.
- Sửa lỗi engine: `visibilityAvg = 0` khi chưa có rule PUBLISHED làm mọi lần đo bị loại `LANDMARKS_NOT_VISIBLE`.
- Backend **281 test, 0 lỗi, 1 skipped**; `tsc` sạch; `npm run check:angles` và `npm run check:fakepose` xanh.
- DB chính `calishealth`: đã áp `migration_coach_accounts`, `migration_login_throttle`, `_08`, `_09` (backup trong `backend/backup`). V2 vẫn **tắt** (`ASSESSMENT_V2_ENABLED=false`).

## 2. Chưa làm / chưa kiểm chứng
- **Chưa thử với người thật trước camera** (MediaPipe thật); mọi kiểm chứng giao diện dùng khung xương tổng hợp (chứng minh luồng, không chứng minh nhận diện). Có thể dùng video quay sẵn làm camera giả (`--use-file-for-fake-video-capture`, cần clip y4m) khi có clip.
- **Bản nháp rule form chưa nạp vào DB chính** (cần backup và đồng ý): chạy backend với `--app.seed.motion-benchmarks=true` một lần. DB chính hiện **0 rule PUBLISHED**; push-up có 7 rule PENDING_REVIEW chưa ai duyệt.
- Bộ quy tắc đánh giá `LEVEL_ENGINE_V2` vẫn DRAFT, chưa có Coach chỉnh và Admin duyệt (7 hạng mục). Ngưỡng hiện là giá trị tạm.
- Stability: phương án (b) (bắt buộc) chưa làm; chưa hiển thị "còn thiếu bao nhiêu buổi tập đạt".
- Nối V2 vào bảng v1 khi kích hoạt; job xoá video Cloudinary hết hạn (cần lưu `public_id`); dọn code CoachApplication; đưa secret khỏi `application.yml`.
- Hạn chế rule nháp: chỉ landmark bên TRÁI (camera đặt phía trái người tập); xem mục 4 của `MOTION_RULES_L1_L3.md`.
- Điều hướng đang là **nhắc**; chưa tự chuyển hướng/chặn sau đăng ký.

## 3. Phát hiện quan trọng
- Không có rule PUBLISHED thì điểm form không phản ánh kỹ thuật (đã sửa phần visibility, nhưng vẫn cần rule xuất bản).
- Góc phải tính với toạ độ x nhân tỉ lệ khung hình video (backend và frontend); bộ sinh khung tổng hợp có tham số `aspectRatio`.
- Edge headless cần cờ chống throttle và `Emulation.setFocusEmulationEnabled` để `requestAnimationFrame` chạy đủ nhanh.
- Staircase: mỗi bài ở L2–L4 đo 2 lần; `protocol.restSec` mặc định 120 giây giữa các lần đo. **Đã gặp:** nếu để `protocol.restSec` thấp khi chạy e2e thì `BaselineIntegrationTest.attemptsMustBeIndependent` hỏng; luôn khôi phục 120.

## 4. Trạng thái DB scratch `calishealth_le_test`
`protocol.restSec = 120`; mọi user/dữ liệu e2e đã xoá; **còn lại có chủ ý:** 70 rule DRAFT benchmark và cấu hình profile của 22 bài (do seeder tạo, đã chạy Rule Tester nên có `last_tested_at`), user admin id 2. Tiến trình thử đã tắt; `vite.e2e.config.ts` đã xoá.

## 5. Quyết định đã chốt (2026-10-12) và việc còn chờ
Đã chốt: Stability phương án (a); điều hướng chỉ nhắc; **không** xoá CoachApplication và **không** đưa secret khỏi `application.yml` (cấu hình khoá API bằng biến môi trường khi deploy); Coach soạn, Admin duyệt (đã áp dụng, spec §44); bản nháp rule 22 bài đã nạp DB chính (spec §45).
Còn chờ: kết quả thử camera thật (`HUONG_DAN_THU_CAMERA_THAT.md`); Coach/Admin cụ thể soạn và duyệt rule; Cloudinary xoá hay giữ theo hạn (đang giữ theo hạn).

## 6. Bổ sung 2026-10-12: bài đo tùy chọn (spec §46)
Backend xong, 294 test xanh (lỗi NPE `lastWasPartial` khi reason_code NULL đã sửa). Frontend sửa xong, tsc sạch, chưa e2e trình duyệt. Migration v2_10 chỉ áp scratch; áp DB chính cần backup + đồng ý. Còn: e2e UI cho defer/finish-early/đo lại, xử lý L0 khi bỏ qua, nối menu/home hiển thị nhãn "Level tạm thời", trang định kỳ chưa nhận biết user chỉ có level tạm.

## 7. Bổ sung 2026-10-12: đưa V2 chạy thật (spec §47)
Code đã xong và có test (cầu nối V2 -> v1, bỏ cổng onboarding v1 khi V2 bật, migration 11, runbook `KICH_HOAT_ASSESSMENT_V2.md`). **Chưa bật:** DB chính chưa áp migration 10 và 11; rule set `LEVEL_ENGINE_V2` chưa được duyệt (Coach gửi, Admin duyệt); chưa đặt `ASSESSMENT_V2_ENABLED=true`; chưa có rule chấm form PUBLISHED (bài đo camera cần).
