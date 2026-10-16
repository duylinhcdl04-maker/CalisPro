# Script e2e tạm (chưa chỉnh chu) - lưu lại để làm tiếp

Viết trong lúc phát triển Assessment V2; đường dẫn và id còn cứng, chạy bằng Node 25 + Edge headless qua CDP. Cần: backend thử (cổng 8099, DB `calishealth_le_test`, `ASSESSMENT_V2_ENABLED=true`),
Vite tạm cổng 5199 proxy sang 8099 (file `vite.e2e.config.ts` tự tạo rồi xoá), biến `E2E_*` (xem phần đầu `e2e_lock.mjs`: `E2E_OUT`, `E2E_JWT_SECRET` = JWT_SECRET trong `.env`...).

- `e2e_lock.mjs`: phần đầu (52 dòng) là khung dùng chung: mở Edge, CDP, token mint HS256, các hàm `go/clickText/setValue/shot/text`. Các script khác = 52 dòng đầu + phần thân riêng.
- `seed_user.sh <email>`: tạo user đã onboarding v1 và sàng lọc an toàn CLEARED qua API (in ra id).
- `api_climb.mjs`: leo staircase Baseline bằng API với số liệu tốt tới bậc `STOP_AT` (env `JWT`, `U`).
- `e2e_base2*.mjs`: chạy Baseline trên giao diện với khung xương tổng hợp (`../../dev-tools/fakePose.ts` bundle IIFE `FakePose`; cần cờ Edge chống throttle, xem phần đầu).
- `e2e_i/s/k/b/c/p2`: khảo sát V2, sàng lọc, Coach xác minh an toàn, Baseline, ghi hình L4, đo định kỳ.
- `motion_probe.mjs`: gửi khung tổng hợp thẳng vào Motion Runtime để cô lập lỗi.
Bẫy đã gặp: dọn dữ liệu bằng SQL có nháy đơn trong CONCAT dễ hỏng; kết quả mysql trên Windows có `\r` (dùng `tr -d '\r'`); heredoc chứa ký tự lạ dễ làm bash lỗi, dùng Write.
