-- =========================================================================================
-- CALISHEALTH - BƯỚC 17: CỜ "TÍCH HỢP AI" CỦA TỪNG ĐỘNG TÁC
-- exercises.ai_enabled: Coach/Admin bật khi soạn động tác. Chỉ khi bật (và bài đã có cấu hình đo: loại chuyển động, ngưỡng đỉnh/đáy, đủ 3 điểm khớp)
-- thì học viên mới thấy "Tập với AI Coach" ở trang chi tiết bài tập, được dùng camera ở trang luyện tập, và bài mới tính là "đo được bằng AI" khi soạn giáo án.
-- Bài đã đo được bằng AI trước khi có cờ này được bật sẵn (giữ nguyên hành vi hiện tại); các bài khác mặc định TẮT.
-- Idempotent: thêm cột nếu chưa có (Hibernate ddl-auto có thể đã tự thêm). Gỡ bằng bản rollback.
-- =========================================================================================
SET NAMES utf8mb4;

SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'exercises' AND COLUMN_NAME = 'ai_enabled');
SET @ddl := IF(@has = 0, 'ALTER TABLE exercises ADD COLUMN ai_enabled TINYINT(1) NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE exercises e SET e.ai_enabled = 1
WHERE e.ai_enabled = 0 AND EXISTS (
    SELECT 1 FROM exercise_ai_profiles p
    WHERE p.exercise_id = e.id AND p.movement_type IS NOT NULL AND p.rep_top_threshold IS NOT NULL AND p.rep_bottom_threshold IS NOT NULL
      AND p.rep_metric_json IS NOT NULL AND JSON_VALID(p.rep_metric_json) AND JSON_LENGTH(JSON_EXTRACT(p.rep_metric_json, '$.points')) >= 3);

SELECT COUNT(*) AS tong_bai, SUM(ai_enabled) AS bai_bat_ai FROM exercises;
