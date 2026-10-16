-- =========================================================================================
-- CALISHEALTH - ASSESSMENT FRAMEWORK V2 - BƯỚC 6: CHẤM ĐIỂM MOBILITY TỪ GÓC ĐO (ANGLE_DEG) - DRAFT
-- MOBILITY = trung bình điểm của 3 bài đo góc; điểm bài = min(100, góc đo / góc mục tiêu * 100) ([LAR] §5.3: gập vai 180° => 100).
-- Góc đo > mobility.capRatio * góc mục tiêu là số đo phi lý => INVALID_MEASUREMENT (không phải điểm cao, không phải bằng chứng tiêu cực).
-- Hai góc mục tiêu pike-fold / overhead-squat là ĐỀ XUẤT KHỞI ĐIỂM (COACHING_BENCHMARK): Coach phải xác nhận trước khi publish rule set.
-- Chạy sau 01..05; idempotent; gỡ bằng 99_rollback. Không đụng dữ liệu v1.
-- =========================================================================================
SET NAMES utf8mb4;

SET @v2 := (SELECT id FROM rule_sets WHERE code = 'LEVEL_ENGINE_V2' AND version = 1);
SELECT IF(@v2 IS NULL, (SELECT 'chua chay 02_seed' UNION ALL SELECT 'abort'), 'ok') AS guard_v2_seeded;

INSERT IGNORE INTO engine_parameters (rule_set_id, param_key, param_value, source_type, source_reference)
SELECT @v2, k.param_key, k.param_value, k.source_type, k.note FROM (
    SELECT 'mobility.target.shoulder-flexion-test' param_key, 180 param_value, 'COACHING_BENCHMARK' source_type,
           'Góc gập vai (áp lưng tường, tay thẳng). [LAR] §5.3: 180° => 100 điểm' note
    UNION ALL SELECT 'mobility.target.pike-fold-test', 90, 'COACHING_BENCHMARK',
           'ĐỀ XUẤT KHỞI ĐIỂM - Coach xác nhận. Góc GẬP hông (đứng thẳng = 0°, càng gập càng lớn), gối thẳng'
    UNION ALL SELECT 'mobility.target.overhead-squat-test', 135, 'COACHING_BENCHMARK',
           'ĐỀ XUẤT KHỞI ĐIỂM - Coach xác nhận. Góc GẬP gối khi squat sâu tay giơ cao; gót nhấc chỉ ghi nhận lỗi chất lượng, chưa trừ điểm'
    UNION ALL SELECT 'mobility.capRatio', 1.5, 'PRODUCT_RULE',
           'Góc đo > capRatio * mục tiêu là số đo phi lý (INVALID_MEASUREMENT); kế thừa protocol.capRatio của v1') k
WHERE @v2 IS NOT NULL;

SELECT param_key, param_value, source_type FROM engine_parameters WHERE rule_set_id = @v2 AND param_key LIKE 'mobility.%' ORDER BY param_key;
