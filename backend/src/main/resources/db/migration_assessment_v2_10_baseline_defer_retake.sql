-- =========================================================================================
-- CALISHEALTH - ASSESSMENT FRAMEWORK V2 - BƯỚC 10: "BỎ QUA, ĐO SAU" VÀ ĐO LẠI LẦN ĐẦU
-- baseline_deferrals: người dùng chọn chưa làm bài đo thực hành (dùng level tạm từ khảo sát); remind_after = khi nào nhắc lại nhẹ nhàng.
-- Tham số: cửa sổ đo lại (7 ngày), số lần đo lại tối đa (1), số ngày giữa các lần nhắc sau khi bỏ qua (7).
-- Việc đo lại KHÔNG cần bảng mới: suy ra từ các phiên Baseline đã hoàn tất (assessment_sessions).
-- Chạy sau 01..09; idempotent; gỡ bằng 99_rollback. Không đụng dữ liệu v1.
-- =========================================================================================
SET NAMES utf8mb4;

SET @v2 := (SELECT id FROM rule_sets WHERE code = 'LEVEL_ENGINE_V2' AND version = 1);
SELECT IF(@v2 IS NULL, (SELECT 'chua chay 02_seed' UNION ALL SELECT 'abort'), 'ok') AS guard_v2_seeded;
SELECT IF(EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'user_level_state_v2'),
          'ok', (SELECT 'chua chay 08_level_state' UNION ALL SELECT 'abort')) AS guard_08_applied;

CREATE TABLE IF NOT EXISTS baseline_deferrals (
    user_id       BIGINT UNSIGNED NOT NULL PRIMARY KEY,
    deferred_at   DATETIME(6)     NOT NULL,
    remind_after  DATETIME(6)     NOT NULL,
    defer_count   INT             NOT NULL DEFAULT 1,
    CONSTRAINT fk_bd_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

INSERT IGNORE INTO engine_parameters (rule_set_id, param_key, param_value, source_type, source_reference)
SELECT @v2, k.param_key, k.param_value, 'PRODUCT_RULE', k.note FROM (
    SELECT 'baseline.retake.windowDays' param_key, 7 param_value, 'Quyết định sản phẩm: kết quả Baseline đầu thấp hơn level tạm thì được đo lại trong N ngày kể từ lần đo đầu' note
    UNION ALL SELECT 'baseline.retake.max', 1, 'Quyết định sản phẩm: tối đa N lần đo lại; level cuối là mức CAO NHẤT của các lần đo hợp lệ'
    UNION ALL SELECT 'baseline.defer.remindDays', 7, 'Quyết định sản phẩm: sau khi chọn "bỏ qua, đo sau", nhắc lại sau N ngày') k
WHERE @v2 IS NOT NULL;

SELECT (SELECT COUNT(*) FROM baseline_deferrals) AS deferrals,
       (SELECT COUNT(*) FROM engine_parameters WHERE rule_set_id = @v2 AND (param_key LIKE 'baseline.retake.%' OR param_key = 'baseline.defer.remindDays')) AS params_expect_3;
