# Kích hoạt Assessment V2 chạy thật

Cập nhật 2026-10-12. V2 đang TẮT (`ASSESSMENT_V2_ENABLED=false`). Tài liệu này là thứ tự bật, cách kiểm tra và cách quay lại.

## Điều kiện (làm theo đúng thứ tự)
1. **Sao lưu DB chính** (`mysqldump --single-transaction calishealth > backend/backup/...`).
2. **Duyệt bộ quy tắc `LEVEL_ENGINE_V2`** (hiện DRAFT, ngưỡng là giá trị tạm). Cách: Coach vào "Bộ quy tắc đánh giá V2", bấm "Tạo bản nháp từ bản này", chỉnh nếu cần, "Gửi Admin duyệt"; Admin mở bản chờ duyệt và chọn duyệt (kích hoạt). Người soạn không tự duyệt được.
3. **Áp migration `migration_assessment_v2_10_baseline_defer_retake.sql`** (bảng hoãn đo, tham số đo lại). Bắt buộc, nếu thiếu thì hành trình đánh giá báo lỗi.
4. **Áp migration `migration_assessment_v2_11_publish_templates.sql`** (xuất bản 3 template V2). Template V2 không xuất bản được bằng nút "Phát hành" của trình tạo bài test vì kiểm tra v1 đòi cấu hình chấm điểm v1.
5. **Đặt biến môi trường `ASSESSMENT_V2_ENABLED=true`** rồi khởi động lại backend. (Không bật `ASSESSMENT_V2_ALLOW_DRAFT` ở môi trường thật.)

## Khi V2 bật thì chuyện gì xảy ra
- Học viên mới không bị chặn bởi bài test đầu vào v1 nữa: vào thẳng ứng dụng, thẻ hành trình nhắc làm sàng lọc an toàn, khảo sát năng lực, và bài đo thực hành (tuỳ chọn, có "bỏ qua, đo sau").
- Kết quả V2 được sao chép sang v1 (`V2LevelBridge`): level, năng lực, ràng buộc, mục tiêu, skill tree và chu kỳ tập mới. Trang Lộ trình, giáo án mẫu theo level và thông tin level đọc từ đó.
- Chưa làm khảo sát thì chưa có level (banner "Bạn chưa được phân level"); chưa thể tạo chu kỳ theo level.

## Chưa sẵn sàng (không chặn việc bật, nhưng cần biết)
- **Bài đo bằng camera cần rule chấm form đã XUẤT BẢN.** DB chính hiện 0 rule PUBLISHED. Khi chưa có, lần đo camera có thể bị coi là không đủ tin cậy. Coach thử và gửi duyệt, Admin xuất bản các rule nháp (xem MOTION_RULES_L1_L3.md). Trong lúc đó học viên dùng "bỏ qua, đo sau".
- Chưa thử với người thật trước camera.
- Người dùng cũ đã có level v1 (từ bài test đầu vào v1) giữ nguyên; V2 chỉ ghi đè khi họ làm bài V2 và có kết luận hợp lệ.

## Kiểm tra sau khi bật
1. Tạo tài khoản học viên mới, vào `/home`: thấy thẻ hành trình, không bị chuyển sang `/onboarding`.
2. Làm sàng lọc rồi khảo sát: trang Lộ trình hiện "Level tạm thời" và có chu kỳ tập; DB có dòng `level_evaluations` với `basis = 'V2_INITIAL'`.
3. Dashboard Admin, mục "Việc cần xử lý": thấy các bản chờ duyệt.
4. Log backend không có dòng "Cầu nối V2 -> v1 lỗi".

## Quay lại
- Đặt `ASSESSMENT_V2_ENABLED=false` và khởi động lại. Dữ liệu V2 giữ nguyên, người dùng quay về bài test đầu vào v1 (nếu chưa làm). Muốn đưa template về nháp chạy phần cuối của `migration_assessment_v2_99_rollback.sql`.
- Dữ liệu đã sao chép sang v1 (level, chu kỳ) là dữ liệu thật của học viên, không tự xoá khi tắt V2.

## Bổ sung: xuất bản template V2 bằng nút "Phát hành" (2026-10-12)
Kiểm tra phát hành của template V2 (CALISHEALTH_SAFETY_V1, CALISHEALTH_INITIAL_FW2, CALISHEALTH_PERIODIC_FW2) không còn đòi cấu hình chấm điểm và mức trình độ của v1; điều kiện duy nhất là bộ quy tắc `LEVEL_ENGINE_V2` đã được duyệt và kích hoạt. Vì vậy sau khi duyệt bộ quy tắc, Admin phát hành 3 bài bằng nút "Phát hành" như bình thường; `migration_assessment_v2_11` chỉ còn là cách làm bằng SQL.
**Lưu ý môi trường:** `backend/.env` đặt `DB_NAME`. Kiểm tra backend đang chạy trên database nào trước khi duyệt hoặc áp migration (chạy trên `calishealth_le_test` thì mọi thay đổi nằm ở database test).
