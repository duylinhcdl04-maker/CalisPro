-- Phân loại bài tập theo phần của buổi tập (khởi động / bài chính / bài bổ trợ / thả lỏng & đo linh hoạt): cột exercises.session_roles.
-- Idempotent: thêm cột nếu chưa có (Hibernate ddl-auto có thể đã tự thêm), chỉ điền cho bài chưa phân loại.
-- Giá trị ban đầu lấy từ cách các giáo án mẫu hiện có đang dùng bài đó, mở rộng cho bài chính thành bổ trợ (trừ bài kỹ năng khó) và ngược lại.
SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'exercises' AND COLUMN_NAME = 'session_roles');
SET @ddl := IF(@has = 0, 'ALTER TABLE exercises ADD COLUMN session_roles VARCHAR(60) NULL', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE exercises SET session_roles = 'MAIN,ACCESSORY' WHERE code = 'knee-push-up' AND session_roles IS NULL;
UPDATE exercises SET session_roles = 'MAIN,ACCESSORY' WHERE code = 'push-up' AND session_roles IS NULL;
UPDATE exercises SET session_roles = 'MAIN,ACCESSORY' WHERE code = 'diamond-push-up' AND session_roles IS NULL;
UPDATE exercises SET session_roles = 'MAIN,ACCESSORY' WHERE code = 'archer-push-up' AND session_roles IS NULL;
UPDATE exercises SET session_roles = 'MAIN,ACCESSORY' WHERE code = 'dips' AND session_roles IS NULL;
UPDATE exercises SET session_roles = 'MAIN,ACCESSORY' WHERE code = 'pike-push-up' AND session_roles IS NULL;
UPDATE exercises SET session_roles = 'MAIN' WHERE code = 'handstand-push-up' AND session_roles IS NULL;
UPDATE exercises SET session_roles = 'MAIN,ACCESSORY' WHERE code = 'dead-hang' AND session_roles IS NULL;
UPDATE exercises SET session_roles = 'MAIN,ACCESSORY' WHERE code = 'australian-pull-up' AND session_roles IS NULL;
UPDATE exercises SET session_roles = 'MAIN,ACCESSORY' WHERE code = 'pull-up' AND session_roles IS NULL;
UPDATE exercises SET session_roles = 'MAIN,ACCESSORY' WHERE code = 'chin-up' AND session_roles IS NULL;
UPDATE exercises SET session_roles = 'MAIN' WHERE code = 'muscle-up' AND session_roles IS NULL;
UPDATE exercises SET session_roles = 'WARMUP,MAIN,ACCESSORY' WHERE code = 'bodyweight-squat' AND session_roles IS NULL;
UPDATE exercises SET session_roles = 'MAIN,ACCESSORY' WHERE code = 'lunges' AND session_roles IS NULL;
UPDATE exercises SET session_roles = 'MAIN' WHERE code = 'pistol-squat' AND session_roles IS NULL;
UPDATE exercises SET session_roles = 'MAIN,ACCESSORY' WHERE code = 'plank' AND session_roles IS NULL;
UPDATE exercises SET session_roles = 'MAIN,ACCESSORY' WHERE code = 'hollow-body-hold' AND session_roles IS NULL;
UPDATE exercises SET session_roles = 'MAIN,ACCESSORY' WHERE code = 'hanging-leg-raise' AND session_roles IS NULL;
UPDATE exercises SET session_roles = 'MAIN,ACCESSORY' WHERE code = 'l-sit' AND session_roles IS NULL;
UPDATE exercises SET session_roles = 'MAIN,ACCESSORY' WHERE code = 'dragon-flag' AND session_roles IS NULL;
UPDATE exercises SET session_roles = 'MAIN,ACCESSORY' WHERE code = 'handstand' AND session_roles IS NULL;
UPDATE exercises SET session_roles = 'MAIN' WHERE code = 'planche' AND session_roles IS NULL;
UPDATE exercises SET session_roles = 'MAIN' WHERE code = 'front-lever' AND session_roles IS NULL;
UPDATE exercises SET session_roles = 'MAIN,COOLDOWN' WHERE code = 'archer-pull-up-test' AND session_roles IS NULL;
UPDATE exercises SET session_roles = 'MAIN,ACCESSORY' WHERE code = 'incline-push-up' AND session_roles IS NULL;
UPDATE exercises SET session_roles = 'MAIN,ACCESSORY' WHERE code = 'pseudo-planche-push-up' AND session_roles IS NULL;
UPDATE exercises SET session_roles = 'MAIN' WHERE code = 'straight-bar-dip' AND session_roles IS NULL;
UPDATE exercises SET session_roles = 'MAIN' WHERE code = 'freestanding-handstand-push-up' AND session_roles IS NULL;
UPDATE exercises SET session_roles = 'WARMUP,MAIN,ACCESSORY' WHERE code = 'scapular-pull-up' AND session_roles IS NULL;
UPDATE exercises SET session_roles = 'MAIN,ACCESSORY' WHERE code = 'negative-pull-up' AND session_roles IS NULL;
UPDATE exercises SET session_roles = 'MAIN' WHERE code = 'chest-to-bar-pull-up' AND session_roles IS NULL;
UPDATE exercises SET session_roles = 'MAIN' WHERE code = 'explosive-pull-up' AND session_roles IS NULL;
UPDATE exercises SET session_roles = 'MAIN,ACCESSORY' WHERE code = 'assisted-squat' AND session_roles IS NULL;
UPDATE exercises SET session_roles = 'MAIN,ACCESSORY' WHERE code = 'bulgarian-split-squat' AND session_roles IS NULL;
UPDATE exercises SET session_roles = 'MAIN,ACCESSORY' WHERE code = 'shrimp-squat' AND session_roles IS NULL;
UPDATE exercises SET session_roles = 'WARMUP,MAIN,ACCESSORY' WHERE code = 'wall-pike-hold' AND session_roles IS NULL;
UPDATE exercises SET session_roles = 'MAIN,ACCESSORY' WHERE code = 'crow-pose' AND session_roles IS NULL;
UPDATE exercises SET session_roles = 'MAIN,ACCESSORY' WHERE code = 'chest-to-wall-handstand' AND session_roles IS NULL;
UPDATE exercises SET session_roles = 'WARMUP,COOLDOWN' WHERE code = 'shoulder-flexion-test' AND session_roles IS NULL;
UPDATE exercises SET session_roles = 'WARMUP,COOLDOWN' WHERE code = 'pike-fold-test' AND session_roles IS NULL;
UPDATE exercises SET session_roles = 'COOLDOWN' WHERE code = 'overhead-squat-test' AND session_roles IS NULL;
