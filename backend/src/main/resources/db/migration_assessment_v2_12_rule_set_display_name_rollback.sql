-- Gỡ bước 12: bỏ cột tên hiển thị của bộ quy tắc (mất các tên Coach đã đặt).
SET @has := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'rule_sets' AND column_name = 'display_name');
SET @ddl := IF(@has = 1, 'ALTER TABLE rule_sets DROP COLUMN display_name', 'SELECT 1');
PREPARE s FROM @ddl; EXECUTE s; DEALLOCATE PREPARE s;
