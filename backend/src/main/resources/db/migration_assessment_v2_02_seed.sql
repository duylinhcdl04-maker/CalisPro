-- =========================================================================================
-- CALISHEALTH - ASSESSMENT FRAMEWORK V2 - GIAI ĐOẠN 1 / BƯỚC 2: SEED (DRAFT, CHƯA KÍCH HOẠT)
-- Đặc tả: backend/docs/ASSESSMENT_FRAMEWORK_V2.md (v2.3) §3, §5.6, §7, §10, §25, §27
--
-- Tạo (đều ở trạng thái DRAFT - cần Coach review APPROVED trước khi ACTIVE/PUBLISHED, I16):
--   * rule set  LEVEL_ENGINE_V2 v1   (code riêng => Level Engine v1 không bao giờ nạp nhầm)
--   * ladder/stage/prerequisite (PUSH, PULL, LEGS, CORE, SKILL), dải điểm đơn điệu
--   * Safety: cờ (sticky), luật, ràng buộc, policy, clearance rule (KHÔNG có rule SELF_ATTESTED mặc định)
--   * phiên bản template: CALISHEALTH_SAFETY_V1 (SAFETY_SCREENING) và CALISHEALTH_INITIAL_FW2 (INITIAL)
--
-- Mọi con số là PRODUCT_RULE / COACHING_BENCHMARK TẠM THỜI, cấu hình được, cần Coach duyệt. KHÔNG phải chuẩn khoa học.
-- Bộ câu hỏi an toàn lấy cảm hứng PAR-Q+ nhưng KHÔNG chẩn đoán; nội dung cần rà soát bởi người có chuyên môn trước khi dùng thật.
--
-- Điều kiện: DB đã chạy Level Engine v1 một lần (APP_SEED_ENABLED=true) và đã chạy 01_schema.
-- Chạy MỘT LẦN (gỡ bằng 99_rollback). Không đổi assessment_onboarding_settings, không đụng template/câu hỏi v1.
--
-- Quy ước condition_json (diễn giải ở Giai đoạn 2): điều kiện tham chiếu bằng chứng NOT_ASSESSED / INFERRED / UNRELIABLE
-- luôn đánh giá là FALSE (I19: thiếu/không tin cậy không bao giờ là bằng chứng tiêu cực).
-- =========================================================================================
SET NAMES utf8mb4;

-- ---- Guard: yêu cầu có rule set v1 (nếu NULL, câu lệnh dưới gây lỗi 1242 và dừng script) ----
SET @v1 := (SELECT id FROM rule_sets WHERE code = 'LEVEL_ENGINE' ORDER BY (status = 'ACTIVE') DESC, version DESC LIMIT 1);
SELECT IF(@v1 IS NULL,
          (SELECT 'LEVEL_ENGINE v1 chua co - chay app voi APP_SEED_ENABLED=true truoc' UNION ALL SELECT 'abort'),
          'ok') AS guard_level_engine_v1;

-- -----------------------------------------------------------------------------------------
-- 1. Loại đánh giá + execution_mode
-- -----------------------------------------------------------------------------------------
INSERT IGNORE INTO assessment_types (code, name, description, version, active, created_at, execution_mode, scored) VALUES
 ('INITIAL',          'Khảo sát đầu vào',        'Bảng câu hỏi tự khai báo - level TẠM THỜI (tối đa L2)', '2.0', TRUE, NOW(6), 'QUESTIONNAIRE', TRUE),
 ('PERIODIC',         'Đánh giá thực hành',      'Camera + Motion Rule Engine - bằng chứng đo',           '2.0', TRUE, NOW(6), 'PRACTICAL',     TRUE),
 ('SAFETY_SCREENING', 'Sàng lọc an toàn',        'Sàng lọc kiểu PAR-Q+ (không chẩn đoán, không chấm điểm năng lực)', '2.0', TRUE, NOW(6), 'QUESTIONNAIRE', FALSE);
UPDATE assessment_types SET execution_mode = 'QUESTIONNAIRE', scored = TRUE  WHERE code = 'INITIAL';
UPDATE assessment_types SET execution_mode = 'PRACTICAL',     scored = TRUE  WHERE code = 'PERIODIC';
UPDATE assessment_types SET execution_mode = 'QUESTIONNAIRE', scored = FALSE WHERE code = 'SAFETY_SCREENING';

INSERT IGNORE INTO competencies (code, name, description, is_primary, aggregation, display_order, active) VALUES
 ('PUSH', 'Sức mạnh đẩy', 'Push-up, Dip, Pike/HSPU, Pseudo-planche', TRUE, 'MAX', 1, TRUE),
 ('PULL', 'Sức mạnh kéo', 'Dead hang, Australian row, Pull-up, Chest-to-bar, Muscle-up', TRUE, 'MAX', 2, TRUE),
 ('LEGS', 'Chân', 'Squat, Split squat, Shrimp, Pistol', TRUE, 'MAX', 3, TRUE),
 ('CORE', 'Thân giữa', 'Plank, Hollow hold, Hanging leg raise, L-sit', TRUE, 'MAX', 4, TRUE),
 ('MOBILITY', 'Linh hoạt', 'Gập vai, gập hông, squat sâu', TRUE, 'MEAN', 5, TRUE),
 ('SKILL', 'Kỹ năng thăng bằng', 'Crow, Handstand', TRUE, 'MAX', 6, TRUE);

-- -----------------------------------------------------------------------------------------
-- 2. Rule set LEVEL_ENGINE_V2 (DRAFT)
-- -----------------------------------------------------------------------------------------
INSERT INTO rule_sets (code, version, status, parent_id, notes, created_by, created_at)
SELECT 'LEVEL_ENGINE_V2', 1, 'DRAFT', @v1,
       'Assessment Framework V2 (v2.3) - DRAFT. Cần Coach review APPROVED (LADDER, WEIGHTS, LEVEL_REQUIREMENTS, STICKY_FLAGS, CLEARANCE_RULES, SAFETY_POLICIES) trước khi ACTIVE. Khác v1: ladder theo stage cao nhất, safety độc lập, trần Initial L2, Baseline attempts.',
       'migration_assessment_v2_02_seed', NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM rule_sets WHERE code = 'LEVEL_ENGINE_V2' AND version = 1);
SET @v2 := (SELECT id FROM rule_sets WHERE code = 'LEVEL_ENGINE_V2' AND version = 1);

-- 2.1 Tham số: kế thừa v1 rồi bỏ các tham số V2 thay thế
INSERT IGNORE INTO engine_parameters (rule_set_id, param_key, param_value, source_type, source_reference)
SELECT @v2, param_key, param_value, source_type, source_reference FROM engine_parameters WHERE rule_set_id = @v1;

DELETE FROM engine_parameters WHERE rule_set_id = @v2 AND param_key IN
 ('provisional.maxRank',            -- thay bởi initial.max_level_rank (bất biến <= 2)
  'provisional.screeningMaxRank',   -- V2: an toàn KHÔNG ảnh hưởng level (I3)
  'fastTrack.margin',               -- V2: bỏ điều kiện Overall >= promote_min + 10
  'fastTrack.minReliability',       -- V2: bỏ điều kiện r_AI >= 0.85
  'observation.ladderWeight');      -- V2: trọng số nhóm nằm ở group_weight.*

-- 2.2 Tham số V2
INSERT IGNORE INTO engine_parameters (rule_set_id, param_key, param_value, param_text, source_type, source_reference) VALUES
 -- Trọng số nhóm bằng chứng (quyết định 3) - KHÔNG viết cứng trong Java
 (@v2, 'group_weight.INITIAL.LADDER_WEIGHT',  1.00, NULL, 'PRODUCT_RULE', 'Khởi điểm sản phẩm; Coach duyệt'),
 (@v2, 'group_weight.INITIAL.CHOICE_WEIGHT',  1.00, NULL, 'PRODUCT_RULE', 'Chỉ MOBILITY'),
 (@v2, 'group_weight.PERIODIC.LADDER_WEIGHT', 0.75, NULL, 'PRODUCT_RULE', 'Khởi điểm sản phẩm, không phải bất biến'),
 (@v2, 'group_weight.PERIODIC.QUALITY_WEIGHT',0.25, NULL, 'PRODUCT_RULE', 'Khởi điểm sản phẩm, không phải bất biến'),
 -- Độ tin cậy câu trả lời (chỉ ảnh hưởng confidence, KHÔNG ảnh hưởng điểm)
 (@v2, 'reliability_class.HIGH',   0.90, NULL, 'PRODUCT_RULE', NULL),
 (@v2, 'reliability_class.MEDIUM', 0.70, NULL, 'PRODUCT_RULE', NULL),
 (@v2, 'reliability_class.LOW',    0.40, NULL, 'PRODUCT_RULE', NULL),
 (@v2, 'form_factor.NOT_CONFIDENT',0.70, NULL, 'PRODUCT_RULE', 'Hệ số <= 1: tự tin cao không bao giờ thưởng điểm/độ tin cậy vượt 1'),
 (@v2, 'form_factor.SLIGHT',       0.80, NULL, 'PRODUCT_RULE', NULL),
 (@v2, 'form_factor.MODERATE',     0.90, NULL, 'PRODUCT_RULE', NULL),
 (@v2, 'form_factor.VERY',         1.00, NULL, 'PRODUCT_RULE', NULL),
 (@v2, 'form_factor.EXTREMELY',    1.00, NULL, 'PRODUCT_RULE', NULL),
 (@v2, 'recency.RECENT_30D',       1.00, NULL, 'PRODUCT_RULE', NULL),
 (@v2, 'recency.RECENT_1_6M',      0.85, NULL, 'PRODUCT_RULE', NULL),
 (@v2, 'recency.ESTIMATE',         0.60, NULL, 'PRODUCT_RULE', NULL),
 -- Trần level Initial (I1, I18: validator chỉ nhận <= 2)
 (@v2, 'initial.max_level_rank',   2,    NULL, 'PRODUCT_RULE', 'Bất biến nghiệp vụ: Initial tự khai báo tối đa L2'),
 (@v2, 'initial.low_confidence_threshold', 0.40, NULL, 'PRODUCT_RULE', NULL),
 (@v2, 'initial.conflict_downgrade_levels', 1,   NULL, 'PRODUCT_RULE', NULL),
 -- Baseline (quyết định A, E) - số attempt có SÀN bất biến: L0-L1 >= 1, L2-L4 >= 2
 (@v2, 'baseline.attempts.L0', 1, NULL, 'PRODUCT_RULE', 'Sàn bất biến = 1'),
 (@v2, 'baseline.attempts.L1', 1, NULL, 'PRODUCT_RULE', 'Sàn bất biến = 1'),
 (@v2, 'baseline.attempts.L2', 2, NULL, 'PRODUCT_RULE', 'Sàn bất biến = 2'),
 (@v2, 'baseline.attempts.L3', 2, NULL, 'PRODUCT_RULE', 'Sàn bất biến = 2'),
 (@v2, 'baseline.attempts.L4', 2, NULL, 'PRODUCT_RULE', 'Sàn bất biến = 2'),
 (@v2, 'baseline.attempt_aggregation', NULL, 'MIN', 'PRODUCT_RULE', 'MIN | MEAN: tổng hợp bảo thủ các attempt cho Competency/Skill/Overall'),
 (@v2, 'baseline.max_span_days',    3, NULL, 'PRODUCT_RULE', 'Tạm thời - cần xác nhận; cửa sổ tiếp tục Baseline staircase (F1)'),
 (@v2, 'baseline.retest_after_days',7, NULL, 'PRODUCT_RULE', 'Tạm thời - cần xác nhận'),
 (@v2, 'protocol.restSec',        120, NULL, 'COACHING_BENCHMARK', 'Tạm thời - nghỉ tối thiểu giữa hai attempt độc lập'),
 (@v2, 'fast_track.enabled',        1, NULL, 'PRODUCT_RULE', 'Chỉ bỏ giới hạn +-1 level cho Baseline đầu; KHÔNG bỏ cổng nào (I10)'),
 (@v2, 'max_promotion_step',        1, NULL, 'PRODUCT_RULE', 'Từ Periodic thứ hai trở đi');

-- 2.3 Level: kế thừa v1 (điểm tổng + yêu cầu); yêu cầu Skill cho phép tự khai báo ở bước candidate Initial (C9)
INSERT IGNORE INTO fitness_levels (rule_set_id, code, rank_no, name, overall_promote_min, overall_regress_below, min_competency_confidence, description, color_scheme)
SELECT @v2, code, rank_no, name, overall_promote_min, overall_regress_below, min_competency_confidence, description, color_scheme
FROM fitness_levels WHERE rule_set_id = @v1;

INSERT INTO level_requirements (level_id, gate, competency_code, exercise_id, metric, operator, value, mandatory, source_type, source_reference, self_reported_acceptable)
SELECT nl.id, lr.gate, lr.competency_code, lr.exercise_id, lr.metric, lr.operator, lr.value, lr.mandatory, lr.source_type, lr.source_reference,
       (lr.gate = 'SKILL')
FROM level_requirements lr
JOIN fitness_levels ol ON ol.id = lr.level_id AND ol.rule_set_id = @v1
JOIN fitness_levels nl ON nl.rule_set_id = @v2 AND nl.code = ol.code
WHERE NOT EXISTS (SELECT 1 FROM level_requirements x JOIN fitness_levels xl ON xl.id = x.level_id WHERE xl.rule_set_id = @v2);

-- 2.4 Luật mâu thuẫn V2 (C01-C08). Kinh nghiệm là CONTEXT: chỉ dùng ở đây để hạ confidence, KHÔNG vào điểm (I4).
INSERT INTO consistency_rules (rule_set_id, code, condition_json, severity, affected_competencies, message)
SELECT @v2, c.code, c.cond, c.sev, c.aff, c.msg FROM (
 SELECT 'C01' code, '{"all":[{"question":"IA2_EXP_MONTHS","op":"EQ","value":"NONE"},{"node":"pull-up","op":"GTE","value":10}]}' cond, 'CONFLICT' sev, '["PULL"]' aff,
        'Chưa từng tập nhưng khai làm được từ 10 pull-up chuẩn.' msg
 UNION ALL SELECT 'C02', '{"all":[{"node":"push-up","op":"LT","value":5},{"node":"dips","op":"GTE","value":15}]}', 'CONFLICT', '["PUSH"]',
        'Khai push-up dưới 5 nhưng dip từ 15.'
 UNION ALL SELECT 'C03', '{"all":[{"node":"plank","op":"LT","value":20},{"node":"l-sit","op":"GTE","value":15}]}', 'CONFLICT', '["CORE"]',
        'Khai plank dưới 20 giây nhưng L-sit từ 15 giây.'
 UNION ALL SELECT 'C04', '{"all":[{"node":"pull-up","op":"LT","value":1},{"node":"muscle-up","op":"GTE","value":1}]}', 'CONFLICT', '["PULL","SKILL"]',
        'Chưa làm được pull-up nhưng khai làm được muscle-up.'
 UNION ALL SELECT 'C05', '{"any":[{"node":"pull-up","op":"GTE","value":25},{"node":"push-up","op":"GTE","value":80}]}', 'WARNING', '["PULL","PUSH"]',
        'Số rep khai báo rất cao so với người mới vào ứng dụng.'
 UNION ALL SELECT 'C06', '{"verification":{"status":"FAIL"}}', 'CONFLICT', '["PUSH","PULL","LEGS","CORE","SKILL"]',
        'Khai nấc cao nhưng nấc kiểm chứng ngay dưới được khai là chưa đạt (chỉ năng lực có kiểm chứng FAIL bị ảnh hưởng).'
 UNION ALL SELECT 'C07', '{"all":[{"node":"handstand","op":"GTE","value":30},{"node":"pike-push-up","op":"LT","value":1}]}', 'WARNING', '["SKILL"]',
        'Khai trồng chuối tự do từ 30 giây nhưng chưa làm được pike push-up.'
 UNION ALL SELECT 'C08', '{"all":[{"question":"IA2_EXP_MONTHS","op":"IN","value":["NONE","LT_3M"]},{"competenciesAtOrAboveBand":{"band":"ADVANCED","count":3}}]}', 'WARNING', '["PUSH","PULL","LEGS","CORE","SKILL"]',
        'Kinh nghiệm dưới 3 tháng nhưng từ 3 năng lực ở mức Advanced.'
) c
WHERE NOT EXISTS (SELECT 1 FROM consistency_rules WHERE rule_set_id = @v2);

-- -----------------------------------------------------------------------------------------
-- 3. Progression ladders / stages / prerequisites (dải điểm đơn điệu, không chồng - I6)
--    pass_value = nấc "đã đạt" (kế thừa entry của v1); target/base/span theo ASSESSMENT_FRAMEWORK_V2 §5.6.
-- -----------------------------------------------------------------------------------------
INSERT IGNORE INTO progression_ladders (rule_set_id, code, competency_code, verify_from_rank, source_type, source_reference) VALUES
 (@v2, 'PUSH_LADDER',  'PUSH',  3, 'COACHING_BENCHMARK', 'Tạm thời - Coach duyệt (V2 §5.6)'),
 (@v2, 'PULL_LADDER',  'PULL',  5, 'COACHING_BENCHMARK', 'Tạm thời - Coach duyệt (V2 §5.6)'),
 (@v2, 'LEGS_LADDER',  'LEGS',  3, 'COACHING_BENCHMARK', 'Tạm thời - Coach duyệt (V2 §5.6)'),
 (@v2, 'CORE_LADDER',  'CORE',  3, 'COACHING_BENCHMARK', 'Tạm thời - Coach duyệt (V2 §5.6)'),
 (@v2, 'SKILL_LADDER', 'SKILL', 3, 'COACHING_BENCHMARK', 'Tạm thời - Coach duyệt (V2 §5.6)');

INSERT INTO progression_stages (ladder_id, code, exercise_id, rank_no, metric, pass_value, target_value, base_score, span_score)
SELECT l.id, s.code, e.id, s.rank_no, s.metric, s.pass_value, s.target_value, s.base_score, s.span_score
FROM (
 SELECT 'PUSH_LADDER' ladder, 'incline-push-up' code, 1 rank_no, 'VALID_REPS' metric, 1 pass_value, 20 target_value, 0 base_score, 20 span_score
 UNION ALL SELECT 'PUSH_LADDER','push-up',2,'VALID_REPS',1,30,20,30
 UNION ALL SELECT 'PUSH_LADDER','dips',3,'VALID_REPS',1,15,50,15
 UNION ALL SELECT 'PUSH_LADDER','pike-push-up',4,'VALID_REPS',1,15,65,10
 UNION ALL SELECT 'PUSH_LADDER','pseudo-planche-push-up',5,'VALID_REPS',1,12,75,12
 UNION ALL SELECT 'PUSH_LADDER','handstand-push-up',6,'VALID_REPS',1,8,87,13
 UNION ALL SELECT 'PULL_LADDER','dead-hang',1,'HOLD_SEC',5,60,0,10
 UNION ALL SELECT 'PULL_LADDER','scapular-pull-up',2,'VALID_REPS',1,12,10,10
 UNION ALL SELECT 'PULL_LADDER','australian-pull-up',3,'VALID_REPS',1,20,20,15
 UNION ALL SELECT 'PULL_LADDER','negative-pull-up',4,'VALID_REPS',1,5,35,10
 UNION ALL SELECT 'PULL_LADDER','pull-up',5,'VALID_REPS',1,15,45,30
 UNION ALL SELECT 'PULL_LADDER','chest-to-bar-pull-up',6,'VALID_REPS',1,10,75,13
 UNION ALL SELECT 'PULL_LADDER','muscle-up',7,'VALID_REPS',1,5,88,12
 UNION ALL SELECT 'LEGS_LADDER','assisted-squat',1,'VALID_REPS',1,20,0,20
 UNION ALL SELECT 'LEGS_LADDER','bodyweight-squat',2,'VALID_REPS',1,50,20,25
 UNION ALL SELECT 'LEGS_LADDER','bulgarian-split-squat',3,'VALID_REPS',1,15,45,20
 UNION ALL SELECT 'LEGS_LADDER','shrimp-squat',4,'VALID_REPS',1,8,65,20
 UNION ALL SELECT 'LEGS_LADDER','pistol-squat',5,'VALID_REPS',1,8,85,15
 UNION ALL SELECT 'CORE_LADDER','plank',1,'HOLD_SEC',10,90,0,30
 UNION ALL SELECT 'CORE_LADDER','hollow-body-hold',2,'HOLD_SEC',10,60,30,20
 UNION ALL SELECT 'CORE_LADDER','hanging-leg-raise',3,'VALID_REPS',1,15,50,15
 UNION ALL SELECT 'CORE_LADDER','l-sit',4,'HOLD_SEC',3,30,65,20
 UNION ALL SELECT 'CORE_LADDER','dragon-flag',5,'VALID_REPS',1,8,85,15
 UNION ALL SELECT 'SKILL_LADDER','wall-pike-hold',1,'HOLD_SEC',5,30,0,20
 UNION ALL SELECT 'SKILL_LADDER','crow-pose',2,'HOLD_SEC',3,30,20,20
 UNION ALL SELECT 'SKILL_LADDER','chest-to-wall-handstand',3,'HOLD_SEC',5,60,40,20
 UNION ALL SELECT 'SKILL_LADDER','handstand',4,'HOLD_SEC',2,30,60,20
 UNION ALL SELECT 'SKILL_LADDER','freestanding-handstand-push-up',5,'VALID_REPS',1,5,80,20
) s
JOIN progression_ladders l ON l.rule_set_id = @v2 AND l.code = s.ladder
JOIN exercises e ON e.code = s.code          -- bài thiếu trong DB sẽ bị bỏ qua: 03_verify báo thiếu (kỳ vọng 28 stage)
WHERE NOT EXISTS (SELECT 1 FROM progression_stages x WHERE x.ladder_id = l.id AND x.code = s.code);

-- Tiên quyết (stage <- prerequisite), đều mandatory, bypass NONE; cạnh theo skill tree v1 (DefaultLevelEngineConfig.PROGRESSIONS)
INSERT INTO progression_stage_prerequisites (stage_id, prerequisite_stage_id, mandatory, bypass_policy)
SELECT st.id, pr.id, TRUE, 'NONE'
FROM (
 SELECT 'PUSH_LADDER' ladder, 'push-up' stage, 'incline-push-up' prereq
 UNION ALL SELECT 'PUSH_LADDER','dips','push-up'
 UNION ALL SELECT 'PUSH_LADDER','pike-push-up','push-up'
 UNION ALL SELECT 'PUSH_LADDER','pseudo-planche-push-up','push-up'
 UNION ALL SELECT 'PUSH_LADDER','handstand-push-up','pike-push-up'
 UNION ALL SELECT 'PULL_LADDER','scapular-pull-up','dead-hang'
 UNION ALL SELECT 'PULL_LADDER','australian-pull-up','scapular-pull-up'
 UNION ALL SELECT 'PULL_LADDER','negative-pull-up','australian-pull-up'
 UNION ALL SELECT 'PULL_LADDER','pull-up','negative-pull-up'
 UNION ALL SELECT 'PULL_LADDER','chest-to-bar-pull-up','pull-up'
 UNION ALL SELECT 'PULL_LADDER','muscle-up','chest-to-bar-pull-up'
 UNION ALL SELECT 'LEGS_LADDER','bodyweight-squat','assisted-squat'
 UNION ALL SELECT 'LEGS_LADDER','bulgarian-split-squat','bodyweight-squat'
 UNION ALL SELECT 'LEGS_LADDER','shrimp-squat','bulgarian-split-squat'
 UNION ALL SELECT 'LEGS_LADDER','pistol-squat','shrimp-squat'
 UNION ALL SELECT 'CORE_LADDER','hollow-body-hold','plank'
 UNION ALL SELECT 'CORE_LADDER','hanging-leg-raise','hollow-body-hold'
 UNION ALL SELECT 'CORE_LADDER','l-sit','hanging-leg-raise'
 UNION ALL SELECT 'CORE_LADDER','dragon-flag','l-sit'
 UNION ALL SELECT 'SKILL_LADDER','crow-pose','wall-pike-hold'
 UNION ALL SELECT 'SKILL_LADDER','chest-to-wall-handstand','crow-pose'
 UNION ALL SELECT 'SKILL_LADDER','handstand','chest-to-wall-handstand'
 UNION ALL SELECT 'SKILL_LADDER','freestanding-handstand-push-up','handstand'
) e
JOIN progression_ladders l ON l.rule_set_id = @v2 AND l.code = e.ladder
JOIN progression_stages st ON st.ladder_id = l.id AND st.code = e.stage
JOIN progression_stages pr ON pr.ladder_id = l.id AND pr.code = e.prereq
WHERE NOT EXISTS (SELECT 1 FROM progression_stage_prerequisites x WHERE x.stage_id = st.id AND x.prerequisite_stage_id = pr.id);

-- -----------------------------------------------------------------------------------------
-- 4. SAFETY (miền riêng, độc lập năng lực/level)
-- -----------------------------------------------------------------------------------------
INSERT IGNORE INTO safety_constraint_defs (code, kind, params_json, message) VALUES
 ('NO_PLYOMETRIC',        'EXERCISE_EXCLUDE',        '{"tags":["PLYOMETRIC","HIGH_IMPACT"]}', 'Loại bài nhảy/va chạm mạnh.'),
 ('NO_INVERSION',         'EXERCISE_EXCLUDE',        '{"tags":["INVERSION"]}',                'Loại bài đầu thấp hơn tim (trồng chuối, lộn ngược).'),
 ('LOW_INTENSITY_ONLY',   'EXERCISE_EXCLUDE',        '{"tags":["PLYOMETRIC","HIGH_IMPACT","INVERSION","MAX_EFFORT"]}', 'Chỉ nội dung nền tảng cường độ thấp.'),
 ('NO_MAX_EFFORT_TEST',   'ASSESSMENT_PARTICIPATION','{"forbid":["MAX_EFFORT_TEST"]}',        'Không làm bài test tối đa; bài bị loại được ghi NOT_ASSESSED (không phải FAIL).'),
 ('LOAD_CAP_MODERATE',    'LOAD_CAP',                '{"max_rpe":7,"volume_multiplier":0.8}', 'Giới hạn cường độ/khối lượng ở mức vừa (giá trị tạm thời, Coach duyệt).'),
 ('LOAD_CAP_LOW',         'LOAD_CAP',                '{"max_rpe":5,"volume_multiplier":0.5}', 'Giới hạn cường độ/khối lượng thấp (giá trị tạm thời, Coach duyệt).'),
 ('REGION_LIMIT_SHOULDER','REGION_LIMIT',            '{"region":"SHOULDER"}',                 'Hạn chế bài tải vùng vai.'),
 ('REGION_LIMIT_WRIST',   'REGION_LIMIT',            '{"region":"WRIST"}',                    'Hạn chế bài tải cổ tay.'),
 ('REGION_LIMIT_ELBOW',   'REGION_LIMIT',            '{"region":"ELBOW"}',                    'Hạn chế bài tải khuỷu tay.'),
 ('REGION_LIMIT_LOWER_BACK','REGION_LIMIT',          '{"region":"LOWER_BACK"}',               'Hạn chế bài tải lưng dưới.'),
 ('REGION_LIMIT_KNEE',    'REGION_LIMIT',            '{"region":"KNEE"}',                     'Hạn chế bài tải đầu gối.'),
 ('REGION_LIMIT_ANKLE',   'REGION_LIMIT',            '{"region":"ANKLE"}',                    'Hạn chế bài tải cổ chân.'),
 ('REGION_LIMIT_NECK',    'REGION_LIMIT',            '{"region":"NECK"}',                     'Hạn chế bài tải vùng cổ.'),
 ('ADVISORY_PROFESSIONAL_CONSULT','ADVISORY',        NULL, 'Câu trả lời của bạn cho thấy nên tham khảo ý kiến chuyên gia y tế/vận động trước khi tập cường độ cao. Đây không phải chẩn đoán.');

-- Cờ. sticky: tạm thời theo ví dụ EXISTING_CONDITION; danh sách sticky cuối cùng do Coach phân loại -> Admin cấu hình -> publish (D).
INSERT IGNORE INTO safety_flag_defs (rule_set_id, code, description, sticky) VALUES
 (@v2, 'EXISTING_CONDITION',  'Đã được chuyên gia y tế khuyến cáo chỉ tập có giám sát', TRUE),
 (@v2, 'EXERTION_SYMPTOM',    'Triệu chứng khi gắng sức (đau ngực, chóng mặt...)', FALSE),
 (@v2, 'JOINT_BONE_CONCERN',  'Vấn đề xương khớp có thể nặng hơn khi vận động', FALSE),
 (@v2, 'MEDICATION_CONCERN',  'Đang dùng thuốc liên quan tim mạch/huyết áp', FALSE),
 (@v2, 'OTHER_REASON',        'Lý do khác không nên tập', FALSE),
 (@v2, 'INJURY_SHOULDER',     'Đau/chấn thương vai', FALSE), (@v2, 'INJURY_WRIST', 'Đau/chấn thương cổ tay', FALSE),
 (@v2, 'INJURY_ELBOW',        'Đau/chấn thương khuỷu', FALSE), (@v2, 'INJURY_LOWER_BACK', 'Đau/chấn thương lưng dưới', FALSE),
 (@v2, 'INJURY_KNEE',         'Đau/chấn thương gối', FALSE), (@v2, 'INJURY_ANKLE', 'Đau/chấn thương cổ chân', FALSE),
 (@v2, 'INJURY_NECK',         'Đau/chấn thương cổ', FALSE);

INSERT IGNORE INTO safety_flag_constraints (rule_set_id, flag_code, constraint_code) VALUES
 (@v2,'EXISTING_CONDITION','LOW_INTENSITY_ONLY'), (@v2,'EXISTING_CONDITION','LOAD_CAP_LOW'),
 (@v2,'EXISTING_CONDITION','NO_MAX_EFFORT_TEST'), (@v2,'EXISTING_CONDITION','ADVISORY_PROFESSIONAL_CONSULT'),
 (@v2,'EXERTION_SYMPTOM','NO_PLYOMETRIC'), (@v2,'EXERTION_SYMPTOM','NO_INVERSION'), (@v2,'EXERTION_SYMPTOM','NO_MAX_EFFORT_TEST'),
 (@v2,'EXERTION_SYMPTOM','LOAD_CAP_MODERATE'), (@v2,'EXERTION_SYMPTOM','ADVISORY_PROFESSIONAL_CONSULT'),
 (@v2,'JOINT_BONE_CONCERN','LOAD_CAP_MODERATE'), (@v2,'JOINT_BONE_CONCERN','NO_PLYOMETRIC'), (@v2,'JOINT_BONE_CONCERN','ADVISORY_PROFESSIONAL_CONSULT'),
 (@v2,'MEDICATION_CONCERN','NO_MAX_EFFORT_TEST'), (@v2,'MEDICATION_CONCERN','LOAD_CAP_MODERATE'), (@v2,'MEDICATION_CONCERN','ADVISORY_PROFESSIONAL_CONSULT'),
 (@v2,'OTHER_REASON','NO_MAX_EFFORT_TEST'), (@v2,'OTHER_REASON','LOAD_CAP_MODERATE'), (@v2,'OTHER_REASON','ADVISORY_PROFESSIONAL_CONSULT'),
 (@v2,'INJURY_SHOULDER','REGION_LIMIT_SHOULDER'), (@v2,'INJURY_WRIST','REGION_LIMIT_WRIST'), (@v2,'INJURY_ELBOW','REGION_LIMIT_ELBOW'),
 (@v2,'INJURY_LOWER_BACK','REGION_LIMIT_LOWER_BACK'), (@v2,'INJURY_KNEE','REGION_LIMIT_KNEE'), (@v2,'INJURY_ANKLE','REGION_LIMIT_ANKLE'),
 (@v2,'INJURY_NECK','REGION_LIMIT_NECK');

-- Policy: acknowledgement KHÔNG phải clearance. blocked_actions rỗng => KHÔNG chặn Initial Questionnaire (mặc định).
INSERT IGNORE INTO safety_policies (rule_set_id, status, validity_days, require_acknowledgement_for, blocked_actions, requires_clearance_to_leave) VALUES
 (@v2, 'CLEARED',         180, JSON_ARRAY(),                                           JSON_ARRAY(), FALSE),
 (@v2, 'REVIEW_REQUIRED', 180, JSON_ARRAY('CYCLE_GENERATION', 'PERIODIC_START'),       JSON_ARRAY(), FALSE),
 (@v2, 'RESTRICTED',      180, JSON_ARRAY('CYCLE_GENERATION', 'PERIODIC_START'),       JSON_ARRAY(), TRUE);

-- Clearance rule: CHỈ COACH_VERIFIED. KHÔNG có rule SELF_ATTESTED mặc định (chỉ tồn tại nếu Coach duyệt + Admin publish tường minh).
INSERT INTO safety_clearance_rules (rule_set_id, from_status, flag_scope_json, method, resulting_status, allow_retained_constraints, reviewer_role, source_type, source_reference)
SELECT @v2, r.from_status, r.scope, 'COACH_VERIFIED', r.resulting, TRUE, 'COACH', 'PRODUCT_RULE', 'Tạm thời - Coach duyệt'
FROM (
 SELECT 'REVIEW_REQUIRED' from_status, JSON_OBJECT('mode','ALL') scope, 'CLEARED' resulting
 UNION ALL SELECT 'RESTRICTED', JSON_OBJECT('mode','ALL'), 'REVIEW_REQUIRED'
 UNION ALL SELECT 'RESTRICTED', JSON_OBJECT('mode','ALL'), 'CLEARED'
) r
WHERE NOT EXISTS (SELECT 1 FROM safety_clearance_rules WHERE rule_set_id = @v2);

-- -----------------------------------------------------------------------------------------
-- 5. TEMPLATE SAFETY_SCREENING (DRAFT)
-- -----------------------------------------------------------------------------------------
INSERT INTO assessment_templates (code, name, display_name, description, type, status, version, estimated_duration, max_total_score, created_at, updated_at, purpose)
SELECT 'CALISHEALTH_SAFETY_V1', 'Sàng lọc an toàn trước khi tập', 'Sàng lọc an toàn',
       'Sàng lọc kiểu PAR-Q+ - KHÔNG chẩn đoán, KHÔNG chấm điểm năng lực. Kết quả chỉ sinh Safety Status và ràng buộc tập luyện.',
       'SAFETY_SCREENING', 'DRAFT', 1, 2, 100, NOW(6), NOW(6), 'STANDARD'
WHERE NOT EXISTS (SELECT 1 FROM assessment_templates WHERE code = 'CALISHEALTH_SAFETY_V1');
SET @sft := (SELECT id FROM assessment_templates WHERE code = 'CALISHEALTH_SAFETY_V1');

INSERT IGNORE INTO assessment_sections (template_id, code, title, sort_order) VALUES (@sft, 'SAFETY', 'An toàn trước khi tập', 1);

INSERT IGNORE INTO assessment_questions (question_code, question_text, instruction, question_type, input_type, category, required, active, default_weight, owner_template_id, version,
                                         evidence_role, item_kind, answer_kind, created_at, updated_at) VALUES
 ('SF_Q1_SUPERVISED',  'Bác sĩ hoặc chuyên gia y tế đã từng nói bạn chỉ nên tập thể dục dưới sự giám sát?', 'Chỉ trả lời Có nếu bạn đã được khuyến cáo như vậy.', 'SINGLE_CHOICE','SINGLE_CHOICE','SAFETY', TRUE, TRUE, 0, @sft, 1, 'SAFETY','QUESTION','BOOLEAN', NOW(6), NOW(6)),
 ('SF_Q2_CHEST_ACTIVE','Bạn có thấy đau/tức ngực khi vận động không?', NULL, 'SINGLE_CHOICE','SINGLE_CHOICE','SAFETY', TRUE, TRUE, 0, @sft, 1, 'SAFETY','QUESTION','BOOLEAN', NOW(6), NOW(6)),
 ('SF_Q3_CHEST_REST',  'Trong tháng qua, bạn có đau/tức ngực khi không vận động không?', NULL, 'SINGLE_CHOICE','SINGLE_CHOICE','SAFETY', TRUE, TRUE, 0, @sft, 1, 'SAFETY','QUESTION','BOOLEAN', NOW(6), NOW(6)),
 ('SF_Q4_DIZZY',       'Bạn có từng mất thăng bằng vì chóng mặt hoặc mất ý thức không?', NULL, 'SINGLE_CHOICE','SINGLE_CHOICE','SAFETY', TRUE, TRUE, 0, @sft, 1, 'SAFETY','QUESTION','BOOLEAN', NOW(6), NOW(6)),
 ('SF_Q5_JOINT_BONE',  'Bạn có vấn đề xương/khớp có thể nặng hơn khi tăng vận động không?', NULL, 'SINGLE_CHOICE','SINGLE_CHOICE','SAFETY', TRUE, TRUE, 0, @sft, 1, 'SAFETY','QUESTION','BOOLEAN', NOW(6), NOW(6)),
 ('SF_Q6_MEDICATION',  'Hiện bạn có dùng thuốc cho huyết áp hoặc tim mạch không?', NULL, 'SINGLE_CHOICE','SINGLE_CHOICE','SAFETY', TRUE, TRUE, 0, @sft, 1, 'SAFETY','QUESTION','BOOLEAN', NOW(6), NOW(6)),
 ('SF_Q7_OTHER',       'Bạn có biết lý do nào khác khiến bạn không nên tập thể dục không?', NULL, 'SINGLE_CHOICE','SINGLE_CHOICE','SAFETY', TRUE, TRUE, 0, @sft, 1, 'SAFETY','QUESTION','BOOLEAN', NOW(6), NOW(6)),
 ('SF_INJURY_REGIONS', 'Vùng nào đang đau hoặc từng chấn thương cần lưu ý? (chọn nhiều)', 'Chọn "Không có" nếu không có vùng nào.', 'MULTI_CHOICE','MULTIPLE_CHOICE','SAFETY', TRUE, TRUE, 0, @sft, 1, 'SAFETY','QUESTION','CATEGORICAL', NOW(6), NOW(6));

INSERT INTO assessment_question_options (question_id, option_code, option_label, sort_order, active)
SELECT q.id, o.code, o.label, o.ord, TRUE
FROM assessment_questions q
JOIN (SELECT 'YES' code, 'Có' label, 1 ord UNION ALL SELECT 'NO', 'Không', 2) o
WHERE q.owner_template_id = @sft AND q.question_code LIKE 'SF\_Q%'
  AND NOT EXISTS (SELECT 1 FROM assessment_question_options x WHERE x.question_id = q.id);

INSERT INTO assessment_question_options (question_id, option_code, option_label, sort_order, active)
SELECT q.id, o.code, o.label, o.ord, TRUE
FROM assessment_questions q
JOIN (SELECT 'NONE' code, 'Không có' label, 0 ord UNION ALL SELECT 'SHOULDER','Vai',1 UNION ALL SELECT 'WRIST','Cổ tay',2
      UNION ALL SELECT 'ELBOW','Khuỷu tay',3 UNION ALL SELECT 'LOWER_BACK','Lưng dưới',4 UNION ALL SELECT 'KNEE','Đầu gối',5
      UNION ALL SELECT 'ANKLE','Cổ chân',6 UNION ALL SELECT 'NECK','Cổ',7) o
WHERE q.question_code = 'SF_INJURY_REGIONS' AND NOT EXISTS (SELECT 1 FROM assessment_question_options x WHERE x.question_id = q.id);

INSERT INTO assessment_template_questions (template_id, question_id, sort_order, weight, required, section_title, section_id)
SELECT @sft, q.id, ROW_NUMBER() OVER (ORDER BY (q.question_code = 'SF_INJURY_REGIONS'), q.question_code), 0, TRUE, s.title, s.id
FROM assessment_questions q
JOIN assessment_sections s ON s.template_id = @sft AND s.code = 'SAFETY'
WHERE q.owner_template_id = @sft
  AND NOT EXISTS (SELECT 1 FROM assessment_template_questions x WHERE x.template_id = @sft AND x.question_id = q.id);

-- Luật an toàn: đáp án -> cờ + mức. Q1 => RESTRICT; còn lại => REVIEW.
INSERT INTO safety_rules (rule_set_id, question_id, condition_json, flag_code, severity, source_type, source_reference)
SELECT @v2, q.id, r.cond, r.flag, r.sev, 'PRODUCT_RULE', 'Kiểu PAR-Q+ (Warburton 2011) - không chẩn đoán; Coach/chuyên môn duyệt'
FROM (
 SELECT 'SF_Q1_SUPERVISED' qc, '{"op":"EQ","value":"YES"}' cond, 'EXISTING_CONDITION' flag, 'RESTRICT' sev
 UNION ALL SELECT 'SF_Q2_CHEST_ACTIVE','{"op":"EQ","value":"YES"}','EXERTION_SYMPTOM','REVIEW'
 UNION ALL SELECT 'SF_Q3_CHEST_REST','{"op":"EQ","value":"YES"}','EXERTION_SYMPTOM','REVIEW'
 UNION ALL SELECT 'SF_Q4_DIZZY','{"op":"EQ","value":"YES"}','EXERTION_SYMPTOM','REVIEW'
 UNION ALL SELECT 'SF_Q5_JOINT_BONE','{"op":"EQ","value":"YES"}','JOINT_BONE_CONCERN','REVIEW'
 UNION ALL SELECT 'SF_Q6_MEDICATION','{"op":"EQ","value":"YES"}','MEDICATION_CONCERN','REVIEW'
 UNION ALL SELECT 'SF_Q7_OTHER','{"op":"EQ","value":"YES"}','OTHER_REASON','REVIEW'
 UNION ALL SELECT 'SF_INJURY_REGIONS','{"op":"CONTAINS","value":"SHOULDER"}','INJURY_SHOULDER','REVIEW'
 UNION ALL SELECT 'SF_INJURY_REGIONS','{"op":"CONTAINS","value":"WRIST"}','INJURY_WRIST','REVIEW'
 UNION ALL SELECT 'SF_INJURY_REGIONS','{"op":"CONTAINS","value":"ELBOW"}','INJURY_ELBOW','REVIEW'
 UNION ALL SELECT 'SF_INJURY_REGIONS','{"op":"CONTAINS","value":"LOWER_BACK"}','INJURY_LOWER_BACK','REVIEW'
 UNION ALL SELECT 'SF_INJURY_REGIONS','{"op":"CONTAINS","value":"KNEE"}','INJURY_KNEE','REVIEW'
 UNION ALL SELECT 'SF_INJURY_REGIONS','{"op":"CONTAINS","value":"ANKLE"}','INJURY_ANKLE','REVIEW'
 UNION ALL SELECT 'SF_INJURY_REGIONS','{"op":"CONTAINS","value":"NECK"}','INJURY_NECK','REVIEW'
) r JOIN assessment_questions q ON q.question_code COLLATE utf8mb4_0900_ai_ci = r.qc
WHERE NOT EXISTS (SELECT 1 FROM safety_rules WHERE rule_set_id = @v2);

-- -----------------------------------------------------------------------------------------
-- 6. TEMPLATE INITIAL (CALISHEALTH_INITIAL_FW2, DRAFT) - câu hỏi IA2_*
--    * Câu hiệu năng: cặp NODE (chọn stage) + VALUE (số) như v1; VERIFY (kiểm chứng nấc dưới) có điều kiện.
--    * "NOT_TRIED" (chưa thử/không có dụng cụ/không chắc) => NOT_ASSESSED, KHÔNG phải FAIL; "NONE" (đã thử nhưng chưa làm được) mới là bằng chứng tiêu cực (I19).
--    * Kinh nghiệm/hồ sơ/mục tiêu/ràng buộc: KHÔNG có question_competency_weights (I4).
--    * Hiệu lực thời gian + tự tin form: chỉ là RELIABILITY_MODIFIER (không vào điểm).
-- -----------------------------------------------------------------------------------------
INSERT INTO assessment_templates (code, name, display_name, description, type, status, version, estimated_duration, max_total_score, created_at, updated_at, purpose)
SELECT 'CALISHEALTH_INITIAL_FW2', 'Khảo sát thể lực đầu vào (Framework V2)', 'Khảo sát thể lực đầu vào',
       'Dữ liệu TỰ KHAI BÁO -> level TẠM THỜI tối đa L2. Level được xác minh bằng bài đánh giá thực hành (Baseline).',
       'INITIAL', 'DRAFT', 1, 8, 100, NOW(6), NOW(6), 'STANDARD'
WHERE NOT EXISTS (SELECT 1 FROM assessment_templates WHERE code = 'CALISHEALTH_INITIAL_FW2');
SET @tpl := (SELECT id FROM assessment_templates WHERE code = 'CALISHEALTH_INITIAL_FW2');

INSERT IGNORE INTO assessment_sections (template_id, code, title, sort_order) VALUES
 (@tpl,'PROFILE','Hồ sơ cơ bản',1), (@tpl,'EXPERIENCE','Kinh nghiệm tập luyện',2),
 (@tpl,'PUSH','Sức mạnh đẩy',3), (@tpl,'PULL','Sức mạnh kéo',4), (@tpl,'LEGS','Chân',5), (@tpl,'CORE','Thân giữa',6),
 (@tpl,'MOBILITY','Linh hoạt',7), (@tpl,'SKILL','Kỹ năng',8), (@tpl,'GOALS','Mục tiêu',9), (@tpl,'CONSTRAINTS','Lịch tập & dụng cụ',10);

-- 6.1 Câu cố định
INSERT IGNORE INTO assessment_questions (question_code, question_text, instruction, question_type, input_type, category, unit, required, active, default_weight, min_value, max_value,
                                         config_json, owner_template_id, version, evidence_role, item_kind, answer_kind, reliability_class, created_at, updated_at) VALUES
 ('IA2_AGE','Tuổi của bạn?',NULL,'NUMBER','NUMERIC_INPUT','PROFILE','tuổi',TRUE,TRUE,0,13,100,NULL,@tpl,1,'PROFILE','QUESTION','NUMERIC',NULL,NOW(6),NOW(6)),
 ('IA2_SEX','Giới tính?',NULL,'SINGLE_CHOICE','SINGLE_CHOICE','PROFILE',NULL,FALSE,TRUE,0,NULL,NULL,NULL,@tpl,1,'PROFILE','QUESTION','CATEGORICAL',NULL,NOW(6),NOW(6)),
 ('IA2_HEIGHT_CM','Chiều cao (cm)?',NULL,'NUMBER','NUMERIC_INPUT','PROFILE','cm',FALSE,TRUE,0,100,250,NULL,@tpl,1,'PROFILE','QUESTION','NUMERIC',NULL,NOW(6),NOW(6)),
 ('IA2_WEIGHT_KG','Cân nặng (kg)?',NULL,'NUMBER','NUMERIC_INPUT','PROFILE','kg',FALSE,TRUE,0,25,300,NULL,@tpl,1,'PROFILE','QUESTION','NUMERIC',NULL,NOW(6),NOW(6)),
 ('IA2_ACTIVITY_LEVEL','Mức vận động hằng ngày?',NULL,'SINGLE_CHOICE','SINGLE_CHOICE','PROFILE',NULL,FALSE,TRUE,0,NULL,NULL,NULL,@tpl,1,'PROFILE','QUESTION','CATEGORICAL',NULL,NOW(6),NOW(6)),
 ('IA2_EXP_MONTHS','Bạn đã tập calisthenics bao lâu?','Kinh nghiệm chỉ là ngữ cảnh; không cộng vào điểm năng lực.','SINGLE_CHOICE','SINGLE_CHOICE','EXPERIENCE',NULL,TRUE,TRUE,0,NULL,NULL,NULL,@tpl,1,'CONTEXT_EXPERIENCE','QUESTION','CONTEXT_ENUM','MEDIUM',NOW(6),NOW(6)),
 ('IA2_TRAIN_DAYS','Hiện bạn tập mấy buổi mỗi tuần?',NULL,'SINGLE_CHOICE','SINGLE_CHOICE','EXPERIENCE',NULL,TRUE,TRUE,0,NULL,NULL,NULL,@tpl,1,'CONTEXT_EXPERIENCE','QUESTION','CONTEXT_ENUM','MEDIUM',NOW(6),NOW(6)),
 ('IA2_RESISTANCE_EXP','Kinh nghiệm tập kháng lực/tạ?',NULL,'SINGLE_CHOICE','SINGLE_CHOICE','EXPERIENCE',NULL,FALSE,TRUE,0,NULL,NULL,NULL,@tpl,1,'CONTEXT_EXPERIENCE','QUESTION','CONTEXT_ENUM','MEDIUM',NOW(6),NOW(6)),
 ('IA2_MOB_DEEP_SQUAT','Bạn squat sâu được không (gót chân không nhấc)?','Tự đánh giá chức năng; độ tin cậy thấp hơn bài đo camera.','SINGLE_CHOICE','SINGLE_CHOICE','MOBILITY',NULL,TRUE,TRUE,0,NULL,NULL,NULL,@tpl,1,'SELF_RATING_CHOICE','QUESTION','CATEGORICAL','LOW',NOW(6),NOW(6)),
 ('IA2_MOB_OVERHEAD','Bạn giơ thẳng hai tay qua đầu được không (không đau, không ưỡn lưng)?',NULL,'SINGLE_CHOICE','SINGLE_CHOICE','MOBILITY',NULL,TRUE,TRUE,0,NULL,NULL,NULL,@tpl,1,'SELF_RATING_CHOICE','QUESTION','CATEGORICAL','LOW',NOW(6),NOW(6)),
 ('IA2_MOB_TOE_TOUCH','Bạn chạm mũi chân khi gối thẳng được không?',NULL,'SINGLE_CHOICE','SINGLE_CHOICE','MOBILITY',NULL,TRUE,TRUE,0,NULL,NULL,NULL,@tpl,1,'SELF_RATING_CHOICE','QUESTION','CATEGORICAL','LOW',NOW(6),NOW(6)),
 ('IA2_PRIMARY_GOAL','Mục tiêu chính của bạn?',NULL,'SINGLE_CHOICE','SINGLE_CHOICE','GOALS',NULL,TRUE,TRUE,0,NULL,NULL,NULL,@tpl,1,'GOAL','QUESTION','CATEGORICAL',NULL,NOW(6),NOW(6)),
 ('IA2_SECONDARY_GOALS','Mục tiêu phụ (tối đa 2)?',NULL,'MULTI_CHOICE','MULTIPLE_CHOICE','GOALS',NULL,FALSE,TRUE,0,NULL,NULL,'{"maxSelections":2}',@tpl,1,'GOAL','QUESTION','CATEGORICAL',NULL,NOW(6),NOW(6)),
 ('IA2_DAYS_PER_WEEK','Bạn có thể tập mấy buổi mỗi tuần?',NULL,'SINGLE_CHOICE','SINGLE_CHOICE','CONSTRAINTS',NULL,TRUE,TRUE,0,NULL,NULL,NULL,@tpl,1,'CONSTRAINT','QUESTION','CATEGORICAL',NULL,NOW(6),NOW(6)),
 ('IA2_SESSION_MINUTES','Mỗi buổi bạn có bao nhiêu phút?',NULL,'SINGLE_CHOICE','SINGLE_CHOICE','CONSTRAINTS',NULL,TRUE,TRUE,0,NULL,NULL,NULL,@tpl,1,'CONSTRAINT','QUESTION','CATEGORICAL',NULL,NOW(6),NOW(6)),
 ('IA2_EQUIPMENT','Bạn có dụng cụ nào?',NULL,'MULTI_CHOICE','MULTIPLE_CHOICE','CONSTRAINTS',NULL,TRUE,TRUE,0,NULL,NULL,NULL,@tpl,1,'CONSTRAINT','QUESTION','CATEGORICAL',NULL,NOW(6),NOW(6)),
 ('IA2_ENVIRONMENT','Bạn thường tập ở đâu?',NULL,'SINGLE_CHOICE','SINGLE_CHOICE','CONSTRAINTS',NULL,FALSE,TRUE,0,NULL,NULL,NULL,@tpl,1,'CONSTRAINT','QUESTION','CATEGORICAL',NULL,NOW(6),NOW(6)),
 ('IA2_STYLE','Phong cách tập bạn ưa thích?',NULL,'SINGLE_CHOICE','SINGLE_CHOICE','CONSTRAINTS',NULL,FALSE,TRUE,0,NULL,NULL,NULL,@tpl,1,'GOAL','QUESTION','CATEGORICAL',NULL,NOW(6),NOW(6));

-- 6.2 Câu theo năng lực (PUSH, PULL, LEGS, CORE, SKILL) sinh từ bảng tạm
DROP TABLE IF EXISTS tmp_v2_comp;
CREATE TABLE tmp_v2_comp (
    code VARCHAR(10), ladder_code VARCHAR(20), sort_base INT, node_text VARCHAR(255), instr TEXT, max_value DECIMAL(10,2)
) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
INSERT INTO tmp_v2_comp VALUES
 ('PUSH','PUSH_LADDER',30,'Bài ĐẨY khó nhất bạn đã làm được đúng kỹ thuật?','Rep hợp lệ: thân thẳng, ngực gần chạm sàn/xà, khuỷu duỗi hết ở đỉnh, không võng lưng.',200),
 ('PULL','PULL_LADDER',40,'Bài KÉO khó nhất bạn đã làm được đúng kỹ thuật?','Rep hợp lệ: bắt đầu tay duỗi thẳng, cằm qua xà, không đung đưa/kipping.',100),
 ('LEGS','LEGS_LADDER',50,'Bài CHÂN khó nhất bạn đã làm được đúng kỹ thuật?','Rep hợp lệ: đùi tối thiểu song song sàn (squat), gót không nhấc, kiểm soát khi hạ.',200),
 ('CORE','CORE_LADDER',60,'Bài CORE khó nhất bạn đã làm được đúng kỹ thuật?','Giữ/lặp hợp lệ: hông không võng, không nín thở; dừng khi mất tư thế.',600),
 ('SKILL','SKILL_LADDER',70,'Kỹ năng thăng bằng/trồng chuối khó nhất bạn đã làm được?','Tính thời gian giữ ổn định (có thể áp tường nếu bài ghi rõ); dừng khi mất thăng bằng.',600);

INSERT INTO assessment_questions (question_code, question_text, instruction, question_type, input_type, category, required, active, default_weight, config_json, owner_template_id, version,
                                  evidence_role, item_kind, answer_kind, reliability_class, ladder_id, created_at, updated_at)
SELECT CONCAT('IA2_', c.code, '_NODE'), c.node_text, CONCAT(c.instr, ' "Chưa thử/không có dụng cụ" KHÔNG bị tính là chưa làm được.'), 'SINGLE_CHOICE', 'SINGLE_CHOICE', c.code, TRUE, TRUE, 0,
       JSON_OBJECT('ladderCode', c.ladder_code, 'notTriedOption', 'NOT_TRIED', 'noneOption', 'NONE'), @tpl, 1, 'PERFORMANCE_LADDER', 'QUESTION', 'LADDER_NODE', 'HIGH', l.id, NOW(6), NOW(6)
FROM tmp_v2_comp c JOIN progression_ladders l ON l.rule_set_id = @v2 AND l.code = c.ladder_code
UNION ALL
SELECT CONCAT('IA2_', c.code, '_VALUE'), 'Với bài vừa chọn, bạn làm được tối đa bao nhiêu lần (hoặc giữ bao nhiêu giây) liên tục?', 'Chỉ tính lần đúng kỹ thuật.', 'NUMBER', 'NUMERIC_INPUT', c.code, TRUE, TRUE, 0,
       JSON_OBJECT('ladderCode', c.ladder_code, 'nodeQuestion', CONCAT('IA2_', c.code, '_NODE')), @tpl, 1, 'PERFORMANCE_LADDER', 'QUESTION', 'LADDER_VALUE', 'HIGH', l.id, NOW(6), NOW(6)
FROM tmp_v2_comp c JOIN progression_ladders l ON l.rule_set_id = @v2 AND l.code = c.ladder_code
UNION ALL
SELECT CONCAT('IA2_', c.code, '_VERIFY'), 'Với bài NGAY BÊN DƯỚI bài vừa chọn, bạn làm được bao nhiêu lần (hoặc giây) liên tục?', 'Tuỳ chọn - giúp xác nhận câu trả lời. Bỏ trống nếu chưa thử (không bị tính là chưa làm được).', 'NUMBER', 'NUMERIC_INPUT', c.code, FALSE, TRUE, 0,
       JSON_OBJECT('ladderCode', c.ladder_code, 'nodeQuestion', CONCAT('IA2_', c.code, '_NODE'), 'verifiesStageBelowClaimed', TRUE), @tpl, 1, 'PERFORMANCE_LADDER', 'QUESTION', 'LADDER_VALUE', 'MEDIUM', l.id, NOW(6), NOW(6)
FROM tmp_v2_comp c JOIN progression_ladders l ON l.rule_set_id = @v2 AND l.code = c.ladder_code
UNION ALL
SELECT CONCAT('IA2_', c.code, '_RECENCY'), 'Bạn thử con số này lần gần nhất khi nào?', 'Chỉ ảnh hưởng độ chắc chắn của kết quả, không ảnh hưởng điểm.', 'SINGLE_CHOICE', 'SINGLE_CHOICE', c.code, FALSE, TRUE, 0,
       JSON_OBJECT('modifies', c.code), @tpl, 1, 'RELIABILITY_MODIFIER', 'QUESTION', 'CATEGORICAL', NULL, NULL, NOW(6), NOW(6)
FROM tmp_v2_comp c
UNION ALL
SELECT CONCAT('IA2_', c.code, '_FORM_CONF'), 'Bạn tự tin đến mức nào rằng kỹ thuật của mình đúng chuẩn?', 'Chỉ ảnh hưởng độ chắc chắn của kết quả; tự tin cao không làm tăng điểm.', 'SINGLE_CHOICE', 'SINGLE_CHOICE', c.code, FALSE, TRUE, 0,
       JSON_OBJECT('modifies', c.code), @tpl, 1, 'RELIABILITY_MODIFIER', 'QUESTION', 'CATEGORICAL', NULL, NULL, NOW(6), NOW(6)
FROM tmp_v2_comp c
ON DUPLICATE KEY UPDATE question_code = question_code;

UPDATE assessment_questions q JOIN tmp_v2_comp c ON q.question_code COLLATE utf8mb4_0900_ai_ci IN (CONCAT('IA2_', c.code, '_VALUE'), CONCAT('IA2_', c.code, '_VERIFY'))
SET q.min_value = 0, q.max_value = c.max_value, q.plausible_max = c.max_value
WHERE q.owner_template_id = @tpl;

-- 6.3 Tuỳ chọn
-- NODE: NOT_TRIED, NONE, rồi các stage theo rank (label lấy từ tên bài tập)
INSERT INTO assessment_question_options (question_id, option_code, option_label, numeric_value, sort_order, active)
SELECT q.id, o.code, o.label, NULL, o.ord, TRUE
FROM assessment_questions q JOIN (SELECT 'NOT_TRIED' code, 'Chưa thử các bài này / không có dụng cụ' label, 0 ord
                                  UNION ALL SELECT 'NONE', 'Đã thử nhưng chưa làm được bài nào bên dưới', 1) o
WHERE q.owner_template_id = @tpl AND q.question_code LIKE 'IA2\_%\_NODE';

INSERT INTO assessment_question_options (question_id, option_code, option_label, numeric_value, sort_order, active)
SELECT q.id, st.code,
       CONCAT(COALESCE(e.display_name, e.name), IF(st.metric = 'HOLD_SEC', ' (giây)', ' (số lần)')),
       st.rank_no, 10 + st.rank_no, TRUE
FROM assessment_questions q
JOIN progression_ladders l ON l.rule_set_id = @v2 AND q.ladder_id = l.id
JOIN progression_stages st ON st.ladder_id = l.id
JOIN exercises e ON e.id = st.exercise_id
WHERE q.owner_template_id = @tpl AND q.question_code LIKE 'IA2\_%\_NODE';

-- RECENCY / FORM_CONF
INSERT INTO assessment_question_options (question_id, option_code, option_label, sort_order, active)
SELECT q.id, o.code, o.label, o.ord, TRUE
FROM assessment_questions q JOIN (SELECT 'RECENT_30D' code, 'Trong 30 ngày qua' label, 1 ord UNION ALL SELECT 'RECENT_1_6M','Cách đây 1-6 tháng',2
                                  UNION ALL SELECT 'ESTIMATE','Tôi ước chừng, chưa thử gần đây',3) o
WHERE q.owner_template_id = @tpl AND q.question_code LIKE 'IA2\_%\_RECENCY';
INSERT INTO assessment_question_options (question_id, option_code, option_label, sort_order, active)
SELECT q.id, o.code, o.label, o.ord, TRUE
FROM assessment_questions q JOIN (SELECT 'NOT_CONFIDENT' code, 'Không tự tin' label, 1 ord UNION ALL SELECT 'SLIGHT','Hơi tự tin',2
                                  UNION ALL SELECT 'MODERATE','Khá tự tin',3 UNION ALL SELECT 'VERY','Rất tự tin',4
                                  UNION ALL SELECT 'EXTREMELY','Cực kỳ tự tin',5) o
WHERE q.owner_template_id = @tpl AND q.question_code LIKE 'IA2\_%\_FORM_CONF';

-- MOBILITY: điểm option cấu hình ở đây (CANNOT..VERY_EASY); NOT_TRIED => score NULL => NOT_ASSESSED (không phải 0)
INSERT INTO assessment_question_options (question_id, option_code, option_label, score, sort_order, active)
SELECT q.id, o.code, o.label, o.score, o.ord, TRUE
FROM assessment_questions q JOIN (SELECT 'NOT_TRIED' code, 'Chưa thử / không chắc' label, NULL score, 0 ord
                                  UNION ALL SELECT 'CANNOT','Không làm được',0,1 UNION ALL SELECT 'DIFFICULT','Khó',25,2
                                  UNION ALL SELECT 'CAN','Làm được',50,3 UNION ALL SELECT 'EASY','Dễ',75,4
                                  UNION ALL SELECT 'VERY_EASY','Rất dễ',100,5) o
WHERE q.owner_template_id = @tpl AND q.question_code LIKE 'IA2\_MOB\_%';

-- Ngữ cảnh/hồ sơ/mục tiêu/ràng buộc: numeric_value là GIÁ TRỊ THỨ TỰ (tháng, buổi...), KHÔNG phải điểm 0-100
INSERT INTO assessment_question_options (question_id, option_code, option_label, numeric_value, sort_order, active)
SELECT q.id, o.code, o.label, o.num, o.ord, TRUE
FROM assessment_questions q JOIN (
  SELECT 'IA2_EXP_MONTHS' qc, 'NONE' code, 'Chưa từng tập' label, 0 num, 1 ord
  UNION ALL SELECT 'IA2_EXP_MONTHS','LT_3M','Dưới 3 tháng',1.5,2 UNION ALL SELECT 'IA2_EXP_MONTHS','M3_6','3-6 tháng',4.5,3
  UNION ALL SELECT 'IA2_EXP_MONTHS','M6_12','6-12 tháng',9,4 UNION ALL SELECT 'IA2_EXP_MONTHS','GT_12M','Trên 1 năm',18,5
  UNION ALL SELECT 'IA2_TRAIN_DAYS','D0','0 buổi',0,1 UNION ALL SELECT 'IA2_TRAIN_DAYS','D1','1 buổi',1,2 UNION ALL SELECT 'IA2_TRAIN_DAYS','D2','2 buổi',2,3
  UNION ALL SELECT 'IA2_TRAIN_DAYS','D3','3 buổi',3,4 UNION ALL SELECT 'IA2_TRAIN_DAYS','D4','4 buổi',4,5 UNION ALL SELECT 'IA2_TRAIN_DAYS','D5','5 buổi trở lên',5,6
  UNION ALL SELECT 'IA2_RESISTANCE_EXP','NEVER','Chưa từng',0,1 UNION ALL SELECT 'IA2_RESISTANCE_EXP','RARELY','Hiếm khi',1,2
  UNION ALL SELECT 'IA2_RESISTANCE_EXP','SOMETIMES','Thỉnh thoảng',2,3 UNION ALL SELECT 'IA2_RESISTANCE_EXP','REGULARLY','Thường xuyên',3,4
  UNION ALL SELECT 'IA2_RESISTANCE_EXP','VERY_REGULARLY','Rất thường xuyên',4,5
  UNION ALL SELECT 'IA2_SEX','MALE','Nam',NULL,1 UNION ALL SELECT 'IA2_SEX','FEMALE','Nữ',NULL,2 UNION ALL SELECT 'IA2_SEX','OTHER','Khác',NULL,3
  UNION ALL SELECT 'IA2_SEX','NOT_SAY','Không muốn nói',NULL,4
  UNION ALL SELECT 'IA2_ACTIVITY_LEVEL','SEDENTARY','Ít vận động',NULL,1 UNION ALL SELECT 'IA2_ACTIVITY_LEVEL','LIGHT','Vận động nhẹ',NULL,2
  UNION ALL SELECT 'IA2_ACTIVITY_LEVEL','MODERATE','Vận động vừa',NULL,3 UNION ALL SELECT 'IA2_ACTIVITY_LEVEL','ACTIVE','Vận động nhiều',NULL,4
  UNION ALL SELECT 'IA2_DAYS_PER_WEEK','DAYS_1','1 buổi',1,1 UNION ALL SELECT 'IA2_DAYS_PER_WEEK','DAYS_2','2 buổi',2,2
  UNION ALL SELECT 'IA2_DAYS_PER_WEEK','DAYS_3','3 buổi',3,3 UNION ALL SELECT 'IA2_DAYS_PER_WEEK','DAYS_4','4 buổi',4,4
  UNION ALL SELECT 'IA2_DAYS_PER_WEEK','DAYS_5','5 buổi',5,5 UNION ALL SELECT 'IA2_DAYS_PER_WEEK','DAYS_6','6 buổi',6,6
  UNION ALL SELECT 'IA2_SESSION_MINUTES','M15','15 phút',15,1 UNION ALL SELECT 'IA2_SESSION_MINUTES','M30','30 phút',30,2
  UNION ALL SELECT 'IA2_SESSION_MINUTES','M45','45 phút',45,3 UNION ALL SELECT 'IA2_SESSION_MINUTES','M60','60 phút',60,4
  UNION ALL SELECT 'IA2_SESSION_MINUTES','M90','90 phút',90,5
  UNION ALL SELECT 'IA2_EQUIPMENT','NONE','Không có dụng cụ',NULL,1 UNION ALL SELECT 'IA2_EQUIPMENT','PULL_UP_BAR','Xà đơn',NULL,2
  UNION ALL SELECT 'IA2_EQUIPMENT','PARALLEL_BARS','Xà kép / ghế dip',NULL,3 UNION ALL SELECT 'IA2_EQUIPMENT','LOW_BAR','Xà thấp / bàn chắc',NULL,4
  UNION ALL SELECT 'IA2_EQUIPMENT','RINGS','Vòng treo',NULL,5 UNION ALL SELECT 'IA2_EQUIPMENT','BANDS','Dây kháng lực',NULL,6
  UNION ALL SELECT 'IA2_ENVIRONMENT','HOME','Ở nhà',NULL,1 UNION ALL SELECT 'IA2_ENVIRONMENT','GYM','Phòng tập',NULL,2
  UNION ALL SELECT 'IA2_ENVIRONMENT','PARK','Công viên / ngoài trời',NULL,3
  UNION ALL SELECT 'IA2_STYLE','STRENGTH','Sức mạnh',NULL,1 UNION ALL SELECT 'IA2_STYLE','SKILL','Kỹ năng',NULL,2
  UNION ALL SELECT 'IA2_STYLE','MIXED','Kết hợp',NULL,3 UNION ALL SELECT 'IA2_STYLE','ENDURANCE','Sức bền',NULL,4
) o ON o.qc = q.question_code COLLATE utf8mb4_0900_ai_ci
WHERE q.owner_template_id = @tpl;

-- Mục tiêu (kế thừa mã mục tiêu của v1: DefaultLevelEngineConfig.GOALS)
INSERT INTO assessment_question_options (question_id, option_code, option_label, sort_order, active)
SELECT q.id, g.code, g.label, g.ord, TRUE
FROM assessment_questions q JOIN (
  SELECT 'FIRST_PULL_UP' code, 'Pull-up đầu tiên' label, 1 ord UNION ALL SELECT 'MUSCLE_UP','Muscle-up',2 UNION ALL SELECT 'HANDSTAND','Handstand',3
  UNION ALL SELECT 'STRENGTH','Sức mạnh',4 UNION ALL SELECT 'MUSCLE_GAIN','Tăng cơ',5 UNION ALL SELECT 'WEIGHT_LOSS','Giảm mỡ',6
  UNION ALL SELECT 'ENDURANCE','Sức bền',7 UNION ALL SELECT 'FLEXIBILITY','Linh hoạt',8 UNION ALL SELECT 'SKILL','Kỹ năng',9
  UNION ALL SELECT 'GENERAL_FITNESS','Thể lực tổng quát',10 UNION ALL SELECT 'POSTURE','Tư thế',11) g
WHERE q.owner_template_id = @tpl AND q.question_code IN ('IA2_PRIMARY_GOAL', 'IA2_SECONDARY_GOALS');

-- 6.4 Ánh xạ năng lực (CHỈ câu chấm điểm: ladder + mobility). Không có mapping cho CONTEXT/PROFILE/GOAL/CONSTRAINT/RELIABILITY (I4).
INSERT INTO question_competency_weights (question_id, competency_code, mapping_type, weight)
SELECT q.id, c.code, 'LADDER_NODE', 1 FROM assessment_questions q JOIN tmp_v2_comp c ON q.question_code COLLATE utf8mb4_0900_ai_ci = CONCAT('IA2_', c.code, '_NODE')
UNION ALL SELECT q.id, c.code, 'LADDER_VALUE', 1 FROM assessment_questions q JOIN tmp_v2_comp c ON q.question_code COLLATE utf8mb4_0900_ai_ci = CONCAT('IA2_', c.code, '_VALUE')
UNION ALL SELECT q.id, c.code, 'LADDER_VERIFY', 1 FROM assessment_questions q JOIN tmp_v2_comp c ON q.question_code COLLATE utf8mb4_0900_ai_ci = CONCAT('IA2_', c.code, '_VERIFY')
UNION ALL SELECT q.id, 'MOBILITY', 'SCORE', 1 FROM assessment_questions q WHERE q.owner_template_id = @tpl AND q.question_code LIKE 'IA2\_MOB\_%';

-- 6.5 Thứ tự + hiển thị có điều kiện (backend tính lại danh sách câu hiển thị; câu ẩn KHÔNG vào mẫu số)
DROP TABLE IF EXISTS tmp_v2_order;
CREATE TABLE tmp_v2_order (question_code VARCHAR(100), section_code VARCHAR(20), sort_order INT, required BOOLEAN, visibility_json JSON) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
INSERT INTO tmp_v2_order VALUES
 ('IA2_AGE','PROFILE',1,TRUE,NULL), ('IA2_SEX','PROFILE',2,FALSE,NULL), ('IA2_HEIGHT_CM','PROFILE',3,FALSE,NULL), ('IA2_WEIGHT_KG','PROFILE',4,FALSE,NULL),
 ('IA2_ACTIVITY_LEVEL','PROFILE',5,FALSE,NULL),
 ('IA2_EXP_MONTHS','EXPERIENCE',10,TRUE,NULL), ('IA2_TRAIN_DAYS','EXPERIENCE',11,TRUE,NULL), ('IA2_RESISTANCE_EXP','EXPERIENCE',12,FALSE,NULL),
 ('IA2_MOB_DEEP_SQUAT','MOBILITY',80,TRUE,NULL), ('IA2_MOB_OVERHEAD','MOBILITY',81,TRUE,NULL), ('IA2_MOB_TOE_TOUCH','MOBILITY',82,TRUE,NULL),
 ('IA2_PRIMARY_GOAL','GOALS',90,TRUE,NULL), ('IA2_SECONDARY_GOALS','GOALS',91,FALSE,NULL),
 ('IA2_DAYS_PER_WEEK','CONSTRAINTS',100,TRUE,NULL), ('IA2_SESSION_MINUTES','CONSTRAINTS',101,TRUE,NULL), ('IA2_EQUIPMENT','CONSTRAINTS',102,TRUE,NULL),
 ('IA2_ENVIRONMENT','CONSTRAINTS',103,FALSE,NULL), ('IA2_STYLE','CONSTRAINTS',104,FALSE,NULL);

INSERT INTO tmp_v2_order
SELECT CONCAT('IA2_', c.code, '_NODE'), c.code, c.sort_base, TRUE, NULL FROM tmp_v2_comp c
UNION ALL SELECT CONCAT('IA2_', c.code, '_VALUE'), c.code, c.sort_base + 1, TRUE,
       JSON_OBJECT('all', JSON_ARRAY(JSON_OBJECT('question', CONCAT('IA2_', c.code, '_NODE'), 'op', 'NOT_IN', 'value', JSON_ARRAY('NOT_TRIED', 'NONE')))) FROM tmp_v2_comp c
UNION ALL SELECT CONCAT('IA2_', c.code, '_VERIFY'), c.code, c.sort_base + 2, FALSE,
       JSON_OBJECT('ladderVerify', c.ladder_code, 'nodeQuestion', CONCAT('IA2_', c.code, '_NODE')) FROM tmp_v2_comp c
UNION ALL SELECT CONCAT('IA2_', c.code, '_RECENCY'), c.code, c.sort_base + 3, FALSE,
       JSON_OBJECT('all', JSON_ARRAY(JSON_OBJECT('question', CONCAT('IA2_', c.code, '_NODE'), 'op', 'NOT_IN', 'value', JSON_ARRAY('NOT_TRIED')))) FROM tmp_v2_comp c
UNION ALL SELECT CONCAT('IA2_', c.code, '_FORM_CONF'), c.code, c.sort_base + 4, FALSE,
       JSON_OBJECT('all', JSON_ARRAY(JSON_OBJECT('question', CONCAT('IA2_', c.code, '_NODE'), 'op', 'NOT_IN', 'value', JSON_ARRAY('NOT_TRIED')))) FROM tmp_v2_comp c;

INSERT INTO assessment_template_questions (template_id, question_id, sort_order, weight, required, section_title, section_id, visibility_json)
SELECT @tpl, q.id, o.sort_order, 0, o.required, s.title, s.id, o.visibility_json
FROM tmp_v2_order o
JOIN assessment_questions q ON q.question_code COLLATE utf8mb4_0900_ai_ci = o.question_code
JOIN assessment_sections s ON s.template_id = @tpl AND s.code = o.section_code
WHERE NOT EXISTS (SELECT 1 FROM assessment_template_questions x WHERE x.template_id = @tpl AND x.question_id = q.id);

DROP TABLE IF EXISTS tmp_v2_order;
DROP TABLE IF EXISTS tmp_v2_comp;

-- Kết thúc. Chạy migration_assessment_v2_03_verify.sql để kiểm tra (kỳ vọng: không có dòng lỗi).
SELECT @v1 AS v1_rule_set_id, @v2 AS v2_rule_set_id, @tpl AS initial_template_id, @sft AS safety_template_id;
