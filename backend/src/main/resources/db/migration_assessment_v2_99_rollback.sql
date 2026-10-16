-- =========================================================================================
-- CALISHEALTH - ASSESSMENT FRAMEWORK V2 - ROLLBACK GIAI ĐOẠN 1
-- Gỡ toàn bộ bảng/cột/dữ liệu do 01_schema + 02_seed tạo. KHÔNG đụng dữ liệu Level Engine v1.
-- CẢNH BÁO: xoá dữ liệu V2. Nếu đã có phiên đánh giá (assessment_sessions/responses) dùng template V2, các DELETE bên dưới
-- sẽ bị chặn bởi FK (RESTRICT) - xử lý/sao lưu các phiên đó trước. Không dùng trên DB production khi đã có dữ liệu thật.
-- Cố ý KHÔNG hoàn tác: level_evaluations.*_gate VARCHAR(30) (rộng hơn, vô hại), engine_parameters.param_value cho phép NULL.
-- =========================================================================================
SET NAMES utf8mb4;
SET @v2  := (SELECT id FROM rule_sets WHERE code = 'LEVEL_ENGINE_V2' AND version = 1);
SET @tpl := (SELECT id FROM assessment_templates WHERE code = 'CALISHEALTH_INITIAL_FW2');
SET @sft := (SELECT id FROM assessment_templates WHERE code = 'CALISHEALTH_SAFETY_V1');
SET @per := (SELECT id FROM assessment_templates WHERE code = 'CALISHEALTH_PERIODIC_FW2');

-- 1) Dữ liệu seed -------------------------------------------------------------------------
DELETE w FROM question_competency_weights w JOIN assessment_questions q ON q.id = w.question_id WHERE q.owner_template_id IN (@tpl, @sft, @per);
DELETE FROM safety_rules WHERE question_id IN (SELECT id FROM (SELECT id FROM assessment_questions WHERE owner_template_id IN (@tpl, @sft, @per)) x);
DELETE FROM assessment_template_questions WHERE template_id IN (@tpl, @sft, @per);
DELETE o FROM assessment_question_options o JOIN assessment_questions q ON q.id = o.question_id WHERE q.owner_template_id IN (@tpl, @sft, @per);
DELETE FROM assessment_questions WHERE owner_template_id IN (@tpl, @sft, @per);
DELETE FROM assessment_templates WHERE id IN (@tpl, @sft, @per);     -- assessment_sections xoá theo CASCADE

DELETE FROM safety_flag_constraints WHERE rule_set_id = @v2;
DELETE FROM safety_clearance_rules WHERE rule_set_id = @v2;
DELETE FROM safety_policies WHERE rule_set_id = @v2;
DELETE FROM safety_flag_defs WHERE rule_set_id = @v2;
DELETE FROM safety_rules WHERE rule_set_id = @v2;
DELETE FROM progression_stage_prerequisites WHERE stage_id IN (SELECT s.id FROM (SELECT st.id FROM progression_stages st JOIN progression_ladders l ON l.id = st.ladder_id WHERE l.rule_set_id = @v2) s);
DELETE st FROM progression_stages st JOIN progression_ladders l ON l.id = st.ladder_id WHERE l.rule_set_id = @v2;
DELETE FROM progression_ladders WHERE rule_set_id = @v2;
DELETE FROM consistency_rules WHERE rule_set_id = @v2;
DELETE lr FROM level_requirements lr JOIN fitness_levels fl ON fl.id = lr.level_id WHERE fl.rule_set_id = @v2;
DELETE FROM fitness_levels WHERE rule_set_id = @v2;
DELETE FROM engine_parameters WHERE rule_set_id = @v2;
-- Bước 7: bảng nhật ký phải bỏ TRƯỚC khi xoá rule set (FK). Rule set V2 version >= 2 (do Coach clone) cần được dọn thủ công.
DROP TABLE IF EXISTS baseline_deferrals;
DROP TABLE IF EXISTS level_decisions_v2;
DROP TABLE IF EXISTS user_level_state_v2;
DROP TABLE IF EXISTS rule_set_changes;
DELETE FROM rule_set_reviews WHERE rule_set_id = @v2;
DELETE FROM rule_sets WHERE id = @v2;
DELETE FROM assessment_types WHERE code = 'SAFETY_SCREENING';   -- INITIAL/PERIODIC giữ lại (có thể đã có từ trước); chỉ đặt lại cột bên dưới bị DROP

-- 2) Gỡ khoá ngoại / cột trên bảng hiện có (thứ tự: FK trước, cột sau) -----------------------
ALTER TABLE workout_plans DROP FOREIGN KEY fk_wp_safety_status;
ALTER TABLE workout_plans DROP COLUMN safety_status_id, DROP COLUMN applied_constraints_json;

ALTER TABLE user_skill_progress DROP FOREIGN KEY fk_usp_stage;
ALTER TABLE user_skill_progress DROP COLUMN stage_id, DROP COLUMN origin, DROP COLUMN verification_status;

ALTER TABLE user_level_state DROP COLUMN verification_status, DROP COLUMN cap_applied, DROP COLUMN source, DROP COLUMN last_verified_at, DROP COLUMN fast_track_consumed;

ALTER TABLE level_evaluations DROP COLUMN gated_level, DROP COLUMN adjusted_level, DROP COLUMN level_cap, DROP COLUMN cap_applied, DROP COLUMN level_status,
    DROP COLUMN verification_status, DROP COLUMN source, DROP COLUMN basis, DROP COLUMN retest_reason_code;

ALTER TABLE level_requirements DROP COLUMN self_reported_acceptable;

ALTER TABLE engine_parameters DROP COLUMN param_text;

ALTER TABLE assessment_responses DROP COLUMN representative_value, DROP COLUMN normalized_score, DROP COLUMN reliability, DROP COLUMN evidence_role;

ALTER TABLE assessment_score_rules DROP FOREIGN KEY fk_asr_stage;
ALTER TABLE assessment_score_rules DROP COLUMN answer_kind, DROP COLUMN representative_value, DROP COLUMN stage_id;

ALTER TABLE assessment_template_questions DROP FOREIGN KEY fk_atq_section;
ALTER TABLE assessment_template_questions DROP COLUMN section_id, DROP COLUMN visibility_json;

ALTER TABLE assessment_questions DROP CHECK chk_aq_role;
ALTER TABLE assessment_questions DROP CHECK chk_aq_kind;
ALTER TABLE assessment_questions DROP FOREIGN KEY fk_aq_ladder;
ALTER TABLE assessment_questions DROP COLUMN evidence_role, DROP COLUMN item_kind, DROP COLUMN answer_kind, DROP COLUMN reliability_class,
    DROP COLUMN plausible_max, DROP COLUMN ladder_id;

ALTER TABLE assessment_templates DROP COLUMN purpose;
ALTER TABLE assessment_types DROP COLUMN execution_mode, DROP COLUMN scored;

ALTER TABLE assessment_sessions DROP FOREIGN KEY fk_as_supersedes;
ALTER TABLE assessment_sessions DROP COLUMN execution_mode, DROP COLUMN current_step, DROP COLUMN supersedes_session_id, DROP COLUMN expires_at, DROP COLUMN algorithm_version;
ALTER TABLE assessment_sessions DROP CHECK chk_assessment_sessions_status;
ALTER TABLE assessment_sessions ADD CONSTRAINT chk_assessment_sessions_status
    CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'ABANDONED', 'EXPIRED', 'SKIPPED'));

-- 3) Bảng mới (thứ tự phụ thuộc) -------------------------------------------------------------
DROP TABLE IF EXISTS safety_clearances;
DROP TABLE IF EXISTS safety_acknowledgements;
DROP TABLE IF EXISTS user_safety_flags;
DROP TABLE IF EXISTS user_safety_status;
DROP TABLE IF EXISTS safety_clearance_rules;
DROP TABLE IF EXISTS safety_policies;
DROP TABLE IF EXISTS safety_flag_constraints;
DROP TABLE IF EXISTS safety_rules;
DROP TABLE IF EXISTS safety_flag_defs;
DROP TABLE IF EXISTS safety_constraint_defs;
DROP TABLE IF EXISTS rule_set_reviews;
DROP TABLE IF EXISTS assessment_consistency_flags;
DROP TABLE IF EXISTS assessment_result_competencies;
DROP TABLE IF EXISTS assessment_results;
DROP TABLE IF EXISTS assessment_reliability;
DROP TABLE IF EXISTS assessment_metrics;
DROP TABLE IF EXISTS assessment_ladder_results;
DROP TABLE IF EXISTS assessment_evidence;
DROP TABLE IF EXISTS l4_review_packages;
DROP TABLE IF EXISTS assessment_recording_consents;
DROP TABLE IF EXISTS assessment_attempts;
DROP TABLE IF EXISTS progression_stage_prerequisites;
DROP TABLE IF EXISTS progression_stages;
DROP TABLE IF EXISTS progression_ladders;
DROP TABLE IF EXISTS assessment_sections;
DROP TABLE IF EXISTS tmp_v2_order;
DROP TABLE IF EXISTS tmp_v2_comp;

-- Bước 7: KHÔNG gỡ cột author_id/submitted_at của rule_sets nữa: Level Engine v1 (entity RuleSet) cũng dùng hai cột này cho quy trình Coach gửi duyệt, Admin duyệt.
-- Gỡ chúng sẽ làm backend không khởi động được (ddl-auto=validate).

-- Bước 11: đưa 3 template V2 về bản nháp (chỉ dùng khi tắt V2)
UPDATE assessment_templates SET status = 'DRAFT' WHERE code IN ('CALISHEALTH_SAFETY_V1', 'CALISHEALTH_INITIAL_FW2', 'CALISHEALTH_PERIODIC_FW2');
