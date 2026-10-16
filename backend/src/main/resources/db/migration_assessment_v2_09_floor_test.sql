-- =========================================================================================
-- CALISHEALTH - ASSESSMENT FRAMEWORK V2 - BƯỚC 9: BÀI NỀN CHO LADDER LEGS (PERIODIC) - DRAFT
-- Ladder chỉ cho điểm 0 khi stage THẤP NHẤT có bằng chứng "không đạt" tường minh (I19). Stage thấp nhất của LEGS là assisted-squat
-- nhưng template thực hành chưa có bài này, nên người yếu đi ở LEGS chỉ nhận điểm null và Periodic không phát hiện được suy giảm.
-- Thêm bài PA2_assisted-squat (không bắt buộc, L0) làm "bài nền"; Baseline staircase không dùng (chỉ bài bắt buộc), Periodic dùng.
-- Chạy sau 01..08; idempotent; gỡ bằng 99_rollback (rollback xoá cả template). Không đụng dữ liệu v1.
-- =========================================================================================
SET NAMES utf8mb4;

SET @tpl := (SELECT id FROM assessment_templates WHERE code = 'CALISHEALTH_PERIODIC_FW2');
SELECT IF(@tpl IS NULL, (SELECT 'chua chay 04_seed_periodic' UNION ALL SELECT 'abort'), 'ok') AS guard_periodic_template;
SELECT IF(NOT EXISTS (SELECT 1 FROM exercises WHERE code = 'assisted-squat'), (SELECT 'thieu exercise assisted-squat' UNION ALL SELECT 'abort'), 'ok') AS guard_exercise;

INSERT IGNORE INTO assessment_questions (question_code, question_text, instruction, question_type, input_type, category, required, active, default_weight, config_json,
                                         owner_template_id, version, evidence_role, item_kind, answer_kind, reliability_class, created_at, updated_at)
SELECT 'PA2_assisted-squat', CONCAT('Bài test: ', COALESCE(e.display_name, e.name)), NULL, 'JSON', 'PRACTICAL_TEST', 'LEGS', FALSE, TRUE, 0,
       JSON_OBJECT('exerciseCode', e.code, 'competency', 'LEGS', 'metric', 'VALID_REPS', 'levelMin', 0, 'levelMax', 0, 'mandatory', CAST('false' AS JSON),
                   'protocol', JSON_OBJECT('restSec', 150, 'capRatio', 1.5, 'instruction', 'Squat có bám cố định hỗ trợ, đủ biên độ. Bài nền để đo mức thấp nhất của chân.')),
       @tpl, 1, 'PERFORMANCE_LADDER', 'PRACTICAL_TEST', 'LADDER_VALUE', 'HIGH', NOW(6), NOW(6)
FROM exercises e WHERE e.code = 'assisted-squat' AND @tpl IS NOT NULL;

INSERT INTO assessment_template_questions (template_id, question_id, sort_order, weight, required, section_title, section_id)
SELECT @tpl, q.id, COALESCE((SELECT x.sort_order FROM assessment_template_questions x JOIN assessment_questions b ON b.id = x.question_id
                             WHERE x.template_id = @tpl AND b.question_code = 'PA2_bodyweight-squat'), 100), 0, FALSE, 'Bài kiểm tra thực hành', s.id
FROM assessment_questions q JOIN assessment_sections s ON s.template_id = @tpl AND s.code = 'TESTS'
WHERE q.question_code = 'PA2_assisted-squat' AND @tpl IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM assessment_template_questions y WHERE y.template_id = @tpl AND y.question_id = q.id);

SELECT (SELECT COUNT(*) FROM assessment_template_questions WHERE template_id = @tpl) AS practical_tests_expect_26;
