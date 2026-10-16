-- =========================================================================================
-- CALISHEALTH: CHỈ MỤC TỐI ƯU TRUY VẤN VÀ CHỐNG TRÙNG LẶP DỮ LIỆU (ANTI-DUPLICATION INDEXES)
-- Hỗ trợ tìm kiếm siêu tốc (<1ms) ngay cả khi có hàng triệu động tác, giáo án và quy tắc AI
-- =========================================================================================

-- 1. BẢNG ĐỘNG TÁC (EXERCISES): Chống trùng tên (Slug) & Tối ưu lọc theo nhóm cơ / độ khó
-- Tạo cột normalized_slug nếu chưa có và đánh chỉ mục Unique
-- ALTER TABLE exercises ADD COLUMN IF NOT EXISTS normalized_slug VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_exercises_category_level ON exercises (category, level);
CREATE INDEX IF NOT EXISTS idx_exercises_movement_pattern ON exercises (movement_pattern);
-- UNIQUE INDEX chống trùng lặp tên động tác sau khi chuẩn hóa không dấu:
CREATE UNIQUE INDEX IF NOT EXISTS uq_exercises_normalized_slug ON exercises (normalized_slug);

-- 2. BẢNG QUY TẮC GÓC KHỚP AI (AI_MOTION_JOINT_RULES):
-- Chống trùng lặp theo công thức: [exercise_id] + [joint_type] + [phase] + [condition_type]
-- Đảm bảo 1 bài tập không có 2 quy tắc góc giống hệt nhau
CREATE INDEX IF NOT EXISTS idx_ai_joint_rules_exercise ON ai_joint_rules (exercise_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_ai_joint_rules_signature ON ai_joint_rules (exercise_id, measurement, condition_type, target_value);

-- 3. BẢNG QUY TẮC BẮT LỖI SAI (AI_ERROR_RULES):
-- Chống trùng lặp tên lỗi sai trên cùng một bài tập
CREATE INDEX IF NOT EXISTS idx_ai_error_rules_exercise ON ai_error_rules (exercise_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_ai_error_rules_signature ON ai_error_rules (exercise_id, rule_name);

-- 4. BẢNG GIÁO ÁN LỘ TRÌNH (WORKOUT_PLANS):
-- Tối ưu lọc theo mục tiêu thể lực (GOAL) và cấp độ (FITNESS_LEVEL)
CREATE INDEX IF NOT EXISTS idx_workout_plans_goal_level ON workout_plans (goal, fitness_level, status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_workout_plans_normalized_slug ON workout_plans (normalized_slug);

-- 5. BẢNG BÀI TEST ĐÁNH GIÁ THỂ LỰC (ASSESSMENTS):
-- Tối ưu tìm kiếm bài test theo chỉ số đo lường (PRIMARY_METRIC)
CREATE INDEX IF NOT EXISTS idx_assessments_metric_audience ON assessments (primary_metric, target_audience);
CREATE UNIQUE INDEX IF NOT EXISTS uq_assessments_title_slug ON assessments (normalized_slug);

-- 6. BẢNG BỘ NHỚ ĐỆM NỘI DUNG AI (AI_GENERATION_CACHE) - Dùng khi không có Redis ngoài:
CREATE TABLE IF NOT EXISTS ai_generation_cache (
    cache_key VARCHAR(255) PRIMARY KEY,
    module_type VARCHAR(50) NOT NULL,
    cached_content LONGTEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    INDEX idx_ai_cache_module_expires (module_type, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
