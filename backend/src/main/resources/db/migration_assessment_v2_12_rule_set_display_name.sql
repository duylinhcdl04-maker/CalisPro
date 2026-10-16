-- =========================================================================================
-- CALISHEALTH - ASSESSMENT FRAMEWORK V2 - BƯỚC 12: TÊN HIỂN THỊ CỦA BỘ QUY TẮC
-- Coach đặt tên cho từng phiên bản (vd. "Siết ngưỡng L2 mùa hè") để Admin nhìn danh sách là biết bản đó đổi gì.
-- Cột nullable, chỉ để hiển thị: mã `code` và `version` vẫn là khóa để engine tìm bộ quy tắc. Idempotent; gỡ bằng 99_rollback.
-- =========================================================================================
SET NAMES utf8mb4;

SET @has := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'rule_sets' AND column_name = 'display_name');
SET @ddl := IF(@has = 0, 'ALTER TABLE rule_sets ADD COLUMN display_name VARCHAR(120) NULL AFTER version', 'SELECT 1');
PREPARE s FROM @ddl; EXECUTE s; DEALLOCATE PREPARE s;

SELECT id, code, version, display_name FROM rule_sets ORDER BY id;
