-- =========================================================================================
-- CALISHEALTH - ASSESSMENT FRAMEWORK V2 - BƯỚC 5: COACH XÁC NHẬN L4 + VIDEO BẰNG CHỨNG
-- L4 (ELITE) không do camera tự xác minh (level.L4.requiresCoachVerified): camera đủ mọi cổng => L3 VERIFIED + gói review chờ Coach.
-- Gói review THAM CHIẾU attempt/metric gốc (không sao chép, không sửa). Video là bằng chứng cho Coach, chỉ lưu khi user đồng ý ghi hình.
-- Chạy sau 01..04; idempotent. Gỡ bằng 99_rollback. Không đụng dữ liệu v1.
-- =========================================================================================
SET NAMES utf8mb4;

SET @v2 := (SELECT id FROM rule_sets WHERE code = 'LEVEL_ENGINE_V2' AND version = 1);
SELECT IF(@v2 IS NULL, (SELECT 'chua chay 02_seed' UNION ALL SELECT 'abort'), 'ok') AS guard_v2_seeded;
SELECT IF(NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'assessment_attempts'),
          (SELECT 'chua chay 01_schema' UNION ALL SELECT 'abort'), 'ok') AS guard_v2_schema;

-- Video của attempt (url Cloudinary do user upload trực tiếp bằng chữ ký có phạm vi; hết hạn lưu thì url bị xoá)
SET @ddl := IF(EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'assessment_attempts' AND column_name = 'video_url'),
               'SELECT 1',
               'ALTER TABLE assessment_attempts ADD COLUMN video_url VARCHAR(1000) NULL, ADD COLUMN video_uploaded_at DATETIME(6) NULL, ADD COLUMN video_expires_at DATETIME(6) NULL');
PREPARE s FROM @ddl; EXECUTE s; DEALLOCATE PREPARE s;

-- Đồng ý ghi hình: phải có TRƯỚC khi ghi; mỗi phiên một dòng
CREATE TABLE IF NOT EXISTS assessment_recording_consents (
    id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    session_id     BIGINT UNSIGNED NOT NULL,
    user_id        BIGINT UNSIGNED NOT NULL,
    granted        BOOLEAN         NOT NULL,
    retention_days INT             NOT NULL,
    created_at     DATETIME(6)     NOT NULL,
    UNIQUE KEY uk_consent_session (session_id),
    CONSTRAINT fk_consent_session FOREIGN KEY (session_id) REFERENCES assessment_sessions (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- Gói review L4. status: PENDING | CONFIRMED | REJECTED | RETEST_REQUESTED | SUPERSEDED | EXPIRED
CREATE TABLE IF NOT EXISTS l4_review_packages (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id             BIGINT UNSIGNED NOT NULL,
    source_session_id   BIGINT UNSIGNED NOT NULL,
    source_type         VARCHAR(20)     NOT NULL,
    rule_set_id         BIGINT          NOT NULL,
    verified_level_code VARCHAR(30)     NOT NULL,
    pending_level_code  VARCHAR(30)     NOT NULL,
    status              VARCHAR(25)     NOT NULL DEFAULT 'PENDING',
    evidence_json       JSON            NOT NULL,
    created_at          DATETIME(6)     NOT NULL,
    expires_at          DATETIME(6)     NOT NULL,
    decided_by_coach_id BIGINT          NULL,
    decided_at          DATETIME(6)     NULL,
    decision_reason     TEXT            NULL,
    coach_override_id   BIGINT          NULL,
    confirmed_level_code VARCHAR(30)    NULL,
    KEY idx_l4_user_status (user_id, status),
    KEY idx_l4_status_expiry (status, expires_at),
    CONSTRAINT fk_l4_session FOREIGN KEY (source_session_id) REFERENCES assessment_sessions (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

INSERT IGNORE INTO engine_parameters (rule_set_id, param_key, param_value, source_type, source_reference)
SELECT @v2, k.param_key, k.param_value, 'PRODUCT_RULE', k.note FROM (
    SELECT 'l4.review.expiry_days' param_key, 14 param_value, 'Gói review L4 quá hạn thì EXPIRED (không phải bằng chứng tiêu cực)' note
    UNION ALL SELECT 'l4.video.retention_days', 30, 'Số ngày lưu video bằng chứng L4 (sau đó xoá url)') k
WHERE @v2 IS NOT NULL;

SELECT (SELECT COUNT(*) FROM l4_review_packages) AS l4_packages,
       (SELECT COUNT(*) FROM engine_parameters WHERE rule_set_id = @v2 AND param_key LIKE 'l4.%') AS l4_params;
