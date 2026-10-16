-- =========================================================================================
-- CALISHEALTH - BƯỚC 14: CÂU HỎI "BẠN MUỐN CẢI THIỆN SỨC KHỎE HAY KỸ NĂNG?" TRONG KHẢO SÁT BAN ĐẦU
-- Câu hỏi định hướng, CHỈ để gợi ý bài tập ("Đề xuất cho bạn"): không chấm điểm, không ảnh hưởng level hay giáo án hệ thống.
-- Giống câu IA2_STYLE: vai trò GOAL, không có ánh xạ năng lực, trọng số 0. Idempotent; gỡ bằng bản rollback.
-- =========================================================================================
SET NAMES utf8mb4;
SET @tpl := (SELECT id FROM assessment_templates WHERE code = 'CALISHEALTH_INITIAL_FW2');

INSERT INTO assessment_questions (question_code, question_text, instruction, question_type, input_type, category, unit, required, active, default_weight, min_value, max_value,
                                  config_json, owner_template_id, version, evidence_role, item_kind, answer_kind, reliability_class, created_at, updated_at)
SELECT 'IA2_TRAINING_FOCUS', 'Bạn muốn cải thiện điều gì khi tập calisthenics?', 'Chỉ dùng để gợi ý bài tập cho bạn, không ảnh hưởng level.',
       'SINGLE_CHOICE', 'SINGLE_CHOICE', 'GOALS', NULL, TRUE, TRUE, 0, NULL, NULL, NULL, @tpl, 1, 'GOAL', 'QUESTION', 'CATEGORICAL', NULL, NOW(6), NOW(6)
WHERE @tpl IS NOT NULL AND NOT EXISTS (SELECT 1 FROM assessment_questions WHERE question_code = 'IA2_TRAINING_FOCUS' AND owner_template_id = @tpl);

INSERT INTO assessment_question_options (question_id, option_code, option_label, sort_order, active)
SELECT q.id, o.code, o.label, o.ord, TRUE
FROM assessment_questions q JOIN (
  SELECT 'HEALTH' code, 'Sức khỏe (cơ thể khỏe mạnh, nền tảng vững)' label, 1 ord UNION ALL SELECT 'SKILL', 'Kỹ năng (chinh phục các động tác khó)', 2) o
WHERE q.question_code = 'IA2_TRAINING_FOCUS' AND q.owner_template_id = @tpl
  AND NOT EXISTS (SELECT 1 FROM assessment_question_options x WHERE x.question_id = q.id AND x.option_code = o.code);

INSERT INTO assessment_template_questions (template_id, question_id, sort_order, weight, required, section_title, section_id, visibility_json)
SELECT @tpl, q.id, 89, 0, TRUE, s.title, s.id, NULL
FROM assessment_questions q JOIN assessment_sections s ON s.template_id = @tpl AND s.code = 'GOALS'
WHERE q.question_code = 'IA2_TRAINING_FOCUS' AND q.owner_template_id = @tpl
  AND NOT EXISTS (SELECT 1 FROM assessment_template_questions x WHERE x.template_id = @tpl AND x.question_id = q.id);

SELECT q.question_code, tq.sort_order, tq.required, (SELECT COUNT(*) FROM assessment_question_options o WHERE o.question_id = q.id) AS options
FROM assessment_questions q JOIN assessment_template_questions tq ON tq.question_id = q.id WHERE q.question_code = 'IA2_TRAINING_FOCUS';
