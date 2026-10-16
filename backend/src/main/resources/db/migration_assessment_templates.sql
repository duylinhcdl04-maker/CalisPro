-- =========================================================================================
-- CALISHEALTH: BÀI ĐÁNH GIÁ DO ADMIN CẤU HÌNH + BÀI TEST ĐẦU VÀO (ONBOARDING)
-- - assessment_templates: bài đánh giá (có phiên bản), trạng thái DRAFT/PUBLISHED/ARCHIVED
-- - assessment_template_questions: câu hỏi trong bài (thứ tự, trọng số, bắt buộc, phần/bước)
-- - assessment_score_rules: quy tắc chấm điểm theo khoảng giá trị (theo bài, hoặc mặc định của câu hỏi)
-- - assessment_template_levels: các mức trình độ theo khoảng điểm của từng bài
-- - assessment_onboarding_settings: bài nào là bài test đầu vào cho người dùng mới
-- Chạy 1 lần trên MySQL 8 (khóa dùng BIGINT UNSIGNED khớp schema hiện có).
-- =========================================================================================

CREATE TABLE assessment_templates (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    code                VARCHAR(80)     NOT NULL,
    name                VARCHAR(255)    NOT NULL,
    display_name        VARCHAR(255)    NULL,
    description         TEXT            NULL,
    type                VARCHAR(50)     NOT NULL DEFAULT 'INITIAL',
    status              VARCHAR(20)     NOT NULL DEFAULT 'DRAFT',
    version             INT             NOT NULL DEFAULT 1,
    root_id             BIGINT UNSIGNED NULL COMMENT 'Bài gốc của chuỗi phiên bản (NULL = chính nó là bài gốc)',
    parent_id           BIGINT UNSIGNED NULL COMMENT 'Phiên bản được sao chép ra bản này',
    estimated_duration  INT             NOT NULL DEFAULT 10,
    tags_json           TEXT            NULL,
    target_audience_json TEXT           NULL,
    schedule_json       TEXT            NULL,
    max_total_score     DECIMAL(6,2)    NOT NULL DEFAULT 100,
    pass_score          DECIMAL(6,2)    NULL,
    created_at          DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at          DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    published_at        DATETIME(6)     NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_assessment_templates_code (code),
    KEY idx_assessment_templates_status (status),
    KEY idx_assessment_templates_root (root_id),
    CONSTRAINT chk_assessment_templates_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- Ngân hàng câu hỏi: bổ sung trường của Admin Builder
ALTER TABLE assessment_questions
    ADD COLUMN description       TEXT            NULL AFTER question_text,
    ADD COLUMN instruction       TEXT            NULL AFTER description,
    ADD COLUMN input_type        VARCHAR(30)     NULL COMMENT 'Loại câu hỏi phía Admin: SINGLE_CHOICE, NUMERIC_INPUT, PERFORMANCE_TEST...' AFTER question_type,
    ADD COLUMN default_weight    DECIMAL(6,2)    NOT NULL DEFAULT 10,
    ADD COLUMN config_json       LONGTEXT        NULL COMMENT 'performanceConfig / measurementConfig / ratingConfig',
    ADD COLUMN owner_template_id BIGINT UNSIGNED NULL COMMENT 'NULL = câu hỏi trong ngân hàng; có giá trị = câu hỏi riêng của 1 bài',
    ADD COLUMN version           INT             NOT NULL DEFAULT 1,
    ADD CONSTRAINT fk_assessment_questions_owner FOREIGN KEY (owner_template_id) REFERENCES assessment_templates (id) ON DELETE CASCADE;

ALTER TABLE assessment_question_options
    ADD COLUMN score DECIMAL(6,2) NULL COMMENT 'Điểm 0-100 khi chọn đáp án này';

CREATE TABLE assessment_template_questions (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    template_id   BIGINT UNSIGNED NOT NULL,
    question_id   BIGINT UNSIGNED NOT NULL,
    sort_order    INT             NOT NULL,
    weight        DECIMAL(6,2)    NOT NULL DEFAULT 0,
    required      TINYINT(1)      NOT NULL DEFAULT 1,
    section_title VARCHAR(150)    NULL COMMENT 'Phần/bước hiển thị cho học viên',
    PRIMARY KEY (id),
    UNIQUE KEY uq_template_question (template_id, question_id),
    KEY idx_template_questions_order (template_id, sort_order),
    CONSTRAINT fk_template_questions_template FOREIGN KEY (template_id) REFERENCES assessment_templates (id) ON DELETE CASCADE,
    CONSTRAINT fk_template_questions_question FOREIGN KEY (question_id) REFERENCES assessment_questions (id) ON DELETE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE assessment_score_rules (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    template_id BIGINT UNSIGNED NULL COMMENT 'NULL = quy tắc mặc định của câu hỏi trong ngân hàng',
    question_id BIGINT UNSIGNED NOT NULL,
    operator    VARCHAR(10)     NOT NULL,
    min_value   DECIMAL(12,2)   NULL,
    max_value   DECIMAL(12,2)   NULL,
    exact_value VARCHAR(100)    NULL,
    score       DECIMAL(6,2)    NOT NULL,
    label       VARCHAR(150)    NULL,
    sort_order  INT             NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_score_rules_template_question (template_id, question_id),
    KEY idx_score_rules_question (question_id),
    CONSTRAINT fk_score_rules_template FOREIGN KEY (template_id) REFERENCES assessment_templates (id) ON DELETE CASCADE,
    CONSTRAINT fk_score_rules_question FOREIGN KEY (question_id) REFERENCES assessment_questions (id) ON DELETE CASCADE,
    CONSTRAINT chk_score_rules_operator CHECK (operator IN ('GT', 'GTE', 'LT', 'LTE', 'BETWEEN', 'EQ')),
    CONSTRAINT chk_score_rules_score CHECK (score >= 0 AND score <= 100)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE assessment_template_levels (
    id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    template_id    BIGINT UNSIGNED NOT NULL,
    code           VARCHAR(30)     NOT NULL,
    name           VARCHAR(100)    NOT NULL,
    min_score      DECIMAL(6,2)    NOT NULL,
    max_score      DECIMAL(6,2)    NOT NULL,
    description    TEXT            NULL,
    recommendation TEXT            NULL,
    color_scheme   VARCHAR(20)     NULL,
    badge_label    VARCHAR(50)     NULL,
    sort_order     INT             NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_template_levels_template (template_id, sort_order),
    CONSTRAINT fk_template_levels_template FOREIGN KEY (template_id) REFERENCES assessment_templates (id) ON DELETE CASCADE,
    CONSTRAINT chk_template_levels_range CHECK (min_score <= max_score)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- Cấu hình bài test đầu vào (1 dòng duy nhất, id = 1)
CREATE TABLE assessment_onboarding_settings (
    id                 BIGINT UNSIGNED NOT NULL,
    active_template_id BIGINT UNSIGNED NULL,
    mandatory          TINYINT(1)      NOT NULL DEFAULT 1 COMMENT '1 = bắt buộc làm trước khi vào app; 0 = cho phép bỏ qua',
    block_when_missing TINYINT(1)      NOT NULL DEFAULT 0 COMMENT 'Khi chưa chọn bài: 0 = cho vào app, 1 = chặn ở màn chờ',
    round              INT             NOT NULL DEFAULT 1 COMMENT 'Tăng lên khi admin yêu cầu tất cả làm lại',
    updated_at         DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    updated_by         VARCHAR(150)    NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_onboarding_settings_template FOREIGN KEY (active_template_id) REFERENCES assessment_templates (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
INSERT INTO assessment_onboarding_settings (id, active_template_id, mandatory, block_when_missing, round) VALUES (1, NULL, 1, 0, 1);

-- Phiên làm bài: gắn bài đánh giá + phiên bản, mục đích, nguồn dữ liệu và kết quả tổng
ALTER TABLE assessment_sessions
    ADD COLUMN template_id      BIGINT UNSIGNED NULL AFTER assessment_type_id,
    ADD COLUMN template_version INT             NULL AFTER template_id,
    ADD COLUMN purpose          VARCHAR(30)     NOT NULL DEFAULT 'GENERAL' COMMENT 'ONBOARDING | GENERAL',
    ADD COLUMN source           VARCHAR(30)     NOT NULL DEFAULT 'SELF_REPORTED' COMMENT 'SELF_REPORTED | AI_MEASURED | COACH_VERIFIED',
    ADD COLUMN onboarding_round INT             NULL,
    ADD COLUMN overall_score    DECIMAL(6,2)    NULL,
    ADD COLUMN level_code       VARCHAR(30)     NULL,
    ADD KEY idx_assessment_sessions_purpose (user_id, purpose, status),
    ADD KEY idx_assessment_sessions_template (template_id),
    ADD CONSTRAINT fk_assessment_sessions_template FOREIGN KEY (template_id) REFERENCES assessment_templates (id) ON DELETE SET NULL;

-- Bản ghi bỏ qua bài test đầu vào (khi admin cho phép bỏ qua)
ALTER TABLE assessment_sessions DROP CHECK chk_assessment_sessions_status;
ALTER TABLE assessment_sessions ADD CONSTRAINT chk_assessment_sessions_status
    CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'ABANDONED', 'EXPIRED', 'SKIPPED'));
