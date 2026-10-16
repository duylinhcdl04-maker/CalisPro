-- Gỡ bước 13: bỏ cột lựa chọn giáo án và hướng tập (mất lựa chọn của học viên).
SET @has := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'user_training_constraints' AND column_name = 'plan_mode');
SET @ddl := IF(@has = 1, 'ALTER TABLE user_training_constraints DROP COLUMN plan_mode', 'SELECT 1');
PREPARE s FROM @ddl; EXECUTE s; DEALLOCATE PREPARE s;
SET @has := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'user_training_constraints' AND column_name = 'training_focus');
SET @ddl := IF(@has = 1, 'ALTER TABLE user_training_constraints DROP COLUMN training_focus', 'SELECT 1');
PREPARE s FROM @ddl; EXECUTE s; DEALLOCATE PREPARE s;
