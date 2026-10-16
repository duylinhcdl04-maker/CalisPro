-- =========================================================================================
-- CALISHEALTH - ASSESSMENT FRAMEWORK V2 - BƯỚC 4: TEMPLATE THỰC HÀNH (BASELINE) - DRAFT
-- Hấp thụ bộ test của v1 (assessment_test_items của CALISHEALTH_PERIODIC_V1) vào khung chung (Quyết định 3, V2 §10.4):
-- mỗi bài test là một câu hỏi item_kind = PRACTICAL_TEST của template CALISHEALTH_PERIODIC_FW2 (type PERIODIC, purpose BASELINE).
-- config_json: exerciseCode, competency, metric, levelMin/levelMax (rank 0..4), mandatory, protocol (từ protocol_json của v1).
-- Chạy sau 01_schema + 02_seed; MỘT LẦN (gỡ bằng 99_rollback). Không đụng dữ liệu v1.
-- =========================================================================================
SET NAMES utf8mb4;

SET @v2 := (SELECT id FROM rule_sets WHERE code = 'LEVEL_ENGINE_V2' AND version = 1);
SELECT IF(@v2 IS NULL, (SELECT 'chua chay 02_seed' UNION ALL SELECT 'abort'), 'ok') AS guard_v2_seeded;
SET @v1t := (SELECT id FROM assessment_templates WHERE code = 'CALISHEALTH_PERIODIC_V1');
SELECT IF(@v1t IS NULL, (SELECT 'v1 chua seed CALISHEALTH_PERIODIC_V1 (APP_SEED_ENABLED=true)' UNION ALL SELECT 'abort'), 'ok') AS guard_v1_periodic;

INSERT INTO assessment_templates (code, name, display_name, description, type, status, version, estimated_duration, max_total_score, created_at, updated_at, purpose)
SELECT 'CALISHEALTH_PERIODIC_FW2', 'Đánh giá thực hành - Baseline (Framework V2)', 'Bài kiểm tra thực hành',
       'Camera + Motion Rule Engine. Baseline đầu tiên xác minh level (staircase, attempt độc lập). Bằng chứng không đủ/không tin cậy => RETEST_REQUIRED/INCOMPLETE, không bao giờ là hạ level.',
       'PERIODIC', 'DRAFT', 1, 30, 100, NOW(6), NOW(6), 'BASELINE'
WHERE NOT EXISTS (SELECT 1 FROM assessment_templates WHERE code = 'CALISHEALTH_PERIODIC_FW2');
SET @tpl := (SELECT id FROM assessment_templates WHERE code = 'CALISHEALTH_PERIODIC_FW2');

INSERT IGNORE INTO assessment_sections (template_id, code, title, sort_order) VALUES (@tpl, 'TESTS', 'Bài kiểm tra thực hành', 1);

INSERT IGNORE INTO assessment_questions (question_code, question_text, instruction, question_type, input_type, category, required, active, default_weight, config_json,
                                         owner_template_id, version, evidence_role, item_kind, answer_kind, reliability_class, created_at, updated_at)
SELECT CONCAT('PA2_', e.code), CONCAT('Bài test: ', COALESCE(e.display_name, e.name)), NULL, 'JSON', 'PRACTICAL_TEST', ti.competency_code,
       ti.mandatory, TRUE, 0,
       JSON_OBJECT('exerciseCode', e.code, 'competency', ti.competency_code, 'metric', ti.metric,
                   'levelMin', CAST(SUBSTRING(ti.level_min, 2) AS UNSIGNED), 'levelMax', CAST(SUBSTRING(ti.level_max, 2) AS UNSIGNED),
                   'mandatory', IF(ti.mandatory = 1, CAST('true' AS JSON), CAST('false' AS JSON)), 'protocol', IF(ti.protocol_json IS NULL, JSON_OBJECT(), ti.protocol_json)),
       @tpl, 1, 'PERFORMANCE_LADDER', 'PRACTICAL_TEST', 'LADDER_VALUE', 'HIGH', NOW(6), NOW(6)
FROM assessment_test_items ti
JOIN exercises e ON e.id = ti.exercise_id
WHERE ti.template_id = @v1t;

INSERT INTO assessment_template_questions (template_id, question_id, sort_order, weight, required, section_title, section_id)
SELECT @tpl, q.id, ti.sort_order, 0, ti.mandatory, 'Bài kiểm tra thực hành', s.id
FROM assessment_test_items ti JOIN exercises e ON e.id = ti.exercise_id
JOIN assessment_questions q ON q.question_code = CONCAT('PA2_', e.code) COLLATE utf8mb4_0900_ai_ci
JOIN assessment_sections s ON s.template_id = @tpl AND s.code = 'TESTS'
WHERE ti.template_id = @v1t
  AND NOT EXISTS (SELECT 1 FROM assessment_template_questions x WHERE x.template_id = @tpl AND x.question_id = q.id);

-- Tham số Baseline bổ sung (không viết cứng trong Java)
INSERT IGNORE INTO engine_parameters (rule_set_id, param_key, param_value, param_text, source_type, source_reference) VALUES
 (@v2, 'baseline.reliability.minPose',       0.60, NULL, 'PRODUCT_RULE', 'Ngưỡng độ tin cậy đo một attempt (kế thừa [LAR] §11.2)'),
 (@v2, 'baseline.reliability.minVisibility', 0.50, NULL, 'PRODUCT_RULE', NULL),
 (@v2, 'baseline.reliability.minTracked',    0.80, NULL, 'PRODUCT_RULE', NULL);

SELECT @tpl AS periodic_template_id, (SELECT COUNT(*) FROM assessment_template_questions WHERE template_id = @tpl) AS practical_tests;
