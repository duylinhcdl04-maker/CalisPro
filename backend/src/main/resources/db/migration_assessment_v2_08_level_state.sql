-- =========================================================================================
-- CALISHEALTH - ASSESSMENT FRAMEWORK V2 - BƯỚC 8: TRẠNG THÁI LEVEL V2 + LỊCH SỬ QUYẾT ĐỊNH (PERIODIC THƯỜNG KỲ)
-- user_level_state_v2: level hiện tại đã xác minh, EWMA và chuỗi suy giảm (V2 KHÔNG ghi user_level_state của v1 cho tới khi kích hoạt).
-- level_decisions_v2: lịch sử mọi quyết định (Baseline, Periodic, Coach xác nhận L4); căn cứ cho cổng Stability và cho "lịch sử level".
-- Tham số Periodic: cửa sổ/ngưỡng báo ốm. Chạy sau 01..07; idempotent; gỡ bằng 99_rollback. Không đụng dữ liệu v1.
-- =========================================================================================
SET NAMES utf8mb4;

SET @v2 := (SELECT id FROM rule_sets WHERE code = 'LEVEL_ENGINE_V2' AND version = 1);
SELECT IF(@v2 IS NULL, (SELECT 'chua chay 02_seed' UNION ALL SELECT 'abort'), 'ok') AS guard_v2_seeded;

CREATE TABLE IF NOT EXISTS user_level_state_v2 (
    user_id          BIGINT UNSIGNED NOT NULL PRIMARY KEY,
    level_code       VARCHAR(10)     NOT NULL,
    level_rank       INT             NOT NULL,
    status           VARCHAR(20)     NOT NULL DEFAULT 'VERIFIED' COMMENT 'VERIFIED | RETURNING',
    source           VARCHAR(20)     NOT NULL DEFAULT 'AI_MEASURED' COMMENT 'AI_MEASURED | COACH_VERIFIED',
    ewma             DECIMAL(6, 2)   NULL,
    consecutive_below INT            NOT NULL DEFAULT 0,
    last_session_id  BIGINT UNSIGNED NULL,
    last_assessed_at DATETIME(6)     NOT NULL,
    updated_at       DATETIME(6)     NOT NULL,
    CONSTRAINT fk_ulsv2_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS level_decisions_v2 (
    id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id              BIGINT UNSIGNED NOT NULL,
    session_id           BIGINT UNSIGNED NOT NULL,
    kind                 VARCHAR(20)     NOT NULL COMMENT 'BASELINE | PERIODIC | COACH_L4',
    outcome              VARCHAR(30)     NOT NULL COMMENT 'DECIDED | RETEST_REQUIRED | INSUFFICIENT_EVIDENCE',
    decision             VARCHAR(20)     NULL COMMENT 'PROMOTED | MAINTAINED | REGRESSED (chỉ khi DECIDED)',
    level_before         VARCHAR(10)     NULL,
    level_after          VARCHAR(10)     NULL,
    candidate_rank       INT             NULL COMMENT 'level cao nhất có Overall >= promote_min (chưa giới hạn bước)',
    competency_pass_ranks VARCHAR(20)    NULL COMMENT 'các rank mà cổng Competency PASS, vd "3,4" (căn cứ cho Stability của lần sau)',
    overall              DECIMAL(6, 2)   NULL,
    ewma                 DECIMAL(6, 2)   NULL,
    consecutive_below    INT             NULL,
    reason_code          VARCHAR(60)     NULL,
    pending_coach_rank   INT             NULL,
    created_at           DATETIME(6)     NOT NULL,
    KEY idx_ld2_user (user_id, id),
    CONSTRAINT fk_ld2_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_ld2_session FOREIGN KEY (session_id) REFERENCES assessment_sessions (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

INSERT IGNORE INTO engine_parameters (rule_set_id, param_key, param_value, source_type, source_reference)
SELECT @v2, k.param_key, k.param_value, 'PRODUCT_RULE', k.note FROM (
    SELECT 'periodic.illness.windowDays' param_key, 3 param_value, 'Check-in trong N ngày gần nhất báo năng lượng rất thấp => lần đo kém không tính vào xu hướng giảm ([LAR] §12.2)' note
    UNION ALL SELECT 'periodic.illness.maxEnergy', 2, 'Mức năng lượng <= giá trị này (thang check-in) bị coi là ốm/mệt nặng') k
WHERE @v2 IS NOT NULL;

SELECT (SELECT COUNT(*) FROM user_level_state_v2) AS states, (SELECT COUNT(*) FROM level_decisions_v2) AS decisions,
       (SELECT COUNT(*) FROM engine_parameters WHERE rule_set_id = @v2 AND param_key LIKE 'periodic.illness.%') AS params_expect_2;
