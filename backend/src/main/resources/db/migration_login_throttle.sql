-- =========================================================================================
-- CALISHEALTH - KHOÁ TÀI KHOẢN KHI ĐĂNG NHẬP SAI NHIỀU LẦN
-- Đếm số lần nhập sai mật khẩu theo tài khoản trong một cửa sổ thời gian; quá ngưỡng thì khoá tạm (app.security.login.*).
-- Bảng riêng, không sửa bảng users. Chưa chạy migration thì đăng nhập vẫn hoạt động nhưng KHÔNG có khoá (ghi cảnh báo vào log).
-- Idempotent; gỡ bằng DROP TABLE user_login_throttle.
-- =========================================================================================
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS user_login_throttle (
    user_id         BIGINT UNSIGNED NOT NULL PRIMARY KEY,
    failed_count    INT             NOT NULL DEFAULT 0,
    first_failed_at DATETIME(6)     NULL COMMENT 'đầu cửa sổ đếm; quá app.security.login.window-minutes thì đếm lại từ 1',
    last_failed_at  DATETIME(6)     NULL,
    locked_until    DATETIME(6)     NULL COMMENT 'còn trong tương lai = đang bị khoá (kể cả nhập đúng mật khẩu cũng bị từ chối)',
    CONSTRAINT fk_ult_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

SELECT (SELECT COUNT(*) FROM user_login_throttle) AS rows_now;
