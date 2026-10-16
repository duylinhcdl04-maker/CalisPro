-- =========================================================================================
-- CALISHEALTH - TÀI KHOẢN COACH DO ADMIN TẠO (mật khẩu tạm + bắt buộc đổi mật khẩu ở lần đăng nhập đầu)
-- Thay cho luồng "nộp hồ sơ Coach để Admin duyệt": Admin tạo tài khoản Coach, hệ thống gửi email mật khẩu tạm,
-- Coach đăng nhập lần đầu BẮT BUỘC đổi mật khẩu trước khi dùng bất kỳ chức năng nào khác.
-- Bảng riêng (không sửa bảng users của Hibernate) nên không ảnh hưởng ứng dụng đang chạy.
-- Idempotent; gỡ bằng DROP TABLE user_password_policy. Không đụng dữ liệu cũ.
-- =========================================================================================
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS user_password_policy (
    user_id         BIGINT UNSIGNED NOT NULL PRIMARY KEY,
    must_change     TINYINT(1)      NOT NULL DEFAULT 0 COMMENT '1 = đang dùng mật khẩu tạm, phải đổi trước khi dùng hệ thống',
    temp_expires_at DATETIME(6)     NULL COMMENT 'mật khẩu tạm hết hạn lúc này (quá hạn: không đăng nhập được, Admin cấp lại)',
    issued_by       BIGINT UNSIGNED NULL COMMENT 'Admin cấp mật khẩu tạm',
    issued_at       DATETIME(6)     NULL,
    changed_at      DATETIME(6)     NULL COMMENT 'lần đổi mật khẩu gần nhất do chính người dùng',
    CONSTRAINT fk_upp_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

SELECT (SELECT COUNT(*) FROM user_password_policy) AS policies;
