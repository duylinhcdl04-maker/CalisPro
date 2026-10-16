# Hướng dẫn thử Assessment V2 với camera thật

Mục đích: kiểm tra MediaPipe có nhận diện đúng người thật không, hệ thống đếm rep và tính thời gian giữ có đúng không, và các cảnh báo form có hợp lý không. Mọi kiểm chứng trước đây dùng "người ảo" nên chưa chứng minh được điều này.
Môi trường thử dùng **DB thử `calishealth_le_test`**, không đụng DB chính.

## 1. Chuẩn bị (5 phút)
- Máy có webcam (hoặc điện thoại làm webcam), Chrome hoặc Edge, MySQL đang chạy.
- Một khoảng trống đủ nằm hoặc đứng duỗi hết người, cách camera **2 đến 3 mét**.
- Mặc đồ bó gọn, nền sau lưng đơn giản, đủ sáng, ánh sáng không ngược sau lưng.
- Dụng cụ nếu có: ghế hoặc bục chắc (hít đất nghiêng), xà đơn hoặc xà thấp (pull-up). Không có thì chỉ làm các bài tập sàn, xem mục 4.

## 2. Bật môi trường
Mở PowerShell tại thư mục `Frontend` và chạy:

```powershell
.\scripts\start-v2-camera-test.ps1 -ShortRest -PublishRules
```

- `-ShortRest`: rút thời gian nghỉ giữa các lần đo còn 10 giây (mặc định 120 giây, thử sẽ rất lâu).
- `-PublishRules`: xuất bản các rule chấm form nháp **trên DB thử** để thử luôn điểm form và cảnh báo. Bỏ cờ này nếu chỉ muốn thử đếm rep.
- Script tạo học viên thử `camera.test@example.test` / `Calis@2026Test` (làm lại từ đầu mỗi lần chạy), rồi mở hai cửa sổ: backend (chờ báo `Started CalisHealthApplication`, khoảng 30 đến 60 giây) và Vite.
- Mở **http://localhost:5199**, đăng nhập bằng tài khoản trên, cho phép trình duyệt dùng camera.

## 3. Các bước thử (theo thứ tự trên Trang chủ, thẻ "Bước tiếp theo của bạn")
1. **Sàng lọc an toàn:** trả lời thật (hoặc chọn toàn "Không" nếu bạn khoẻ mạnh).
2. **Khảo sát năng lực:** trả lời gần đúng thực lực của bạn (số rep tối đa các bài).
3. **Bài đo thực hành (Baseline):** đây là phần chính. Mỗi bài: đặt camera, bấm "Bắt đầu đo", làm bài, bấm "Kết thúc bài".
   - Camera đặt **phía bên TRÁI của người tập** (nhìn nghiêng, vai trái gần camera). Rule nháp chỉ dùng khớp bên trái.
   - Toàn thân phải nằm trong khung suốt bài.
   - Bạn có thể dừng bất cứ lúc nào; bấm "Dừng vì đau / khó chịu" cũng được.

## 4. Nếu thiếu dụng cụ
Thứ tự bài do hệ thống quyết định (bắt đầu bằng hít đất nghiêng, plank, pull-up, dips...). Bài nào không làm được thì bấm "Dừng vì đau / khó chịu" (lần đo đó không bị tính là kết quả kém) hoặc dừng buổi thử và ghi lại các bài đã làm. Chỉ cần thử **4 đến 6 bài** bạn làm được là đủ để đánh giá nhận diện và đếm rep.

## 5. Những điều cần quan sát và ghi lại
| # | Quan sát | Cách kiểm tra |
|---|---|---|
| 1 | Khung xương vẽ có bám đúng người không | Nhìn đường nối khớp trên video khi đang đo |
| 2 | **Số rep hệ thống đếm so với số rep thật** | Góc trên trái video hiện "Rep đúng"; so với số bạn thực sự làm |
| 3 | Rep nông (không xuống đủ sâu) có bị bỏ không | Cố ý làm 3 rep nông, xem có được đếm không |
| 4 | Bài giữ (plank, dead-hang): thời gian giữ | Tự bấm giờ, so với số giây hệ thống ghi |
| 5 | Cảnh báo form (nếu bật `-PublishRules`) | Cố ý võng lưng khi plank hoặc hít đất: có cảnh báo không, có quá gắt khi bạn làm đúng không |
| 6 | Quay **bên phải** về phía camera | Lần đo có bị loại không (dự kiến là bị loại vì rule dùng khớp trái) |
| 7 | Độ mượt | Giật lag, FPS thấp, camera mất nhận diện giữa chừng |
| 8 | Kết quả cuối (level) | Có hợp lý với thực lực của bạn không |

Ghi mỗi bài: tên bài, số rep (hoặc giây) thực tế, số hệ thống đếm, và ảnh chụp màn hình khi có gì lạ. Gửi lại cho tôi để chỉnh ngưỡng và rule.

## 6. Khi xong
- Đóng hai cửa sổ PowerShell vừa mở.
- Nếu đã dùng `-ShortRest`: chạy `.\scripts\start-v2-camera-test.ps1 -RestoreRest` để trả thời gian nghỉ về 120 giây (nếu để thấp, một số test tự động của backend sẽ hỏng).
- Nếu đã dùng `-PublishRules`: các rule trên DB thử đang ở trạng thái đã xuất bản. Muốn đưa về nháp, nhờ tôi hoàn lại (DB chính không bị ảnh hưởng).

## 7. Nếu gặp sự cố
- Cổng 8099 hoặc 5199 bận: tắt tiến trình đang giữ cổng rồi chạy lại.
- Không đăng nhập được: chạy lại script (tạo lại tài khoản thử).
- Camera không bật: kiểm tra quyền camera của trình duyệt cho `localhost:5199`; đóng các ứng dụng khác đang dùng webcam.
- Trang báo "tính năng chưa được bật": backend chưa chạy xong hoặc chạy sai chế độ, đợi cửa sổ backend báo `Started` rồi tải lại.
