-- Gỡ bước 14: bỏ câu hỏi hướng tập khỏi bài khảo sát ban đầu (đáp án đã lưu của câu này bị xóa theo).
SET @q := (SELECT q.id FROM assessment_questions q JOIN assessment_templates t ON t.id = q.owner_template_id WHERE q.question_code = 'IA2_TRAINING_FOCUS' AND t.code = 'CALISHEALTH_INITIAL_FW2');
DELETE FROM assessment_responses WHERE question_id = @q;
DELETE FROM assessment_template_questions WHERE question_id = @q;
DELETE FROM assessment_question_options WHERE question_id = @q;
DELETE FROM assessment_questions WHERE id = @q;
