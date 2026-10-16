-- =========================================================================================
-- CALISHEALTH - ASSESSMENT FRAMEWORK V2 - GIAI ĐOẠN 1 / BƯỚC 3: KIỂM TRA (CHỈ ĐỌC)
-- Chạy sau 01_schema + 02_seed. KẾT QUẢ MONG ĐỢI: truy vấn "VIOLATIONS" không trả dòng nào.
-- Mỗi dòng trả về = một vi phạm bất biến/cấu hình (check_code, detail).
-- =========================================================================================
SET NAMES utf8mb4;
SET @v1  := (SELECT id FROM rule_sets WHERE code = 'LEVEL_ENGINE'    ORDER BY (status = 'ACTIVE') DESC, version DESC LIMIT 1);
SET @v2  := (SELECT id FROM rule_sets WHERE code = 'LEVEL_ENGINE_V2' AND version = 1);
SET @tpl := (SELECT id FROM assessment_templates WHERE code = 'CALISHEALTH_INITIAL_FW2');
SET @sft := (SELECT id FROM assessment_templates WHERE code = 'CALISHEALTH_SAFETY_V1');

-- ============================== VIOLATIONS ==============================
DROP TABLE IF EXISTS tmp_v2_violations;
CREATE TABLE tmp_v2_violations (check_code VARCHAR(60), detail VARCHAR(500)) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
INSERT INTO tmp_v2_violations (check_code, detail)

 -- V01 Cách ly với v1: rule set V2 phải tồn tại và KHÔNG ACTIVE (I16: chưa có review Coach); v1 vẫn còn
 SELECT 'V01_RULESET' check_code, 'LEVEL_ENGINE_V2 v1 không tồn tại' detail FROM DUAL WHERE @v2 IS NULL
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V01_RULESET', CONCAT('LEVEL_ENGINE_V2 đang ', status, ' - phải DRAFT/PENDING_REVIEW cho tới khi Coach APPROVED') FROM rule_sets WHERE id = @v2 AND status = 'ACTIVE'
        AND NOT EXISTS (SELECT 1 FROM rule_set_reviews r WHERE r.rule_set_id = @v2 AND r.decision = 'APPROVED')
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V01_V1_INTACT', 'Không còn rule set LEVEL_ENGINE (v1) ACTIVE' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM rule_sets WHERE code = 'LEVEL_ENGINE' AND status = 'ACTIVE')

 -- V02 Đủ 28 stage (5 ladder); liệt kê bài tập thiếu trong bảng exercises
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V02_STAGE_COUNT', CONCAT('Có ', COUNT(*), ' stage, kỳ vọng 28 (thiếu bài tập trong exercises?)')
           FROM progression_stages st JOIN progression_ladders l ON l.id = st.ladder_id WHERE l.rule_set_id = @v2 HAVING COUNT(*) <> 28
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V02_MISSING_EXERCISE', x.code FROM (
    SELECT 'incline-push-up' code UNION ALL SELECT 'push-up' UNION ALL SELECT 'dips' UNION ALL SELECT 'pike-push-up' UNION ALL SELECT 'pseudo-planche-push-up'
    UNION ALL SELECT 'handstand-push-up' UNION ALL SELECT 'dead-hang' UNION ALL SELECT 'scapular-pull-up' UNION ALL SELECT 'australian-pull-up'
    UNION ALL SELECT 'negative-pull-up' UNION ALL SELECT 'pull-up' UNION ALL SELECT 'chest-to-bar-pull-up' UNION ALL SELECT 'muscle-up'
    UNION ALL SELECT 'assisted-squat' UNION ALL SELECT 'bodyweight-squat' UNION ALL SELECT 'bulgarian-split-squat' UNION ALL SELECT 'shrimp-squat'
    UNION ALL SELECT 'pistol-squat' UNION ALL SELECT 'plank' UNION ALL SELECT 'hollow-body-hold' UNION ALL SELECT 'hanging-leg-raise'
    UNION ALL SELECT 'l-sit' UNION ALL SELECT 'dragon-flag' UNION ALL SELECT 'wall-pike-hold' UNION ALL SELECT 'crow-pose'
    UNION ALL SELECT 'chest-to-wall-handstand' UNION ALL SELECT 'handstand' UNION ALL SELECT 'freestanding-handstand-push-up') x
    WHERE NOT EXISTS (SELECT 1 FROM exercises e WHERE e.code = x.code)

 -- V03 (I6) Dải điểm stage đơn điệu, không chồng: base(k+1) >= base(k)+span(k); base+span <= 100
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V03_BAND_OVERLAP', CONCAT(l.code, ': ', a.code, ' [', a.base_score, '-', a.base_score + a.span_score, '] chồng/đảo với ', b.code, ' (base ', b.base_score, ')')
    FROM progression_stages a
    JOIN progression_stages b ON b.ladder_id = a.ladder_id AND b.rank_no = (SELECT MIN(c.rank_no) FROM progression_stages c WHERE c.ladder_id = a.ladder_id AND c.rank_no > a.rank_no)
    JOIN progression_ladders l ON l.id = a.ladder_id
    WHERE l.rule_set_id = @v2 AND b.base_score < a.base_score + a.span_score
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V03_BAND_OVER_100', CONCAT(l.code, ': ', s.code) FROM progression_stages s JOIN progression_ladders l ON l.id = s.ladder_id
    WHERE l.rule_set_id = @v2 AND s.base_score + s.span_score > 100

 -- V04 Tiên quyết: rank thấp hơn, cùng ladder
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V04_PREREQ_RANK', CONCAT(s.code, ' <- ', p.code)
    FROM progression_stage_prerequisites pr JOIN progression_stages s ON s.id = pr.stage_id JOIN progression_stages p ON p.id = pr.prerequisite_stage_id
    JOIN progression_ladders l ON l.id = s.ladder_id
    WHERE l.rule_set_id = @v2 AND (p.rank_no >= s.rank_no OR p.ladder_id <> s.ladder_id)

 -- V05 Level: điểm tổng tăng nghiêm ngặt; ngưỡng COMPETENCY không giảm khi lên level (yêu cầu tích luỹ cho staircase Baseline)
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V05_PROMOTE_MIN', CONCAT(a.code, ' >= ', b.code) FROM fitness_levels a JOIN fitness_levels b ON b.rule_set_id = a.rule_set_id AND b.rank_no = a.rank_no + 1
    WHERE a.rule_set_id = @v2 AND a.overall_promote_min >= b.overall_promote_min
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V05_COMPETENCY_NOT_CUMULATIVE', CONCAT(ra.competency_code, ': ', la.code, '=', ra.value, ' > ', lb.code, '=', rb.value)
    FROM level_requirements ra JOIN fitness_levels la ON la.id = ra.level_id AND la.rule_set_id = @v2
    JOIN fitness_levels lb ON lb.rule_set_id = @v2 AND lb.rank_no > la.rank_no
    JOIN level_requirements rb ON rb.level_id = lb.id AND rb.gate = 'COMPETENCY' AND rb.competency_code = ra.competency_code
    WHERE ra.gate = 'COMPETENCY' AND rb.value < ra.value

 -- V06 Tham số bất biến/sàn
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V06_INITIAL_CAP', CONCAT('initial.max_level_rank=', IFNULL(param_value, 'NULL'), ' (phải 0..2)') FROM engine_parameters
    WHERE rule_set_id = @v2 AND param_key = 'initial.max_level_rank' AND (param_value IS NULL OR param_value > 2 OR param_value < 0)
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V06_INITIAL_CAP_MISSING', 'thiếu initial.max_level_rank' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM engine_parameters WHERE rule_set_id = @v2 AND param_key = 'initial.max_level_rank')
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V06_BASELINE_ATTEMPT_FLOOR', CONCAT(param_key, '=', IFNULL(param_value, 'NULL'), ' dưới sàn bất biến')
    FROM engine_parameters WHERE rule_set_id = @v2 AND param_key IN ('baseline.attempts.L0', 'baseline.attempts.L1') AND (param_value IS NULL OR param_value < 1)
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V06_BASELINE_ATTEMPT_FLOOR', CONCAT(param_key, '=', IFNULL(param_value, 'NULL'), ' dưới sàn bất biến (>= 2)')
    FROM engine_parameters WHERE rule_set_id = @v2 AND param_key IN ('baseline.attempts.L2', 'baseline.attempts.L3', 'baseline.attempts.L4') AND (param_value IS NULL OR param_value < 2)
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V06_MISSING_PARAM', k.k FROM (
    SELECT 'baseline.attempts.L0' k UNION ALL SELECT 'baseline.attempts.L1' UNION ALL SELECT 'baseline.attempts.L2' UNION ALL SELECT 'baseline.attempts.L3'
    UNION ALL SELECT 'baseline.attempts.L4' UNION ALL SELECT 'group_weight.INITIAL.LADDER_WEIGHT' UNION ALL SELECT 'group_weight.INITIAL.CHOICE_WEIGHT'
    UNION ALL SELECT 'group_weight.PERIODIC.LADDER_WEIGHT' UNION ALL SELECT 'group_weight.PERIODIC.QUALITY_WEIGHT'
    UNION ALL SELECT 'reliability_class.HIGH' UNION ALL SELECT 'form_factor.VERY' UNION ALL SELECT 'recency.RECENT_30D'
    UNION ALL SELECT 'fast_track.enabled' UNION ALL SELECT 'max_promotion_step' UNION ALL SELECT 'protocol.restSec') k
    WHERE NOT EXISTS (SELECT 1 FROM engine_parameters p WHERE p.rule_set_id = @v2 AND p.param_key = k.k)
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V06_NEGATIVE_WEIGHT', param_key FROM engine_parameters WHERE rule_set_id = @v2 AND param_key LIKE 'group_weight.%' AND (param_value IS NULL OR param_value < 0)
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V06_OBSOLETE_V1_PARAM', param_key FROM engine_parameters WHERE rule_set_id = @v2
    AND param_key IN ('provisional.screeningMaxRank', 'fastTrack.margin', 'fastTrack.minReliability', 'provisional.maxRank')

 -- V07 Safety: policy đủ 3 status; RESTRICTED phải yêu cầu clearance; clearance rule hợp lệ; I14
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V07_POLICY_COUNT', CONCAT('safety_policies có ', COUNT(*), ' dòng, kỳ vọng 3') FROM safety_policies WHERE rule_set_id = @v2 HAVING COUNT(*) <> 3
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V07_RESTRICTED_LEAVE', 'RESTRICTED phải requires_clearance_to_leave = TRUE (seed mặc định)' FROM safety_policies
    WHERE rule_set_id = @v2 AND status = 'RESTRICTED' AND requires_clearance_to_leave = FALSE
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V07_NO_BLOCK_INITIAL', CONCAT(status, ' đang chặn INITIAL_QUESTIONNAIRE (mặc định phải không chặn)') FROM safety_policies
    WHERE rule_set_id = @v2 AND JSON_CONTAINS(blocked_actions, JSON_QUOTE('INITIAL_QUESTIONNAIRE'))
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V07_SELF_ATTESTED_ALL', CONCAT('Rule ', id, ' SELF_ATTESTED dùng mode ALL/sticky') FROM safety_clearance_rules
    WHERE rule_set_id = @v2 AND method = 'SELF_ATTESTED' AND JSON_UNQUOTE(JSON_EXTRACT(flag_scope_json, '$.mode')) = 'ALL'
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V07_SELF_ATTESTED_STICKY', CONCAT('Rule ', r.id, ' SELF_ATTESTED phủ flag sticky ', f.code) FROM safety_clearance_rules r
    JOIN safety_flag_defs f ON f.rule_set_id = r.rule_set_id AND f.sticky = TRUE
    WHERE r.rule_set_id = @v2 AND r.method = 'SELF_ATTESTED'
      AND (JSON_UNQUOTE(JSON_EXTRACT(r.flag_scope_json, '$.mode')) IN ('ALL', 'ALL_NON_STICKY')
           OR JSON_CONTAINS(JSON_EXTRACT(r.flag_scope_json, '$.flags'), JSON_QUOTE(f.code)))
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V07_SELF_ATTESTED_NOT_DEFAULT', CONCAT('Rule ', id, ' SELF_ATTESTED có trong seed mặc định') FROM safety_clearance_rules WHERE rule_set_id = @v2 AND method = 'SELF_ATTESTED'
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V07_FLAG_NO_CONSTRAINT', f.code FROM safety_flag_defs f WHERE f.rule_set_id = @v2
    AND NOT EXISTS (SELECT 1 FROM safety_flag_constraints c WHERE c.rule_set_id = f.rule_set_id AND c.flag_code = f.code)
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V07_RULE_UNKNOWN_FLAG', CONCAT(r.id, ':', r.flag_code) FROM safety_rules r WHERE r.rule_set_id = @v2
    AND NOT EXISTS (SELECT 1 FROM safety_flag_defs f WHERE f.rule_set_id = r.rule_set_id AND f.code = r.flag_code)
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V07_RESTRICT_NO_ADVISORY', f.flag_code FROM (SELECT DISTINCT flag_code FROM safety_rules WHERE rule_set_id = @v2 AND severity = 'RESTRICT') f
    WHERE NOT EXISTS (SELECT 1 FROM safety_flag_constraints c WHERE c.rule_set_id = @v2 AND c.flag_code = f.flag_code AND c.constraint_code = 'ADVISORY_PROFESSIONAL_CONSULT')
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V07_SAFETY_QUESTION_ROLE', question_code FROM assessment_questions WHERE owner_template_id = @sft AND evidence_role <> 'SAFETY'

 -- V08 (I3/I4) Vai trò bằng chứng: mapping năng lực CHỈ cho role chấm điểm; không UNCLASSIFIED trong template V2
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V08_NONSCORING_HAS_WEIGHT', CONCAT(q.question_code, ' (', q.evidence_role, ')') FROM question_competency_weights w JOIN assessment_questions q ON q.id = w.question_id
    WHERE q.owner_template_id IN (@tpl, @sft) AND q.evidence_role NOT IN ('PERFORMANCE_LADDER', 'PERFORMANCE_SUPPORT', 'SELF_RATING_CHOICE', 'QUALITY_MEASURED')
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V08_UNCLASSIFIED', question_code FROM assessment_questions WHERE owner_template_id IN (@tpl, @sft) AND evidence_role = 'UNCLASSIFIED'
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V08_EXPERIENCE_WEIGHT', q.question_code FROM question_competency_weights w JOIN assessment_questions q ON q.id = w.question_id WHERE q.evidence_role = 'CONTEXT_EXPERIENCE'
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V08_CONTEXT_HAS_SCORE', CONCAT(q.question_code, ':', o.option_code) FROM assessment_question_options o JOIN assessment_questions q ON q.id = o.question_id
    WHERE q.owner_template_id IN (@tpl, @sft) AND q.evidence_role IN ('CONTEXT_EXPERIENCE', 'PROFILE', 'GOAL', 'CONSTRAINT', 'SAFETY', 'RELIABILITY_MODIFIER') AND o.score IS NOT NULL

 -- V09 (I19) Mỗi câu NODE phải có NOT_TRIED và NONE (phân biệt "chưa thử" với "chưa làm được"); mobility phải có NOT_TRIED không điểm
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V09_NODE_NOT_TRIED', q.question_code FROM assessment_questions q WHERE q.owner_template_id = @tpl AND q.answer_kind = 'LADDER_NODE'
    AND (NOT EXISTS (SELECT 1 FROM assessment_question_options o WHERE o.question_id = q.id AND o.option_code = 'NOT_TRIED')
      OR NOT EXISTS (SELECT 1 FROM assessment_question_options o WHERE o.question_id = q.id AND o.option_code = 'NONE'))
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V09_MOB_NOT_TRIED_SCORED', q.question_code FROM assessment_questions q JOIN assessment_question_options o ON o.question_id = q.id
    WHERE q.owner_template_id = @tpl AND q.question_code LIKE 'IA2\_MOB\_%' AND o.option_code = 'NOT_TRIED' AND o.score IS NOT NULL
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V09_MOB_NOT_TRIED_MISSING', q.question_code FROM assessment_questions q WHERE q.owner_template_id = @tpl AND q.question_code LIKE 'IA2\_MOB\_%'
    AND NOT EXISTS (SELECT 1 FROM assessment_question_options o WHERE o.question_id = q.id AND o.option_code = 'NOT_TRIED')

 -- V10 Toàn vẹn template
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V10_CHOICE_NO_OPTIONS', q.question_code FROM assessment_questions q WHERE q.owner_template_id IN (@tpl, @sft)
    AND q.question_type IN ('SINGLE_CHOICE', 'MULTI_CHOICE') AND NOT EXISTS (SELECT 1 FROM assessment_question_options o WHERE o.question_id = q.id)
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V10_NOT_IN_TEMPLATE', q.question_code FROM assessment_questions q WHERE q.owner_template_id IN (@tpl, @sft)
    AND NOT EXISTS (SELECT 1 FROM assessment_template_questions t WHERE t.question_id = q.id AND t.template_id = q.owner_template_id)
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V10_NO_SECTION', q.question_code FROM assessment_template_questions t JOIN assessment_questions q ON q.id = t.question_id
    WHERE t.template_id IN (@tpl, @sft) AND t.section_id IS NULL
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V10_TEMPLATE_NOT_DRAFT', code FROM assessment_templates WHERE id IN (@tpl, @sft) AND status <> 'DRAFT'
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V10_TEMPLATE_MISSING', 'CALISHEALTH_INITIAL_FW2 / CALISHEALTH_SAFETY_V1' FROM DUAL WHERE @tpl IS NULL OR @sft IS NULL
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V10_ONBOARDING_SWITCHED', 'assessment_onboarding_settings đang trỏ template V2 (Giai đoạn 1 không được kích hoạt)' FROM assessment_onboarding_settings
    WHERE active_template_id IN (@tpl, @sft)
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V10_LADDER_QUESTION_NO_LADDER', q.question_code FROM assessment_questions q
    WHERE q.owner_template_id = @tpl AND q.answer_kind IN ('LADDER_NODE', 'LADDER_VALUE') AND q.ladder_id IS NULL
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V10_NODE_OPTION_STAGE_MISMATCH', q.question_code FROM assessment_questions q JOIN progression_stages st ON st.ladder_id = q.ladder_id
    WHERE q.owner_template_id = @tpl AND q.answer_kind = 'LADDER_NODE'
      AND NOT EXISTS (SELECT 1 FROM assessment_question_options o WHERE o.question_id = q.id AND o.option_code = st.code)

 -- V11 Luật mâu thuẫn
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V11_CONSISTENCY_COUNT', CONCAT(COUNT(*), ' luật, kỳ vọng 8') FROM consistency_rules WHERE rule_set_id = @v2 HAVING COUNT(*) <> 8
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V11_BAD_JSON', code FROM consistency_rules WHERE rule_set_id = @v2 AND (NOT JSON_VALID(condition_json) OR NOT JSON_VALID(affected_competencies))

 -- V12 Kiểu dữ liệu: gate level_evaluations đủ rộng để chứa INSUFFICIENT_EVIDENCE (21 ký tự)
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V12_GATE_COLUMN_TOO_NARROW', CONCAT(column_name, ' = ', character_maximum_length) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'level_evaluations' AND column_name LIKE '%\_gate' AND character_maximum_length < 30
 ;

 -- V13 Template PERIODIC (migration 04; bỏ qua nếu chưa áp)
SET @per := (SELECT id FROM assessment_templates WHERE code = 'CALISHEALTH_PERIODIC_FW2');
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V13_PERIODIC_NOT_DRAFT', code FROM assessment_templates WHERE id = @per AND status <> 'DRAFT'
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V13_PERIODIC_QUESTION_COUNT', CONCAT(COUNT(*), ' câu, kỳ vọng 26') FROM assessment_questions WHERE owner_template_id = @per HAVING @per IS NOT NULL AND COUNT(*) <> 26
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V13_PERIODIC_NOT_PRACTICAL', question_code FROM assessment_questions WHERE owner_template_id = @per AND item_kind <> 'PRACTICAL_TEST'
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V13_PERIODIC_NOT_IN_TEMPLATE', q.question_code FROM assessment_questions q WHERE q.owner_template_id = @per
    AND NOT EXISTS (SELECT 1 FROM assessment_template_questions t WHERE t.question_id = q.id AND t.template_id = @per)
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V13_PERIODIC_ONBOARDING_SWITCHED', 'assessment_onboarding_settings đang trỏ template PERIODIC V2' FROM assessment_onboarding_settings WHERE active_template_id = @per
 ;
INSERT INTO tmp_v2_violations (check_code, detail) SELECT 'V13_RELIABILITY_PARAM_MISSING', k.param_key FROM (
    SELECT 'baseline.reliability.minPose' param_key UNION ALL SELECT 'baseline.reliability.minVisibility' UNION ALL SELECT 'baseline.reliability.minTracked') k
    WHERE @per IS NOT NULL AND NOT EXISTS (SELECT 1 FROM engine_parameters p WHERE p.rule_set_id = @v2 AND p.param_key = k.param_key)
;
SELECT check_code, detail FROM tmp_v2_violations;   -- KỲ VỌNG: 0 dòng
DROP TABLE tmp_v2_violations;

-- ============================== SUMMARY (thông tin) ==============================
SELECT CONCAT(code, ' v', version, ' ', status) AS rule_set_v2 FROM rule_sets WHERE id = @v2;
SELECT COUNT(*) AS stages_expected_28 FROM progression_stages st JOIN progression_ladders l ON l.id = st.ladder_id WHERE l.rule_set_id = @v2;
SELECT COUNT(*) AS prerequisites FROM progression_stage_prerequisites pr JOIN progression_stages s ON s.id = pr.stage_id JOIN progression_ladders l ON l.id = s.ladder_id WHERE l.rule_set_id = @v2;
SELECT COUNT(*) AS engine_parameters FROM engine_parameters WHERE rule_set_id = @v2;
SELECT COUNT(*) AS initial_template_questions FROM assessment_template_questions WHERE template_id = @tpl;
SELECT COUNT(*) AS safety_template_questions FROM assessment_template_questions WHERE template_id = @sft;
SELECT IFNULL(GROUP_CONCAT(code), '-') AS sticky_flags_need_coach_classification FROM safety_flag_defs WHERE rule_set_id = @v2 AND sticky = TRUE;
SELECT COUNT(*) AS clearance_rules_no_self_attested FROM safety_clearance_rules WHERE rule_set_id = @v2;
