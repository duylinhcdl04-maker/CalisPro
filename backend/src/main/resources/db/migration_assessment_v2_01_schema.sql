-- =========================================================================================
-- CALISHEALTH - ASSESSMENT FRAMEWORK V2 - GIAI ĐOẠN 1 / BƯỚC 1: SCHEMA (ADDITIVE)
-- Đặc tả: backend/docs/ASSESSMENT_FRAMEWORK_V2.md (v2.3) §10, §27
--
-- Nguyên tắc:
--   * CHỈ THÊM (CREATE TABLE IF NOT EXISTS / ADD COLUMN / nới cột trạng thái). Không DROP, không đổi hành vi Level Engine v1.
--   * Chạy MỘT LẦN (như các migration_*.sql khác). Phần ALTER không idempotent; phần CREATE TABLE idempotent.
--   * Yêu cầu MySQL 8.0.16+ (CHECK constraint, JSON).
--   * Kiểu khoá: bảng tạo bởi calishealth.sql / migration_assessment_templates.sql dùng BIGINT UNSIGNED;
--     bảng do Hibernate (ddl-auto: update) tạo (rule_sets, engine_parameters, level_*, user_level_state ...)
--     dùng BIGINT (signed) => KHÔNG khai báo FK tới các bảng Hibernate (lệch kiểu sẽ làm FK lỗi);
--     toàn vẹn được kiểm bằng migration_assessment_v2_03_verify.sql.
--   * Mọi trạng thái "không đủ/không tin cậy" có giá trị riêng (NOT_ASSESSED, UNRELIABLE, INSUFFICIENT_EVIDENCE...),
--     tách khỏi FAIL (nguyên tắc I19).
-- Thứ tự chạy: 01_schema -> 02_seed -> 03_verify.   Gỡ: 99_rollback.
-- =========================================================================================

-- -----------------------------------------------------------------------------------------
-- A. BẢNG MỚI - KHUNG ASSESSMENT DÙNG CHUNG
-- -----------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS assessment_sections (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    template_id     BIGINT UNSIGNED NOT NULL,
    code            VARCHAR(40)     NOT NULL,
    title           VARCHAR(150)    NOT NULL,
    sort_order      INT             NOT NULL,
    visibility_json JSON            NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_sec (template_id, code),
    CONSTRAINT fk_sections_template FOREIGN KEY (template_id) REFERENCES assessment_templates (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- Thang tiến trình: rule_set_id là BIGINT (signed) khớp rule_sets do Hibernate tạo; không FK.
CREATE TABLE IF NOT EXISTS progression_ladders (
    id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    rule_set_id      BIGINT          NOT NULL,
    code             VARCHAR(40)     NOT NULL,
    competency_code  VARCHAR(30)     NOT NULL,
    verify_from_rank INT             NULL COMMENT 'Hiện câu kiểm chứng nấc dưới khi stage khai báo có rank >= giá trị này',
    source_type      VARCHAR(30)     NOT NULL,
    source_reference VARCHAR(500)    NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_ladder (rule_set_id, code),
    KEY ix_ladder_competency (rule_set_id, competency_code)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS progression_stages (
    id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    ladder_id      BIGINT UNSIGNED NOT NULL,
    code           VARCHAR(60)     NOT NULL COMMENT 'Mặc định = exercises.code',
    exercise_id    BIGINT UNSIGNED NOT NULL,
    rank_no        INT             NOT NULL,
    metric         VARCHAR(20)     NOT NULL COMMENT 'VALID_REPS | HOLD_SEC',
    pass_value     DECIMAL(10,2)   NOT NULL COMMENT 'value >= pass_value => PASS',
    target_value   DECIMAL(10,2)   NOT NULL,
    base_score     DECIMAL(5,2)    NOT NULL,
    span_score     DECIMAL(5,2)    NOT NULL,
    min_form_score DECIMAL(5,2)    NULL COMMENT 'Chỉ dùng cho đánh giá thực hành',
    PRIMARY KEY (id),
    UNIQUE KEY uk_stage (ladder_id, code),
    UNIQUE KEY uk_rank (ladder_id, rank_no),
    CONSTRAINT chk_stage_metric CHECK (metric IN ('VALID_REPS', 'HOLD_SEC')),
    CONSTRAINT chk_stage_pass_target CHECK (pass_value > 0 AND pass_value <= target_value),
    CONSTRAINT chk_stage_score CHECK (base_score >= 0 AND span_score > 0 AND base_score + span_score <= 100),
    CONSTRAINT fk_stage_ladder FOREIGN KEY (ladder_id) REFERENCES progression_ladders (id) ON DELETE CASCADE,
    CONSTRAINT fk_stage_exercise FOREIGN KEY (exercise_id) REFERENCES exercises (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS progression_stage_prerequisites (
    id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    stage_id              BIGINT UNSIGNED NOT NULL,
    prerequisite_stage_id BIGINT UNSIGNED NOT NULL,
    mandatory             BOOLEAN         NOT NULL DEFAULT TRUE,
    bypass_policy         VARCHAR(15)     NOT NULL DEFAULT 'NONE' COMMENT 'NONE | ALLOW_BYPASS',
    PRIMARY KEY (id),
    UNIQUE KEY uk_pre (stage_id, prerequisite_stage_id),
    CONSTRAINT chk_pre_bypass CHECK (bypass_policy IN ('NONE', 'ALLOW_BYPASS')),
    CONSTRAINT chk_pre_self CHECK (stage_id <> prerequisite_stage_id),
    CONSTRAINT fk_pre_stage FOREIGN KEY (stage_id) REFERENCES progression_stages (id) ON DELETE CASCADE,
    CONSTRAINT fk_pre_prereq FOREIGN KEY (prerequisite_stage_id) REFERENCES progression_stages (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- Mỗi attempt = một lần thực hiện ĐỘC LẬP (quyết định A). UNIQUE(movement_session_id) chặn dùng chung một lần quay.
CREATE TABLE IF NOT EXISTS assessment_attempts (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    session_id          BIGINT UNSIGNED NOT NULL,
    item_id             BIGINT UNSIGNED NOT NULL COMMENT 'assessment_questions.id (item_kind = PRACTICAL_TEST)',
    attempt_no          INT             NOT NULL,
    movement_session_id BIGINT UNSIGNED NOT NULL,
    started_at          DATETIME(6)     NOT NULL,
    ended_at            DATETIME(6)     NOT NULL,
    rest_before_sec     INT             NULL,
    measurement_status  VARCHAR(25)     NOT NULL COMMENT 'VALID | INVALID_MEASUREMENT | USER_ABORTED',
    invalid_reason_code VARCHAR(40)     NULL COMMENT 'LOW_POSE_CONFIDENCE | LANDMARKS_NOT_VISIBLE | BAD_CAMERA | EXERCISE_UNRECOGNIZED | INCOMPLETE_DATA | PAIN',
    reliability         DECIMAL(4,3)    NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_attempt (session_id, item_id, attempt_no),
    UNIQUE KEY uk_attempt_ms (movement_session_id),
    CONSTRAINT chk_attempt_status CHECK (measurement_status IN ('VALID', 'INVALID_MEASUREMENT', 'USER_ABORTED')),
    CONSTRAINT chk_attempt_time CHECK (ended_at >= started_at),
    CONSTRAINT fk_attempt_session FOREIGN KEY (session_id) REFERENCES assessment_sessions (id) ON DELETE CASCADE,
    CONSTRAINT fk_attempt_item FOREIGN KEY (item_id) REFERENCES assessment_questions (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- Bằng chứng (KHÔNG xoá bằng chứng bậc thấp). status tách FAIL (đủ + tin cậy) khỏi NOT_ASSESSED / UNRELIABLE.
CREATE TABLE IF NOT EXISTS assessment_evidence (
    id                          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    session_id                  BIGINT UNSIGNED NOT NULL,
    ladder_id                   BIGINT UNSIGNED NULL,
    stage_id                    BIGINT UNSIGNED NULL,
    exercise_id                 BIGINT UNSIGNED NULL,
    attempt_id                  BIGINT UNSIGNED NULL,
    response_id                 BIGINT UNSIGNED NULL,
    movement_session_id         BIGINT UNSIGNED NULL,
    evidence_role               VARCHAR(30)     NOT NULL,
    status                      VARCHAR(30)     NOT NULL COMMENT 'PASS|FAIL|NOT_ASSESSED|UNRELIABLE|INFERRED_PASS|REJECTED_PREREQ',
    origin                      VARCHAR(10)     NOT NULL DEFAULT 'DIRECT' COMMENT 'DIRECT | INFERRED',
    performance_value           DECIMAL(10,2)   NULL,
    unit                        VARCHAR(10)     NULL,
    quality_score               DECIMAL(5,2)    NULL,
    is_valid                    BOOLEAN         NULL,
    confidence                  DECIMAL(4,3)    NULL,
    reason_code                 VARCHAR(50)     NULL,
    reason_json                 JSON            NULL,
    motion_profile_version      VARCHAR(30)     NULL,
    motion_rule_versions_json   JSON            NULL,
    assessment_template_version INT             NOT NULL,
    created_at                  DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY ix_ev_session (session_id),
    KEY ix_ev_stage (stage_id),
    KEY ix_ev_attempt (attempt_id),
    CONSTRAINT chk_ev_status CHECK (status IN ('PASS', 'FAIL', 'NOT_ASSESSED', 'UNRELIABLE', 'INFERRED_PASS', 'REJECTED_PREREQ')),
    CONSTRAINT chk_ev_origin CHECK (origin IN ('DIRECT', 'INFERRED')),
    CONSTRAINT fk_ev_session FOREIGN KEY (session_id) REFERENCES assessment_sessions (id) ON DELETE CASCADE,
    CONSTRAINT fk_ev_ladder FOREIGN KEY (ladder_id) REFERENCES progression_ladders (id),
    CONSTRAINT fk_ev_stage FOREIGN KEY (stage_id) REFERENCES progression_stages (id),
    CONSTRAINT fk_ev_attempt FOREIGN KEY (attempt_id) REFERENCES assessment_attempts (id),
    CONSTRAINT fk_ev_response FOREIGN KEY (response_id) REFERENCES assessment_responses (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS assessment_ladder_results (
    id                        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    session_id                BIGINT UNSIGNED NOT NULL,
    ladder_id                 BIGINT UNSIGNED NOT NULL,
    highest_achieved_stage_id BIGINT UNSIGNED NULL,
    stage_performance_ratio   DECIMAL(5,4)    NULL,
    ladder_score              DECIMAL(5,2)    NULL COMMENT 'NULL = không có số liệu (KHÔNG phải 0)',
    evidence_state            VARCHAR(25)     NOT NULL COMMENT 'ACHIEVED | NONE_ACHIEVED | NO_EVIDENCE | UNRELIABLE',
    verification_status       VARCHAR(20)     NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_lr (session_id, ladder_id),
    CONSTRAINT chk_lr_state CHECK (evidence_state IN ('ACHIEVED', 'NONE_ACHIEVED', 'NO_EVIDENCE', 'UNRELIABLE')),
    CONSTRAINT fk_lr_session FOREIGN KEY (session_id) REFERENCES assessment_sessions (id) ON DELETE CASCADE,
    CONSTRAINT fk_lr_ladder FOREIGN KEY (ladder_id) REFERENCES progression_ladders (id),
    CONSTRAINT fk_lr_stage FOREIGN KEY (highest_achieved_stage_id) REFERENCES progression_stages (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS assessment_metrics (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    session_id          BIGINT UNSIGNED NOT NULL,
    item_id             BIGINT UNSIGNED NULL,
    attempt_id          BIGINT UNSIGNED NULL,
    metric_code         VARCHAR(40)     NOT NULL,
    value               DECIMAL(12,4)   NOT NULL,
    unit                VARCHAR(15)     NULL,
    movement_session_id BIGINT UNSIGNED NULL,
    created_at          DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY ix_m_session (session_id),
    CONSTRAINT fk_m_session FOREIGN KEY (session_id) REFERENCES assessment_sessions (id) ON DELETE CASCADE,
    CONSTRAINT fk_m_attempt FOREIGN KEY (attempt_id) REFERENCES assessment_attempts (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS assessment_reliability (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    session_id   BIGINT UNSIGNED NOT NULL,
    scope        VARCHAR(15)     NOT NULL COMMENT 'ITEM | ATTEMPT | COMPETENCY | SESSION',
    subject_code VARCHAR(50)     NULL,
    factor_code  VARCHAR(40)     NOT NULL COMMENT 'COVERAGE|BASE_CLASS|FORM_FACTOR|RECENCY|DATA_QUALITY|POSE_CONFIDENCE|VISIBILITY|TRACKED_RATIO',
    factor_value DECIMAL(6,4)    NOT NULL,
    detail_json  JSON            NULL,
    PRIMARY KEY (id),
    KEY ix_rel (session_id, scope),
    CONSTRAINT chk_rel_scope CHECK (scope IN ('ITEM', 'ATTEMPT', 'COMPETENCY', 'SESSION')),
    CONSTRAINT fk_rel_session FOREIGN KEY (session_id) REFERENCES assessment_sessions (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS assessment_results (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    session_id          BIGINT UNSIGNED NOT NULL,
    overall_score       DECIMAL(5,2)    NULL,
    answer_confidence   DECIMAL(4,3)    NULL,
    data_quality        VARCHAR(15)     NOT NULL COMMENT 'HIGH|MEDIUM|LOW|CONFLICTED',
    level_evaluation_id BIGINT UNSIGNED NULL COMMENT 'level_evaluations.id (bảng Hibernate, không FK)',
    snapshot_json       JSON            NOT NULL COMMENT 'Toàn bộ input/output + trọng số hiệu lực để tái lập',
    created_at          DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_result_session (session_id),
    CONSTRAINT chk_res_quality CHECK (data_quality IN ('HIGH', 'MEDIUM', 'LOW', 'CONFLICTED')),
    CONSTRAINT fk_res_session FOREIGN KEY (session_id) REFERENCES assessment_sessions (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS assessment_result_competencies (
    id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    result_id          BIGINT UNSIGNED NOT NULL,
    competency_code    VARCHAR(30)     NOT NULL,
    score              DECIMAL(5,2)    NULL COMMENT 'NULL = không có dữ liệu (KHÔNG phải 0)',
    coverage           DECIMAL(4,3)    NULL,
    answer_confidence  DECIMAL(4,3)    NULL,
    merge_weight       DECIMAL(4,3)    NULL,
    data_quality       VARCHAR(15)     NOT NULL,
    needs_verification BOOLEAN         NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id),
    UNIQUE KEY uk_rc (result_id, competency_code),
    CONSTRAINT fk_rc_result FOREIGN KEY (result_id) REFERENCES assessment_results (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS assessment_consistency_flags (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    session_id   BIGINT UNSIGNED NOT NULL,
    rule_code    VARCHAR(30)     NOT NULL,
    severity     VARCHAR(10)     NOT NULL,
    affected_json JSON           NOT NULL,
    detail_json  JSON            NULL,
    PRIMARY KEY (id),
    KEY ix_cf_session (session_id),
    CONSTRAINT fk_cf_session FOREIGN KEY (session_id) REFERENCES assessment_sessions (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- Coach duyệt rule set theo phạm vi trước khi publish (I16).
CREATE TABLE IF NOT EXISTS rule_set_reviews (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    rule_set_id BIGINT          NOT NULL,
    reviewer_id BIGINT UNSIGNED NOT NULL,
    scope_type  VARCHAR(30)     NOT NULL COMMENT 'LADDER|WEIGHTS|LEVEL_REQUIREMENTS|STICKY_FLAGS|CLEARANCE_RULES|SAFETY_POLICIES|OTHER',
    decision    VARCHAR(20)     NOT NULL COMMENT 'APPROVED | CHANGES_REQUESTED',
    scope_json  JSON            NULL,
    notes       TEXT            NULL,
    reviewed_at DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY ix_rsr_ruleset (rule_set_id, scope_type),
    CONSTRAINT chk_rsr_decision CHECK (decision IN ('APPROVED', 'CHANGES_REQUESTED')),
    CONSTRAINT fk_rsr_reviewer FOREIGN KEY (reviewer_id) REFERENCES users (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------------------
-- B. BẢNG MỚI - MIỀN SAFETY (độc lập với năng lực & level)
-- -----------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS safety_constraint_defs (
    code        VARCHAR(40)  NOT NULL,
    kind        VARCHAR(30)  NOT NULL COMMENT 'EXERCISE_EXCLUDE|REGION_LIMIT|LOAD_CAP|RECOMMENDATION_PENALTY|ASSESSMENT_PARTICIPATION|ADVISORY',
    params_json JSON         NULL,
    message     TEXT         NULL,
    PRIMARY KEY (code),
    CONSTRAINT chk_scd_kind CHECK (kind IN ('EXERCISE_EXCLUDE', 'REGION_LIMIT', 'LOAD_CAP', 'RECOMMENDATION_PENALTY', 'ASSESSMENT_PARTICIPATION', 'ADVISORY'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- sticky nằm trong rule set (versioned): Coach phân loại -> Admin cấu hình -> publish. Không có API runtime sửa.
CREATE TABLE IF NOT EXISTS safety_flag_defs (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    rule_set_id BIGINT          NOT NULL,
    code        VARCHAR(40)     NOT NULL,
    description TEXT            NULL,
    sticky      BOOLEAN         NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id),
    UNIQUE KEY uk_flag (rule_set_id, code)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS safety_rules (
    id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    rule_set_id      BIGINT          NOT NULL,
    question_id      BIGINT UNSIGNED NOT NULL,
    condition_json   JSON            NOT NULL,
    flag_code        VARCHAR(40)     NOT NULL,
    severity         VARCHAR(10)     NOT NULL COMMENT 'REVIEW | RESTRICT',
    source_type      VARCHAR(30)     NOT NULL,
    source_reference VARCHAR(500)    NULL,
    PRIMARY KEY (id),
    KEY ix_sr_ruleset (rule_set_id),
    CONSTRAINT chk_sr_severity CHECK (severity IN ('REVIEW', 'RESTRICT')),
    CONSTRAINT fk_sr_question FOREIGN KEY (question_id) REFERENCES assessment_questions (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS safety_flag_constraints (
    rule_set_id     BIGINT      NOT NULL,
    flag_code       VARCHAR(40) NOT NULL,
    constraint_code VARCHAR(40) NOT NULL,
    PRIMARY KEY (rule_set_id, flag_code, constraint_code),
    CONSTRAINT fk_sfc_constraint FOREIGN KEY (constraint_code) REFERENCES safety_constraint_defs (code)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS safety_policies (
    id                          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    rule_set_id                 BIGINT          NOT NULL,
    status                      VARCHAR(20)     NOT NULL COMMENT 'CLEARED | REVIEW_REQUIRED | RESTRICTED',
    validity_days               INT             NOT NULL,
    require_acknowledgement_for JSON            NOT NULL,
    blocked_actions             JSON            NOT NULL COMMENT 'Mặc định []; chỉ chặn Initial Questionnaire nếu liệt kê INITIAL_QUESTIONNAIRE',
    requires_clearance_to_leave BOOLEAN         NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_sp (rule_set_id, status),
    CONSTRAINT chk_sp_status CHECK (status IN ('CLEARED', 'REVIEW_REQUIRED', 'RESTRICTED')),
    CONSTRAINT chk_sp_validity CHECK (validity_days > 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- Nguồn DUY NHẤT cho phép clearance đổi status. SELF_ATTESTED không có rule mặc định.
CREATE TABLE IF NOT EXISTS safety_clearance_rules (
    id                       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    rule_set_id              BIGINT          NOT NULL,
    from_status              VARCHAR(20)     NOT NULL,
    flag_scope_json          JSON            NOT NULL COMMENT '{"mode":"ALL_NON_STICKY"} | {"mode":"FLAGS","flags":[..]} | {"mode":"ALL"} (ALL chỉ cho COACH_VERIFIED)',
    method                   VARCHAR(20)     NOT NULL COMMENT 'SELF_ATTESTED | COACH_VERIFIED',
    resulting_status         VARCHAR(20)     NOT NULL,
    allow_retained_constraints BOOLEAN       NOT NULL DEFAULT TRUE,
    reviewer_role            VARCHAR(20)     NULL,
    attestation_text_version VARCHAR(20)     NULL,
    source_type              VARCHAR(30)     NOT NULL,
    source_reference         VARCHAR(500)    NULL,
    PRIMARY KEY (id),
    KEY ix_scr_ruleset (rule_set_id, from_status),
    CONSTRAINT chk_scr_from CHECK (from_status IN ('REVIEW_REQUIRED', 'RESTRICTED')),
    CONSTRAINT chk_scr_result CHECK (resulting_status IN ('CLEARED', 'REVIEW_REQUIRED')),
    CONSTRAINT chk_scr_method CHECK (method IN ('SELF_ATTESTED', 'COACH_VERIFIED')),
    CONSTRAINT chk_scr_role CHECK ((method = 'COACH_VERIFIED' AND reviewer_role IS NOT NULL)
                                OR (method = 'SELF_ATTESTED' AND reviewer_role IS NULL AND attestation_text_version IS NOT NULL))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- Append-only. clearance_id không có FK (vòng tham chiếu với safety_clearances).
CREATE TABLE IF NOT EXISTS user_safety_status (
    id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id           BIGINT UNSIGNED NOT NULL,
    session_id        BIGINT UNSIGNED NULL COMMENT 'Phiên SAFETY_SCREENING; NULL khi origin = CLEARANCE',
    origin            VARCHAR(25)     NOT NULL COMMENT 'SCREENING | RESCREEN_UNCHANGED | CLEARANCE',
    status            VARCHAR(20)     NOT NULL,
    clearance_method  VARCHAR(20)     NOT NULL DEFAULT 'NONE' COMMENT 'NONE | SELF_ATTESTED | COACH_VERIFIED',
    active_flags_json JSON            NOT NULL,
    constraints_json  JSON            NOT NULL,
    clearance_id      BIGINT UNSIGNED NULL,
    valid_until       DATETIME(6)     NOT NULL,
    is_current        BOOLEAN         NOT NULL DEFAULT TRUE,
    supersedes_id     BIGINT UNSIGNED NULL,
    rule_set_id       BIGINT          NOT NULL,
    created_at        DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY ix_uss (user_id, is_current),
    CONSTRAINT chk_uss_status CHECK (status IN ('CLEARED', 'REVIEW_REQUIRED', 'RESTRICTED')),
    CONSTRAINT chk_uss_origin CHECK (origin IN ('SCREENING', 'RESCREEN_UNCHANGED', 'CLEARANCE')),
    CONSTRAINT chk_uss_method CHECK (clearance_method IN ('NONE', 'SELF_ATTESTED', 'COACH_VERIFIED')),
    CONSTRAINT fk_uss_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_uss_session FOREIGN KEY (session_id) REFERENCES assessment_sessions (id) ON DELETE SET NULL,
    CONSTRAINT fk_uss_supersedes FOREIGN KEY (supersedes_id) REFERENCES user_safety_status (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS user_safety_flags (
    id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id          BIGINT UNSIGNED NOT NULL,
    flag_code        VARCHAR(40)     NOT NULL,
    event            VARCHAR(30)     NOT NULL COMMENT 'ACTIVATED | REAFFIRMED | DEACTIVATED_BY_RESCREEN | DEACTIVATED_BY_CLEARANCE',
    sticky           BOOLEAN         NOT NULL COMMENT 'Giá trị đã phân giải từ rule set tại thời điểm sự kiện',
    safety_status_id BIGINT UNSIGNED NOT NULL,
    clearance_id     BIGINT UNSIGNED NULL,
    rule_set_id      BIGINT          NOT NULL,
    created_at       DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY ix_usf (user_id, flag_code, created_at),
    CONSTRAINT chk_usf_event CHECK (event IN ('ACTIVATED', 'REAFFIRMED', 'DEACTIVATED_BY_RESCREEN', 'DEACTIVATED_BY_CLEARANCE')),
    CONSTRAINT fk_usf_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_usf_status FOREIGN KEY (safety_status_id) REFERENCES user_safety_status (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- Hành động/bằng chứng "đã đọc". KHÔNG phải clearance, KHÔNG đổi status.
CREATE TABLE IF NOT EXISTS safety_acknowledgements (
    id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id          BIGINT UNSIGNED NOT NULL,
    safety_status_id BIGINT UNSIGNED NOT NULL,
    advisory_version VARCHAR(20)     NOT NULL,
    acknowledged_at  DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_ack (safety_status_id, advisory_version),
    CONSTRAINT fk_ack_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_ack_status FOREIGN KEY (safety_status_id) REFERENCES user_safety_status (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS safety_clearances (
    id                        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id                   BIGINT UNSIGNED NOT NULL,
    safety_status_id          BIGINT UNSIGNED NOT NULL,
    method                    VARCHAR(20)     NOT NULL,
    status                    VARCHAR(20)     NOT NULL COMMENT 'REQUESTED|UNDER_REVIEW|GRANTED|REJECTED|CANCELLED',
    rule_id                   BIGINT UNSIGNED NULL COMMENT 'safety_clearance_rules.id đã khớp',
    decided_by_type           VARCHAR(15)     NULL COMMENT 'SYSTEM_RULE | REVIEWER',
    attestation_text_version  VARCHAR(20)     NULL,
    evidence_ref              VARCHAR(500)    NULL,
    requested_at              DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    reviewed_by               BIGINT UNSIGNED NULL,
    reviewed_at               DATETIME(6)     NULL,
    decision_note             TEXT            NULL,
    resulting_status          VARCHAR(20)     NULL,
    removed_flags_json        JSON            NULL,
    retained_constraints_json JSON            NULL,
    PRIMARY KEY (id),
    KEY ix_sc_user (user_id, status),
    CONSTRAINT chk_sc_method CHECK (method IN ('SELF_ATTESTED', 'COACH_VERIFIED')),
    CONSTRAINT chk_sc_status CHECK (status IN ('REQUESTED', 'UNDER_REVIEW', 'GRANTED', 'REJECTED', 'CANCELLED')),
    CONSTRAINT fk_sc_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_sc_status FOREIGN KEY (safety_status_id) REFERENCES user_safety_status (id),
    CONSTRAINT fk_sc_rule FOREIGN KEY (rule_id) REFERENCES safety_clearance_rules (id),
    CONSTRAINT fk_sc_reviewer FOREIGN KEY (reviewed_by) REFERENCES users (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------------------
-- C. MỞ RỘNG BẢNG HIỆN CÓ (ADD COLUMN, giá trị mặc định KHÔNG làm đổi hành vi v1)
-- -----------------------------------------------------------------------------------------

ALTER TABLE assessment_types
    ADD COLUMN execution_mode VARCHAR(20) NOT NULL DEFAULT 'QUESTIONNAIRE' COMMENT 'QUESTIONNAIRE | PRACTICAL',
    ADD COLUMN scored         BOOLEAN     NOT NULL DEFAULT TRUE COMMENT 'SAFETY_SCREENING = FALSE';

ALTER TABLE assessment_templates
    ADD COLUMN purpose VARCHAR(20) NOT NULL DEFAULT 'STANDARD' COMMENT 'STANDARD | BASELINE';

-- evidence_role mặc định UNCLASSIFIED (KHÔNG chấm điểm): câu cũ chưa phân loại không tự thành bằng chứng chấm điểm.
ALTER TABLE assessment_questions
    ADD COLUMN evidence_role     VARCHAR(30)   NOT NULL DEFAULT 'UNCLASSIFIED',
    ADD COLUMN item_kind         VARCHAR(20)   NOT NULL DEFAULT 'QUESTION' COMMENT 'QUESTION | PRACTICAL_TEST',
    ADD COLUMN answer_kind       VARCHAR(20)   NULL COMMENT 'LADDER_NODE|LADDER_VALUE|RANGE_OPTION|CATEGORICAL|BOOLEAN|CONTEXT_ENUM|NUMERIC|SKILL_STATE',
    ADD COLUMN reliability_class VARCHAR(10)   NULL COMMENT 'HIGH | MEDIUM | LOW',
    ADD COLUMN plausible_max     DECIMAL(10,2) NULL,
    ADD COLUMN ladder_id         BIGINT UNSIGNED NULL,
    ADD CONSTRAINT chk_aq_role CHECK (evidence_role IN ('UNCLASSIFIED', 'PERFORMANCE_LADDER', 'PERFORMANCE_SUPPORT', 'SELF_RATING_CHOICE', 'QUALITY_MEASURED',
        'CONTEXT_EXPERIENCE', 'RELIABILITY_MODIFIER', 'PROFILE', 'GOAL', 'CONSTRAINT', 'SAFETY')),
    ADD CONSTRAINT chk_aq_kind CHECK (item_kind IN ('QUESTION', 'PRACTICAL_TEST')),
    ADD CONSTRAINT fk_aq_ladder FOREIGN KEY (ladder_id) REFERENCES progression_ladders (id);

ALTER TABLE assessment_template_questions
    ADD COLUMN section_id      BIGINT UNSIGNED NULL,
    ADD COLUMN visibility_json JSON NULL COMMENT 'Hiển thị có điều kiện / áp dụng theo level; câu ẩn KHÔNG vào mẫu số',
    ADD CONSTRAINT fk_atq_section FOREIGN KEY (section_id) REFERENCES assessment_sections (id) ON DELETE SET NULL;

ALTER TABLE assessment_score_rules
    ADD COLUMN answer_kind          VARCHAR(20)   NULL,
    ADD COLUMN representative_value DECIMAL(10,2) NULL COMMENT 'Mặc định = cận dưới của khoảng',
    ADD COLUMN stage_id             BIGINT UNSIGNED NULL,
    ADD CONSTRAINT fk_asr_stage FOREIGN KEY (stage_id) REFERENCES progression_stages (id);

-- Đáp án gốc nằm ở assessment_responses.answer_json (đã có); thêm giá trị đã chuẩn hoá + độ tin cậy.
ALTER TABLE assessment_responses
    ADD COLUMN representative_value DECIMAL(10,2) NULL,
    ADD COLUMN normalized_score     DECIMAL(5,2)  NULL COMMENT 'NULL cho CONTEXT/PROFILE/GOAL/CONSTRAINT/SAFETY và cho NOT_TRIED',
    ADD COLUMN reliability          DECIMAL(4,3)  NULL,
    ADD COLUMN evidence_role        VARCHAR(30)   NOT NULL DEFAULT 'UNCLASSIFIED' COMMENT 'Bản sao bất biến tại thời điểm trả lời';

-- Trạng thái phiên: thêm PROCESSING, SUPERSEDED (giữ nguyên các giá trị cũ).
ALTER TABLE assessment_sessions DROP CHECK chk_assessment_sessions_status;
ALTER TABLE assessment_sessions
    ADD CONSTRAINT chk_assessment_sessions_status
        CHECK (status IN ('IN_PROGRESS', 'PROCESSING', 'COMPLETED', 'ABANDONED', 'EXPIRED', 'SKIPPED', 'SUPERSEDED'));
-- (assessment_sessions.rule_set_id, data_quality_status, confidence đã có từ Level Engine v1 - không thêm lại)
ALTER TABLE assessment_sessions
    ADD COLUMN execution_mode        VARCHAR(20)     NOT NULL DEFAULT 'QUESTIONNAIRE',
    ADD COLUMN current_step          INT             NULL,
    ADD COLUMN supersedes_session_id BIGINT UNSIGNED NULL,
    ADD COLUMN expires_at            DATETIME(6)     NULL,
    ADD COLUMN algorithm_version     VARCHAR(40)     NULL,
    ADD CONSTRAINT fk_as_supersedes FOREIGN KEY (supersedes_session_id) REFERENCES assessment_sessions (id) ON DELETE SET NULL;

-- Bảng Hibernate: nới độ rộng cột gate để chứa INSUFFICIENT_EVIDENCE / NOT_EVALUATED / PASS_SELF_REPORTED (I19).
ALTER TABLE level_evaluations
    MODIFY reliability_gate  VARCHAR(30) NULL,
    MODIFY performance_gate  VARCHAR(30) NULL,
    MODIFY quality_gate      VARCHAR(30) NULL,
    MODIFY competency_gate   VARCHAR(30) NULL,
    MODIFY skill_gate        VARCHAR(30) NULL,
    MODIFY stability_gate    VARCHAR(30) NULL,
    ADD COLUMN gated_level         VARCHAR(10) NULL,
    ADD COLUMN adjusted_level      VARCHAR(10) NULL,
    ADD COLUMN level_cap           VARCHAR(10) NULL,
    ADD COLUMN cap_applied         BOOLEAN     NULL,
    ADD COLUMN level_status        VARCHAR(20) NULL COMMENT 'UNASSESSED|PROVISIONAL|VERIFIED|RETURNING (NULL = bản ghi v1)',
    ADD COLUMN verification_status VARCHAR(20) NULL COMMENT 'NOT_VERIFIED|MEASURED_VERIFIED|COACH_VERIFIED',
    ADD COLUMN source              VARCHAR(20) NULL,
    ADD COLUMN basis               VARCHAR(25) NULL COMMENT 'STANDARD | BASELINE_VERIFICATION',
    ADD COLUMN retest_reason_code  VARCHAR(40) NULL;
-- CHECK cho level_evaluations cố ý không thêm: bảng Hibernate, giá trị v1 cũ có thể không thuộc tập V2.

ALTER TABLE user_level_state
    ADD COLUMN verification_status  VARCHAR(20) NULL,
    ADD COLUMN cap_applied          BOOLEAN     NULL,
    ADD COLUMN source               VARCHAR(20) NULL,
    ADD COLUMN last_verified_at     DATETIME(6) NULL,
    ADD COLUMN fast_track_consumed  BOOLEAN     NOT NULL DEFAULT FALSE COMMENT 'Chỉ chuyển false->true khi Baseline đầu tiên có Reliability PASS';

ALTER TABLE user_skill_progress
    ADD COLUMN stage_id            BIGINT UNSIGNED NULL,
    ADD COLUMN origin              VARCHAR(10)     NOT NULL DEFAULT 'DIRECT' COMMENT 'DIRECT | INFERRED',
    ADD COLUMN verification_status VARCHAR(20)     NULL,
    ADD CONSTRAINT fk_usp_stage FOREIGN KEY (stage_id) REFERENCES progression_stages (id);

ALTER TABLE level_requirements
    ADD COLUMN self_reported_acceptable BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Dòng SKILL: cho phép ACHIEVED_SELF_REPORTED tính cho candidate (Initial)';

-- param_text cho tham số dạng chữ (vd. baseline.attempt_aggregation = MIN); param_value cho phép NULL khi dùng param_text.
ALTER TABLE engine_parameters
    MODIFY param_value DECIMAL(12,4) NULL,
    ADD COLUMN param_text VARCHAR(100) NULL;

ALTER TABLE workout_plans
    ADD COLUMN safety_status_id         BIGINT UNSIGNED NULL,
    ADD COLUMN applied_constraints_json JSON NULL COMMENT 'Ràng buộc safety đã áp khi sinh Cycle (audit)',
    ADD CONSTRAINT fk_wp_safety_status FOREIGN KEY (safety_status_id) REFERENCES user_safety_status (id) ON DELETE SET NULL;
