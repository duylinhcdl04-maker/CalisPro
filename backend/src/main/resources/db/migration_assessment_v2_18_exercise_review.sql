-- =========================================================================================
-- CALISHEALTH - BƯỚC 18: DUYỆT ĐỘNG TÁC DO COACH SOẠN
-- exercises.author_id / submitted_at: bài nháp do Coach tạo và thời điểm gửi, để Admin thấy trong hàng chờ việc. Xóa khi bài được xuất bản hoặc xóa.
-- exercise_revisions: chỉnh sửa của Coach trên bài ĐÃ XUẤT BẢN không áp ngay mà chờ Admin duyệt.
--   status: PENDING (chờ duyệt) | APPROVED (đã áp dụng) | REJECTED (bị từ chối, có ghi chú) | SUPERSEDED (bị thay bằng bản gửi mới hơn của cùng bài)
--   payload_json: toàn bộ nội dung chỉnh sửa Coach gửi (cùng dạng với yêu cầu sửa bài); khi duyệt hệ thống áp đúng nội dung này.
-- Idempotent: thêm cột/bảng nếu chưa có (Hibernate ddl-auto có thể đã tự thêm cột). Gỡ bằng bản rollback.
-- =========================================================================================
SET NAMES utf8mb4;

SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'exercises' AND COLUMN_NAME = 'author_id');
SET @ddl := IF(@has = 0, 'ALTER TABLE exercises ADD COLUMN author_id BIGINT UNSIGNED NULL', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'exercises' AND COLUMN_NAME = 'submitted_at');
SET @ddl := IF(@has = 0, 'ALTER TABLE exercises ADD COLUMN submitted_at DATETIME(6) NULL', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS exercise_revisions (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    exercise_id  BIGINT UNSIGNED NOT NULL,
    author_id    BIGINT UNSIGNED NOT NULL,
    payload_json LONGTEXT        NOT NULL,
    status       VARCHAR(20)     NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING | APPROVED | REJECTED | SUPERSEDED',
    notes        VARCHAR(1000)   NULL COMMENT 'lý do từ chối của Admin',
    created_at   DATETIME(6)     NOT NULL,
    decided_by   BIGINT UNSIGNED NULL,
    decided_at   DATETIME(6)     NULL,
    KEY idx_exrev_status (status, created_at),
    KEY idx_exrev_exercise (exercise_id, status),
    CONSTRAINT fk_exrev_exercise FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE,
    CONSTRAINT fk_exrev_author FOREIGN KEY (author_id) REFERENCES users (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

SELECT (SELECT COUNT(*) FROM exercise_revisions) AS revisions, (SELECT COUNT(*) FROM exercises WHERE author_id IS NOT NULL) AS coach_drafts;
