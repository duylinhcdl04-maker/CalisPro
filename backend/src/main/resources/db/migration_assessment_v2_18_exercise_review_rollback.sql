-- Gỡ bước 18: bỏ bảng chỉnh sửa chờ duyệt và hai cột theo dõi bản nháp của Coach (mất các chỉnh sửa đang chờ duyệt).
DROP TABLE IF EXISTS exercise_revisions;
SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'exercises' AND COLUMN_NAME = 'author_id');
SET @ddl := IF(@has = 1, 'ALTER TABLE exercises DROP COLUMN author_id', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'exercises' AND COLUMN_NAME = 'submitted_at');
SET @ddl := IF(@has = 1, 'ALTER TABLE exercises DROP COLUMN submitted_at', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
