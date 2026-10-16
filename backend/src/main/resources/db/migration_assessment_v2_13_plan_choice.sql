-- =========================================================================================
-- CALISHEALTH - BƯỚC 13: LỰA CHỌN GIÁO ÁN VÀ HƯỚNG TẬP CỦA HỌC VIÊN
-- plan_mode: NULL = chưa chọn (chờ bước quyết định sau khi có level) | SYSTEM = tập theo giáo án hệ thống | SELF = tự tạo giáo án.
--            Khi chưa chọn hoặc chọn SELF, hệ thống KHÔNG tự sinh chu kỳ mới đè lên giáo án của học viên.
-- training_focus: NULL | HEALTH | SKILL - chỉ để gợi ý bài tập, KHÔNG ảnh hưởng cách tính level.
-- Cột nullable, idempotent; gỡ bằng bản rollback tương ứng.
-- =========================================================================================
SET NAMES utf8mb4;

SET @has := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'user_training_constraints' AND column_name = 'plan_mode');
SET @ddl := IF(@has = 0, 'ALTER TABLE user_training_constraints ADD COLUMN plan_mode VARCHAR(10) NULL', 'SELECT 1');
PREPARE s FROM @ddl; EXECUTE s; DEALLOCATE PREPARE s;

SET @has := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'user_training_constraints' AND column_name = 'training_focus');
SET @ddl := IF(@has = 0, 'ALTER TABLE user_training_constraints ADD COLUMN training_focus VARCHAR(10) NULL', 'SELECT 1');
PREPARE s FROM @ddl; EXECUTE s; DEALLOCATE PREPARE s;

SELECT COUNT(*) AS constraints_rows, SUM(plan_mode IS NULL) AS chua_chon FROM user_training_constraints;
