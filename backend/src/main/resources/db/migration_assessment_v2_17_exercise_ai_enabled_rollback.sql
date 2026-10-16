-- Gỡ bước 17: bỏ cột cờ tích hợp AI (mất lựa chọn bật/tắt AI của từng động tác).
SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'exercises' AND COLUMN_NAME = 'ai_enabled');
SET @ddl := IF(@has = 1, 'ALTER TABLE exercises DROP COLUMN ai_enabled', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
