-- =========================================================================================
-- CALISHEALTH: SỬA KHÓA NGOẠI exercise_ai_profiles -> exercises
-- Bảng do Hibernate tạo với exercise_id BIGINT (có dấu), không khớp exercises.id BIGINT UNSIGNED
-- nên khóa ngoại chưa từng được tạo (log khởi động báo "incompatible").
-- Kiểm tra trước: SELECT COUNT(*) FROM exercise_ai_profiles p LEFT JOIN exercises e ON e.id = p.exercise_id WHERE e.id IS NULL; -- phải = 0
-- =========================================================================================

ALTER TABLE exercise_ai_profiles
    MODIFY COLUMN exercise_id BIGINT UNSIGNED NOT NULL;

CREATE INDEX idx_exercise_ai_profiles_exercise ON exercise_ai_profiles (exercise_id);

ALTER TABLE exercise_ai_profiles
    ADD CONSTRAINT fk_exercise_ai_profiles_exercise FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE;
