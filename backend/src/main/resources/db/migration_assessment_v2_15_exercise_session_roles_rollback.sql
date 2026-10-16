-- Gỡ phân loại bài tập theo phần của buổi tập.
SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'exercises' AND COLUMN_NAME = 'session_roles');
SET @ddl := IF(@has = 1, 'ALTER TABLE exercises DROP COLUMN session_roles', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
