-- =========================================================================================
-- CALISHEALTH: CHUẨN HÓA DỮ LIỆU EXERCISE BUILDER THÀNH CÁC BẢNG RIÊNG
-- Giai đoạn chuyển động, nhóm cơ, khẩu lệnh, lỗi sai, ảnh giải phẫu, tag/dụng cụ/an toàn.
-- Chạy 1 lần trên MySQL 8 (khóa ngoại dùng BIGINT UNSIGNED cho khớp exercises.id / muscles.id).
-- =========================================================================================

-- 1. Cột kỹ thuật & an toàn trên bảng exercises
ALTER TABLE exercises
    ADD COLUMN display_name           VARCHAR(255) NULL AFTER name,
    ADD COLUMN training_category      VARCHAR(30)  NULL AFTER display_name,
    ADD COLUMN animation_url          VARCHAR(500) NULL AFTER thumbnail_url,
    ADD COLUMN setup_instructions     TEXT         NULL,
    ADD COLUMN execution_instructions TEXT         NULL,
    ADD COLUMN inhale_timing          VARCHAR(500) NULL,
    ADD COLUMN exhale_timing          VARCHAR(500) NULL,
    ADD COLUMN tempo                  VARCHAR(50)  NULL,
    ADD COLUMN contraindications      TEXT         NULL,
    ADD COLUMN general_considerations TEXT         NULL,
    ADD COLUMN builder_version        VARCHAR(20)  NULL COMMENT 'NULL = động tác cũ chưa lưu bằng Exercise Builder',
    ADD COLUMN ai_analysis_data       LONGTEXT     NULL COMMENT 'JSON cấu hình AI Motion soạn ở bước 5 Builder';

-- 2. Danh mục cơ: bổ sung tên tiếng Việt & mặt hiển thị trên sơ đồ giải phẫu
ALTER TABLE muscles
    ADD COLUMN name_vi VARCHAR(100) NULL AFTER name,
    ADD COLUMN side    VARCHAR(10)  NULL COMMENT 'FRONT / BACK / BOTH';

-- 3. Nhóm cơ của động tác: thêm vai trò STABILIZER và chi tiết kích hoạt
ALTER TABLE exercise_muscles DROP CHECK chk_exercise_muscles_role;
ALTER TABLE exercise_muscles
    ADD COLUMN activation_level      VARCHAR(20)  NULL COMMENT 'LOW / MODERATE / HIGH / VERY_HIGH',
    ADD COLUMN laterality            VARCHAR(20)  NULL COMMENT 'BILATERAL / LEFT / RIGHT / CENTRAL',
    ADD COLUMN expected_sensations   VARCHAR(255) NULL COMMENT 'CSV mã cảm giác nên có',
    ADD COLUMN unexpected_sensations VARCHAR(255) NULL COMMENT 'CSV mã cảm giác bất thường',
    ADD COLUMN user_guidance         VARCHAR(500) NULL,
    ADD COLUMN sort_order            INT          NOT NULL DEFAULT 0,
    ADD CONSTRAINT chk_exercise_muscles_role CHECK (role IN ('PRIMARY', 'SECONDARY', 'STABILIZER'));
CREATE INDEX idx_exercise_muscles_role ON exercise_muscles (muscle_id, role);

-- 4. Giai đoạn chuyển động (movement phases)
CREATE TABLE exercise_phases (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    exercise_id     BIGINT UNSIGNED NOT NULL,
    sort_order      INT             NOT NULL,
    name            VARCHAR(100)    NOT NULL,
    vietnamese_name VARCHAR(150)    NULL,
    description     TEXT            NULL,
    coaching_cue    TEXT            NULL,
    breathing       VARCHAR(30)     NULL,
    muscle_focus    VARCHAR(255)    NULL,
    media_url       VARCHAR(500)    NULL,
    PRIMARY KEY (id),
    KEY idx_exercise_phases_exercise (exercise_id),
    CONSTRAINT fk_exercise_phases_exercise FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- 5. Khẩu lệnh huấn luyện
CREATE TABLE exercise_coaching_cues (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    exercise_id BIGINT UNSIGNED NOT NULL,
    sort_order  INT             NOT NULL,
    content     TEXT            NOT NULL,
    priority    VARCHAR(20)     NULL,
    category    VARCHAR(30)     NULL,
    PRIMARY KEY (id),
    KEY idx_exercise_cues_exercise (exercise_id),
    CONSTRAINT fk_exercise_cues_exercise FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- 6. Lỗi sai thường gặp
CREATE TABLE exercise_common_mistakes (
    id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    exercise_id    BIGINT UNSIGNED NOT NULL,
    sort_order     INT             NOT NULL,
    name           VARCHAR(255)    NOT NULL,
    problem        TEXT            NULL,
    why_it_happens TEXT            NULL,
    correction     TEXT            NULL,
    severity       VARCHAR(20)     NULL,
    media_url      VARCHAR(500)    NULL,
    PRIMARY KEY (id),
    KEY idx_exercise_mistakes_exercise (exercise_id),
    CONSTRAINT fk_exercise_mistakes_exercise FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- 7. Ảnh minh họa cơ tác động
CREATE TABLE exercise_anatomy_images (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    exercise_id BIGINT UNSIGNED NOT NULL,
    sort_order  INT             NOT NULL,
    url         VARCHAR(500)    NOT NULL,
    caption     VARCHAR(255)    NULL,
    is_primary  TINYINT(1)      NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_exercise_anatomy_exercise (exercise_id),
    CONSTRAINT fk_exercise_anatomy_exercise FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- 8. Thuộc tính dạng danh sách: TAG / EQUIPMENT / SAFETY_CUE / STOP_CONDITION
CREATE TABLE exercise_attributes (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    exercise_id     BIGINT UNSIGNED NOT NULL,
    attribute_type  VARCHAR(30)     NOT NULL,
    sort_order      INT             NOT NULL,
    attribute_value VARCHAR(500)    NOT NULL,
    PRIMARY KEY (id),
    KEY idx_exercise_attributes_exercise (exercise_id),
    KEY idx_exercise_attributes_type_value (attribute_type, attribute_value),
    CONSTRAINT fk_exercise_attributes_exercise FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE,
    CONSTRAINT chk_exercise_attributes_type CHECK (attribute_type IN ('TAG', 'EQUIPMENT', 'SAFETY_CUE', 'STOP_CONDITION'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
