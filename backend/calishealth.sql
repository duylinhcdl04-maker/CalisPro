-- ============================================================
-- CalisHealth Database
-- MySQL 8.0+
-- Purpose: production-oriented transactional schema for
--          CalisHealth (assessment -> recommendation -> workout ->
--          performance -> progress -> AI movement analysis)
-- ============================================================

CREATE DATABASE IF NOT EXISTS calishealth
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE calishealth;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS form_analysis;
DROP TABLE IF EXISTS movement_events;
DROP TABLE IF EXISTS movement_metrics;
DROP TABLE IF EXISTS movement_sessions;
DROP TABLE IF EXISTS personal_records;
DROP TABLE IF EXISTS progress_metrics;
DROP TABLE IF EXISTS exercise_sets;
DROP TABLE IF EXISTS workout_session_exercises;
DROP TABLE IF EXISTS workout_sessions;
DROP TABLE IF EXISTS workout_plan_exercises;
DROP TABLE IF EXISTS workout_plan_days;
DROP TABLE IF EXISTS workout_plans;
DROP TABLE IF EXISTS recommendations;
DROP TABLE IF EXISTS recommendation_runs;
DROP TABLE IF EXISTS exercise_restrictions;
DROP TABLE IF EXISTS exercise_progressions;
DROP TABLE IF EXISTS exercise_muscles;
DROP TABLE IF EXISTS muscles;
DROP TABLE IF EXISTS exercises;
DROP TABLE IF EXISTS exercise_categories;
DROP TABLE IF EXISTS fitness_profiles;
DROP TABLE IF EXISTS assessment_scores;
DROP TABLE IF EXISTS assessment_responses;
DROP TABLE IF EXISTS assessment_sessions;
DROP TABLE IF EXISTS assessment_question_options;
DROP TABLE IF EXISTS assessment_questions;
DROP TABLE IF EXISTS assessment_types;
DROP TABLE IF EXISTS body_measurements;
DROP TABLE IF EXISTS daily_checkins;
DROP TABLE IF EXISTS user_goals;
DROP TABLE IF EXISTS goals;
DROP TABLE IF EXISTS user_consents;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS email_verifications;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 1. IDENTITY
-- ============================================================

CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    role VARCHAR(30) NOT NULL DEFAULT 'USER',
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,

    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT chk_users_status CHECK (status IN ('ACTIVE','INACTIVE','SUSPENDED','DELETED')),
    CONSTRAINT chk_users_role CHECK (role IN ('USER','ADMIN','COACH')),

    INDEX idx_users_status (status),
    INDEX idx_users_created_at (created_at)
) ENGINE=InnoDB;

CREATE TABLE user_profiles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    first_name VARCHAR(100) NULL,
    last_name VARCHAR(100) NULL,
    date_of_birth DATE NULL,
    gender VARCHAR(30) NULL,
    height_cm DECIMAL(5,2) NULL,
    weight_kg DECIMAL(6,2) NULL,
    timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    avatar_url VARCHAR(500) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT uq_user_profiles_user UNIQUE (user_id),
    CONSTRAINT fk_user_profiles_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT chk_user_profiles_height CHECK (height_cm IS NULL OR height_cm > 0),
    CONSTRAINT chk_user_profiles_weight CHECK (weight_kg IS NULL OR weight_kg > 0)
) ENGINE=InnoDB;

CREATE TABLE user_sessions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    refresh_token_hash VARCHAR(255) NOT NULL,
    device_name VARCHAR(255) NULL,
    device_type VARCHAR(50) NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    expires_at DATETIME(6) NOT NULL,
    revoked_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT uq_user_sessions_token UNIQUE (refresh_token_hash),
    CONSTRAINT fk_user_sessions_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    INDEX idx_user_sessions_user (user_id),
    INDEX idx_user_sessions_expires (expires_at)
) ENGINE=InnoDB;

CREATE TABLE email_verifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'REGISTER',
    expires_at DATETIME(6) NOT NULL,
    verified_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    INDEX idx_email_verifications_email (email),
    INDEX idx_email_verifications_expires (expires_at)
) ENGINE=InnoDB;

CREATE TABLE user_consents (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    consent_type VARCHAR(50) NOT NULL,
    version VARCHAR(20) NOT NULL,
    accepted BOOLEAN NOT NULL,
    accepted_at DATETIME(6) NULL,
    revoked_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_user_consents_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    INDEX idx_user_consents_user_type (user_id, consent_type),
    INDEX idx_user_consents_created_at (created_at)
) ENGINE=InnoDB;

-- ============================================================
-- 2. GOALS
-- ============================================================

CREATE TABLE goals (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    category VARCHAR(50) NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT uq_goals_code UNIQUE (code),
    INDEX idx_goals_active (active)
) ENGINE=InnoDB;

CREATE TABLE user_goals (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    goal_id BIGINT UNSIGNED NOT NULL,
    priority INT NOT NULL DEFAULT 1,
    target_value DECIMAL(10,2) NULL,
    target_unit VARCHAR(30) NULL,
    start_date DATE NULL,
    target_date DATE NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_user_goals_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_user_goals_goal
        FOREIGN KEY (goal_id) REFERENCES goals(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT chk_user_goals_priority CHECK (priority > 0),
    CONSTRAINT chk_user_goals_status CHECK (status IN ('ACTIVE','COMPLETED','PAUSED','CANCELLED')),

    UNIQUE KEY uq_user_goal (user_id, goal_id),
    INDEX idx_user_goals_user_priority (user_id, priority)
) ENGINE=InnoDB;

-- ============================================================
-- 3. ASSESSMENT
-- ============================================================

CREATE TABLE assessment_types (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    version VARCHAR(20) NOT NULL DEFAULT '1.0',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT uq_assessment_types_code UNIQUE (code),
    INDEX idx_assessment_types_active (active)
) ENGINE=InnoDB;

CREATE TABLE assessment_questions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    question_code VARCHAR(100) NOT NULL,
    question_text TEXT NOT NULL,
    question_type VARCHAR(30) NOT NULL,
    category VARCHAR(50) NULL,
    unit VARCHAR(30) NULL,
    required BOOLEAN NOT NULL DEFAULT TRUE,
    min_value DECIMAL(10,2) NULL,
    max_value DECIMAL(10,2) NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT uq_assessment_questions_code UNIQUE (question_code),
    CONSTRAINT chk_assessment_question_type
        CHECK (question_type IN ('TEXT','NUMBER','BOOLEAN','SINGLE_CHOICE','MULTI_CHOICE','DATE','SCALE','JSON')),
    CONSTRAINT chk_assessment_question_range
        CHECK (min_value IS NULL OR max_value IS NULL OR min_value <= max_value),

    INDEX idx_assessment_questions_category (category),
    INDEX idx_assessment_questions_active (active)
) ENGINE=InnoDB;

CREATE TABLE assessment_question_options (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    question_id BIGINT UNSIGNED NOT NULL,
    option_code VARCHAR(50) NOT NULL,
    option_label VARCHAR(255) NOT NULL,
    numeric_value DECIMAL(10,2) NULL,
    sort_order INT NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_question_options_question
        FOREIGN KEY (question_id) REFERENCES assessment_questions(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    UNIQUE KEY uq_question_option_code (question_id, option_code),
    INDEX idx_question_options_order (question_id, sort_order)
) ENGINE=InnoDB;

CREATE TABLE assessment_sessions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    assessment_type_id BIGINT UNSIGNED NOT NULL,
    started_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    completed_at DATETIME(6) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS',
    version VARCHAR(20) NOT NULL DEFAULT '1.0',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_assessment_sessions_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_assessment_sessions_type
        FOREIGN KEY (assessment_type_id) REFERENCES assessment_types(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT chk_assessment_sessions_status
        CHECK (status IN ('IN_PROGRESS','COMPLETED','ABANDONED','EXPIRED')),

    INDEX idx_assessment_sessions_user (user_id),
    INDEX idx_assessment_sessions_user_status (user_id, status),
    INDEX idx_assessment_sessions_started (started_at)
) ENGINE=InnoDB;

CREATE TABLE assessment_responses (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    assessment_session_id BIGINT UNSIGNED NOT NULL,
    question_id BIGINT UNSIGNED NOT NULL,
    option_id BIGINT UNSIGNED NULL,
    answer_text TEXT NULL,
    answer_number DECIMAL(10,2) NULL,
    answer_boolean BOOLEAN NULL,
    answer_json JSON NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_assessment_responses_session
        FOREIGN KEY (assessment_session_id) REFERENCES assessment_sessions(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_assessment_responses_question
        FOREIGN KEY (question_id) REFERENCES assessment_questions(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_assessment_responses_option
        FOREIGN KEY (option_id) REFERENCES assessment_question_options(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    UNIQUE KEY uq_assessment_response (assessment_session_id, question_id),
    INDEX idx_assessment_responses_question (question_id)
) ENGINE=InnoDB;

CREATE TABLE assessment_scores (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    assessment_session_id BIGINT UNSIGNED NOT NULL,
    score_type VARCHAR(50) NOT NULL,
    score DECIMAL(8,2) NOT NULL,
    level VARCHAR(30) NULL,
    metadata JSON NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_assessment_scores_session
        FOREIGN KEY (assessment_session_id) REFERENCES assessment_sessions(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    INDEX idx_assessment_scores_session (assessment_session_id),
    INDEX idx_assessment_scores_type (score_type)
) ENGINE=InnoDB;

CREATE TABLE fitness_profiles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    assessment_session_id BIGINT UNSIGNED NOT NULL,
    fitness_level VARCHAR(30) NOT NULL,
    strength_score DECIMAL(8,2) NULL,
    endurance_score DECIMAL(8,2) NULL,
    mobility_score DECIMAL(8,2) NULL,
    balance_score DECIMAL(8,2) NULL,
    core_score DECIMAL(8,2) NULL,
    overall_score DECIMAL(8,2) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_fitness_profiles_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_fitness_profiles_assessment
        FOREIGN KEY (assessment_session_id) REFERENCES assessment_sessions(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    UNIQUE KEY uq_fitness_profile_assessment (assessment_session_id),
    INDEX idx_fitness_profiles_user_date (user_id, created_at)
) ENGINE=InnoDB;

-- ============================================================
-- 4. EXERCISE LIBRARY
-- ============================================================

CREATE TABLE exercise_categories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT uq_exercise_categories_code UNIQUE (code)
) ENGINE=InnoDB;

CREATE TABLE muscles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    body_region VARCHAR(50) NULL,

    CONSTRAINT uq_muscles_code UNIQUE (code)
) ENGINE=InnoDB;

CREATE TABLE exercises (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id BIGINT UNSIGNED NOT NULL,
    code VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    difficulty_level VARCHAR(30) NULL,
    movement_pattern VARCHAR(50) NULL,
    equipment_required BOOLEAN NOT NULL DEFAULT FALSE,
    instructions TEXT NULL,
    safety_notes TEXT NULL,
    video_url VARCHAR(500) NULL,
    thumbnail_url VARCHAR(500) NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT uq_exercises_code UNIQUE (code),
    CONSTRAINT fk_exercises_category
        FOREIGN KEY (category_id) REFERENCES exercise_categories(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    INDEX idx_exercises_category (category_id),
    INDEX idx_exercises_difficulty (difficulty_level),
    INDEX idx_exercises_active (active)
) ENGINE=InnoDB;

CREATE TABLE exercise_muscles (
    exercise_id BIGINT UNSIGNED NOT NULL,
    muscle_id BIGINT UNSIGNED NOT NULL,
    role VARCHAR(30) NOT NULL,
    activation_percent DECIMAL(5,2) NULL,

    PRIMARY KEY (exercise_id, muscle_id),
    CONSTRAINT fk_exercise_muscles_exercise
        FOREIGN KEY (exercise_id) REFERENCES exercises(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_exercise_muscles_muscle
        FOREIGN KEY (muscle_id) REFERENCES muscles(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT chk_exercise_muscles_role CHECK (role IN ('PRIMARY','SECONDARY')),
    CONSTRAINT chk_exercise_muscles_activation
        CHECK (activation_percent IS NULL OR (activation_percent >= 0 AND activation_percent <= 100))
) ENGINE=InnoDB;

CREATE TABLE exercise_progressions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    exercise_id BIGINT UNSIGNED NOT NULL,
    prerequisite_exercise_id BIGINT UNSIGNED NOT NULL,
    progression_type VARCHAR(30) NOT NULL,
    required_score DECIMAL(8,2) NULL,
    min_reps INT NULL,
    notes TEXT NULL,

    CONSTRAINT fk_progression_exercise
        FOREIGN KEY (exercise_id) REFERENCES exercises(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_progression_prerequisite
        FOREIGN KEY (prerequisite_exercise_id) REFERENCES exercises(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT chk_progression_type
        CHECK (progression_type IN ('NEXT','REGRESSION','ALTERNATIVE')),
    CONSTRAINT chk_progression_reps CHECK (min_reps IS NULL OR min_reps >= 0),

    UNIQUE KEY uq_exercise_progression (exercise_id, prerequisite_exercise_id, progression_type)
) ENGINE=InnoDB;

CREATE TABLE exercise_restrictions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    exercise_id BIGINT UNSIGNED NOT NULL,
    restriction_code VARCHAR(100) NOT NULL,
    severity VARCHAR(30) NOT NULL DEFAULT 'CAUTION',
    description TEXT NULL,

    CONSTRAINT fk_exercise_restrictions_exercise
        FOREIGN KEY (exercise_id) REFERENCES exercises(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT chk_restriction_severity
        CHECK (severity IN ('INFO','CAUTION','WARNING','AVOID')),

    UNIQUE KEY uq_exercise_restriction (exercise_id, restriction_code)
) ENGINE=InnoDB;

-- ============================================================
-- 5. RECOMMENDATION
-- ============================================================

CREATE TABLE recommendation_runs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    assessment_session_id BIGINT UNSIGNED NULL,
    algorithm_version VARCHAR(50) NOT NULL,
    input_snapshot JSON NULL,
    output_snapshot JSON NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_recommendation_runs_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_recommendation_runs_assessment
        FOREIGN KEY (assessment_session_id) REFERENCES assessment_sessions(id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    INDEX idx_recommendation_runs_user_date (user_id, created_at),
    INDEX idx_recommendation_runs_algorithm (algorithm_version)
) ENGINE=InnoDB;

CREATE TABLE recommendations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    recommendation_run_id BIGINT UNSIGNED NOT NULL,
    recommendation_type VARCHAR(50) NOT NULL,
    target_id BIGINT UNSIGNED NULL,
    priority INT NOT NULL DEFAULT 1,
    confidence_score DECIMAL(5,2) NULL,
    reason TEXT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_recommendations_run
        FOREIGN KEY (recommendation_run_id) REFERENCES recommendation_runs(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    INDEX idx_recommendations_run_priority (recommendation_run_id, priority),
    INDEX idx_recommendations_type (recommendation_type)
) ENGINE=InnoDB;

-- ============================================================
-- 6. WORKOUT PLANNING
-- ============================================================

CREATE TABLE workout_plans (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    recommendation_run_id BIGINT UNSIGNED NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    goal_id BIGINT UNSIGNED NULL,
    difficulty_level VARCHAR(30) NULL,
    duration_weeks INT NULL,
    days_per_week INT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    start_date DATE NULL,
    end_date DATE NULL,
    version INT NOT NULL DEFAULT 1,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_workout_plans_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_workout_plans_recommendation
        FOREIGN KEY (recommendation_run_id) REFERENCES recommendation_runs(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_workout_plans_goal
        FOREIGN KEY (goal_id) REFERENCES goals(id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT chk_workout_plan_status
        CHECK (status IN ('DRAFT','ACTIVE','COMPLETED','ARCHIVED','CANCELLED')),
    CONSTRAINT chk_workout_plan_duration CHECK (duration_weeks IS NULL OR duration_weeks > 0),
    CONSTRAINT chk_workout_plan_days CHECK (days_per_week IS NULL OR (days_per_week >= 1 AND days_per_week <= 7)),

    INDEX idx_workout_plans_user_status (user_id, status),
    INDEX idx_workout_plans_dates (start_date, end_date)
) ENGINE=InnoDB;

CREATE TABLE workout_plan_days (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    workout_plan_id BIGINT UNSIGNED NOT NULL,
    day_number INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    focus VARCHAR(100) NULL,
    estimated_duration_min INT NULL,
    rest_day BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_workout_plan_days_plan
        FOREIGN KEY (workout_plan_id) REFERENCES workout_plans(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT chk_workout_plan_day_number CHECK (day_number > 0),
    CONSTRAINT chk_workout_plan_day_duration
        CHECK (estimated_duration_min IS NULL OR estimated_duration_min >= 0),

    UNIQUE KEY uq_workout_plan_day (workout_plan_id, day_number)
) ENGINE=InnoDB;

CREATE TABLE workout_plan_exercises (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    workout_plan_day_id BIGINT UNSIGNED NOT NULL,
    exercise_id BIGINT UNSIGNED NOT NULL,
    sequence_no INT NOT NULL,
    sets INT NULL,
    target_reps_min INT NULL,
    target_reps_max INT NULL,
    target_duration_sec INT NULL,
    rest_seconds INT NULL,
    target_rpe DECIMAL(3,1) NULL,
    tempo VARCHAR(30) NULL,
    notes TEXT NULL,

    CONSTRAINT fk_plan_exercises_day
        FOREIGN KEY (workout_plan_day_id) REFERENCES workout_plan_days(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_plan_exercises_exercise
        FOREIGN KEY (exercise_id) REFERENCES exercises(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT chk_plan_exercise_sequence CHECK (sequence_no > 0),
    CONSTRAINT chk_plan_exercise_sets CHECK (sets IS NULL OR sets > 0),
    CONSTRAINT chk_plan_exercise_reps
        CHECK (
            (target_reps_min IS NULL OR target_reps_min >= 0)
            AND
            (target_reps_max IS NULL OR target_reps_max >= 0)
            AND
            (target_reps_min IS NULL OR target_reps_max IS NULL OR target_reps_min <= target_reps_max)
        ),
    CONSTRAINT chk_plan_exercise_rest CHECK (rest_seconds IS NULL OR rest_seconds >= 0),
    CONSTRAINT chk_plan_exercise_rpe CHECK (target_rpe IS NULL OR (target_rpe >= 0 AND target_rpe <= 10)),

    UNIQUE KEY uq_plan_day_sequence (workout_plan_day_id, sequence_no),
    INDEX idx_plan_exercises_exercise (exercise_id)
) ENGINE=InnoDB;

-- ============================================================
-- 7. WORKOUT EXECUTION / PERFORMANCE
-- ============================================================

CREATE TABLE workout_sessions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    workout_plan_id BIGINT UNSIGNED NULL,
    workout_plan_day_id BIGINT UNSIGNED NULL,
    started_at DATETIME(6) NOT NULL,
    completed_at DATETIME(6) NULL,
    duration_seconds INT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS',
    energy_level INT NULL,
    difficulty_rating INT NULL,
    notes TEXT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_workout_sessions_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_workout_sessions_plan
        FOREIGN KEY (workout_plan_id) REFERENCES workout_plans(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_workout_sessions_plan_day
        FOREIGN KEY (workout_plan_day_id) REFERENCES workout_plan_days(id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT chk_workout_session_status
        CHECK (status IN ('IN_PROGRESS','COMPLETED','ABANDONED','SKIPPED')),
    CONSTRAINT chk_workout_session_duration
        CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
    CONSTRAINT chk_workout_session_energy
        CHECK (energy_level IS NULL OR (energy_level BETWEEN 1 AND 10)),
    CONSTRAINT chk_workout_session_difficulty
        CHECK (difficulty_rating IS NULL OR (difficulty_rating BETWEEN 1 AND 10)),

    INDEX idx_workout_sessions_user_date (user_id, started_at),
    INDEX idx_workout_sessions_status (status)
) ENGINE=InnoDB;

CREATE TABLE workout_session_exercises (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    workout_session_id BIGINT UNSIGNED NOT NULL,
    exercise_id BIGINT UNSIGNED NOT NULL,
    planned_sets INT NULL,
    completed_sets INT NOT NULL DEFAULT 0,
    sequence_no INT NOT NULL,
    started_at DATETIME(6) NULL,
    completed_at DATETIME(6) NULL,

    CONSTRAINT fk_session_exercises_session
        FOREIGN KEY (workout_session_id) REFERENCES workout_sessions(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_session_exercises_exercise
        FOREIGN KEY (exercise_id) REFERENCES exercises(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT chk_session_exercise_sequence CHECK (sequence_no > 0),
    CONSTRAINT chk_session_exercise_sets
        CHECK (completed_sets >= 0 AND (planned_sets IS NULL OR planned_sets >= 0)),

    UNIQUE KEY uq_session_exercise_sequence (workout_session_id, sequence_no),
    INDEX idx_session_exercises_exercise (exercise_id)
) ENGINE=InnoDB;

CREATE TABLE exercise_sets (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    workout_session_exercise_id BIGINT UNSIGNED NOT NULL,
    set_number INT NOT NULL,
    reps INT NULL,
    duration_seconds INT NULL,
    weight_kg DECIMAL(7,2) NULL,
    assistance_kg DECIMAL(7,2) NULL,
    rpe DECIMAL(3,1) NULL,
    rest_seconds INT NULL,
    completed BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_exercise_sets_session_exercise
        FOREIGN KEY (workout_session_exercise_id) REFERENCES workout_session_exercises(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT chk_exercise_set_number CHECK (set_number > 0),
    CONSTRAINT chk_exercise_set_reps CHECK (reps IS NULL OR reps >= 0),
    CONSTRAINT chk_exercise_set_duration CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
    CONSTRAINT chk_exercise_set_weight CHECK (weight_kg IS NULL OR weight_kg >= 0),
    CONSTRAINT chk_exercise_set_assistance CHECK (assistance_kg IS NULL OR assistance_kg >= 0),
    CONSTRAINT chk_exercise_set_rpe CHECK (rpe IS NULL OR (rpe >= 0 AND rpe <= 10)),
    CONSTRAINT chk_exercise_set_rest CHECK (rest_seconds IS NULL OR rest_seconds >= 0),

    UNIQUE KEY uq_exercise_set_number (workout_session_exercise_id, set_number),
    INDEX idx_exercise_sets_created (created_at)
) ENGINE=InnoDB;

-- ============================================================
-- 8. AI / COMPUTER VISION
-- ============================================================

CREATE TABLE movement_sessions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    workout_session_id BIGINT UNSIGNED NOT NULL,
    exercise_id BIGINT UNSIGNED NOT NULL,
    video_url VARCHAR(1000) NULL,
    started_at DATETIME(6) NULL,
    ended_at DATETIME(6) NULL,
    frame_rate DECIMAL(7,3) NULL,
    model_name VARCHAR(100) NULL,
    model_version VARCHAR(50) NULL,
    processing_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_movement_sessions_workout
        FOREIGN KEY (workout_session_id) REFERENCES workout_sessions(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_movement_sessions_exercise
        FOREIGN KEY (exercise_id) REFERENCES exercises(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT chk_movement_processing_status
        CHECK (processing_status IN ('PENDING','PROCESSING','COMPLETED','FAILED')),

    INDEX idx_movement_sessions_workout (workout_session_id),
    INDEX idx_movement_sessions_status (processing_status)
) ENGINE=InnoDB;

CREATE TABLE movement_metrics (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    movement_session_id BIGINT UNSIGNED NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    metric_value DECIMAL(12,4) NOT NULL,
    unit VARCHAR(30) NULL,
    confidence DECIMAL(5,4) NULL,
    timestamp_ms BIGINT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_movement_metrics_session
        FOREIGN KEY (movement_session_id) REFERENCES movement_sessions(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT chk_movement_metric_confidence
        CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),

    INDEX idx_movement_metrics_session_time (movement_session_id, timestamp_ms),
    INDEX idx_movement_metrics_type (metric_type)
) ENGINE=InnoDB;

CREATE TABLE movement_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    movement_session_id BIGINT UNSIGNED NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    rep_number INT NULL,
    start_timestamp_ms BIGINT NULL,
    end_timestamp_ms BIGINT NULL,
    duration_ms BIGINT NULL,
    score DECIMAL(5,2) NULL,
    metadata JSON NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_movement_events_session
        FOREIGN KEY (movement_session_id) REFERENCES movement_sessions(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT chk_movement_event_rep CHECK (rep_number IS NULL OR rep_number > 0),

    INDEX idx_movement_events_session_rep (movement_session_id, rep_number),
    INDEX idx_movement_events_type (event_type)
) ENGINE=InnoDB;

CREATE TABLE form_analysis (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    movement_session_id BIGINT UNSIGNED NOT NULL,
    overall_score DECIMAL(5,2) NULL,
    stability_score DECIMAL(5,2) NULL,
    range_of_motion DECIMAL(5,2) NULL,
    alignment_score DECIMAL(5,2) NULL,
    tempo_score DECIMAL(5,2) NULL,
    analysis_version VARCHAR(50) NOT NULL,
    feedback TEXT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_form_analysis_movement_session
        FOREIGN KEY (movement_session_id) REFERENCES movement_sessions(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT chk_form_score_1 CHECK (overall_score IS NULL OR (overall_score >= 0 AND overall_score <= 100)),
    CONSTRAINT chk_form_score_2 CHECK (stability_score IS NULL OR (stability_score >= 0 AND stability_score <= 100)),
    CONSTRAINT chk_form_score_3 CHECK (range_of_motion IS NULL OR (range_of_motion >= 0 AND range_of_motion <= 100)),
    CONSTRAINT chk_form_score_4 CHECK (alignment_score IS NULL OR (alignment_score >= 0 AND alignment_score <= 100)),
    CONSTRAINT chk_form_score_5 CHECK (tempo_score IS NULL OR (tempo_score >= 0 AND tempo_score <= 100)),

    INDEX idx_form_analysis_session (movement_session_id)
) ENGINE=InnoDB;

-- ============================================================
-- 9. PROGRESS
-- ============================================================

CREATE TABLE progress_metrics (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    metric_value DECIMAL(12,4) NOT NULL,
    unit VARCHAR(30) NOT NULL,
    recorded_at DATETIME(6) NOT NULL,
    source_type VARCHAR(50) NULL,
    source_id BIGINT UNSIGNED NULL,

    CONSTRAINT fk_progress_metrics_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    INDEX idx_progress_metrics_user_type_date (user_id, metric_type, recorded_at)
) ENGINE=InnoDB;

CREATE TABLE personal_records (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    exercise_id BIGINT UNSIGNED NOT NULL,
    record_type VARCHAR(50) NOT NULL,
    record_value DECIMAL(12,4) NOT NULL,
    unit VARCHAR(30) NOT NULL,
    achieved_at DATETIME(6) NOT NULL,
    source_session_id BIGINT UNSIGNED NULL,

    CONSTRAINT fk_personal_records_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_personal_records_exercise
        FOREIGN KEY (exercise_id) REFERENCES exercises(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_personal_records_session
        FOREIGN KEY (source_session_id) REFERENCES workout_sessions(id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    INDEX idx_personal_records_user_exercise (user_id, exercise_id, record_type),
    INDEX idx_personal_records_achieved (achieved_at)
) ENGINE=InnoDB;

CREATE TABLE daily_checkins (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    checkin_date DATE NOT NULL,
    sleep_hours DECIMAL(4,2) NULL,
    energy_level INT NULL,
    stress_level INT NULL,
    muscle_soreness INT NULL,
    motivation_level INT NULL,
    notes TEXT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_daily_checkins_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT chk_daily_sleep CHECK (sleep_hours IS NULL OR sleep_hours >= 0),
    CONSTRAINT chk_daily_energy CHECK (energy_level IS NULL OR energy_level BETWEEN 1 AND 10),
    CONSTRAINT chk_daily_stress CHECK (stress_level IS NULL OR stress_level BETWEEN 1 AND 10),
    CONSTRAINT chk_daily_soreness CHECK (muscle_soreness IS NULL OR muscle_soreness BETWEEN 1 AND 10),
    CONSTRAINT chk_daily_motivation CHECK (motivation_level IS NULL OR motivation_level BETWEEN 1 AND 10),

    UNIQUE KEY uq_daily_checkin (user_id, checkin_date),
    INDEX idx_daily_checkins_date (checkin_date)
) ENGINE=InnoDB;

CREATE TABLE body_measurements (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    measurement_date DATE NOT NULL,
    weight_kg DECIMAL(6,2) NULL,
    body_fat_percent DECIMAL(5,2) NULL,
    muscle_mass_kg DECIMAL(6,2) NULL,
    height_cm DECIMAL(5,2) NULL,
    source VARCHAR(50) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_body_measurements_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT chk_body_weight CHECK (weight_kg IS NULL OR weight_kg > 0),
    CONSTRAINT chk_body_fat CHECK (body_fat_percent IS NULL OR (body_fat_percent >= 0 AND body_fat_percent <= 100)),
    CONSTRAINT chk_body_muscle CHECK (muscle_mass_kg IS NULL OR muscle_mass_kg >= 0),
    CONSTRAINT chk_body_height CHECK (height_cm IS NULL OR height_cm > 0),

    INDEX idx_body_measurements_user_date (user_id, measurement_date)
) ENGINE=InnoDB;

-- ============================================================
-- 10. NOTIFICATIONS / AUDIT
-- ============================================================

CREATE TABLE notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    reference_type VARCHAR(50) NULL,
    reference_id BIGINT UNSIGNED NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    read_at DATETIME(6) NULL,

    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    INDEX idx_notifications_user_read_date (user_id, is_read, created_at)
) ENGINE=InnoDB;

CREATE TABLE audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id BIGINT UNSIGNED NULL,
    old_value JSON NULL,
    new_value JSON NULL,
    ip_address VARCHAR(45) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_audit_logs_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    INDEX idx_audit_logs_entity (entity_type, entity_id),
    INDEX idx_audit_logs_user_date (user_id, created_at),
    INDEX idx_audit_logs_created (created_at)
) ENGINE=InnoDB;

-- ============================================================
-- 11. SEED DATA
-- ============================================================

INSERT INTO goals (code, name, description, category) VALUES
('STRENGTH', 'Strength', 'Improve relative and absolute strength.', 'FITNESS'),
('MUSCLE_GAIN', 'Muscle Gain', 'Build lean muscle mass.', 'FITNESS'),
('WEIGHT_LOSS', 'Weight Loss', 'Support sustainable body composition goals.', 'BODY_COMPOSITION'),
('ENDURANCE', 'Endurance', 'Improve muscular and cardiovascular endurance.', 'FITNESS'),
('FLEXIBILITY', 'Flexibility', 'Improve flexibility and range of motion.', 'MOBILITY'),
('SKILL', 'Skill', 'Develop calisthenics skills and movement control.', 'SKILL'),
('GENERAL_FITNESS', 'General Fitness', 'Improve overall physical fitness.', 'FITNESS'),
('POSTURE', 'Posture', 'Improve movement quality and postural control.', 'MOBILITY');

INSERT INTO assessment_types (code, name, description) VALUES
('INITIAL', 'Initial Assessment', 'First assessment used to build the initial fitness profile.'),
('PERIODIC', 'Periodic Assessment', 'Recurring assessment used to measure progress and update recommendations.'),
('RECOVERY', 'Recovery Check', 'Assessment focused on readiness and recovery.'),
('POST_WORKOUT', 'Post Workout Assessment', 'Short assessment after a workout.');

INSERT INTO exercise_categories (code, name, description) VALUES
('PUSH', 'Push', 'Horizontal and vertical pushing movements.'),
('PULL', 'Pull', 'Pulling and rowing movements.'),
('LEGS', 'Legs', 'Lower body strength movements.'),
('CORE', 'Core', 'Trunk stability and core movements.'),
('MOBILITY', 'Mobility', 'Mobility and range-of-motion work.'),
('SKILL', 'Skill', 'Calisthenics skill development.'),
('CARDIO', 'Cardio', 'Conditioning and cardiovascular work.');

INSERT INTO muscles (code, name, body_region) VALUES
('CHEST', 'Chest', 'UPPER_BODY'),
('TRICEPS', 'Triceps', 'UPPER_BODY'),
('SHOULDER', 'Shoulder', 'UPPER_BODY'),
('BACK', 'Back', 'UPPER_BODY'),
('BICEPS', 'Biceps', 'UPPER_BODY'),
('ABS', 'Abdominals', 'CORE'),
('QUADRICEPS', 'Quadriceps', 'LOWER_BODY'),
('HAMSTRING', 'Hamstring', 'LOWER_BODY'),
('GLUTES', 'Glutes', 'LOWER_BODY'),
('CALVES', 'Calves', 'LOWER_BODY');

INSERT INTO assessment_questions
(question_code, question_text, question_type, category, unit, required, min_value, max_value)
VALUES
('PUSH_UP_MAX', 'Maximum strict push-ups you can perform in one set?', 'NUMBER', 'STRENGTH', 'REPS', TRUE, 0, 200),
('PULL_UP_MAX', 'Maximum strict pull-ups you can perform in one set?', 'NUMBER', 'STRENGTH', 'REPS', TRUE, 0, 100),
('SQUAT_MAX', 'Maximum bodyweight squats you can perform in one set?', 'NUMBER', 'STRENGTH', 'REPS', TRUE, 0, 300),
('PLANK_SECONDS', 'Maximum plank duration?', 'NUMBER', 'CORE', 'SECONDS', TRUE, 0, 3600),
('TRAINING_DAYS', 'How many days per week can you train?', 'NUMBER', 'TRAINING', 'DAYS', TRUE, 1, 7),
('TRAINING_EXPERIENCE', 'What is your calisthenics experience level?', 'SINGLE_CHOICE', 'EXPERIENCE', NULL, TRUE, NULL, NULL),
('PRIMARY_GOAL', 'What is your primary training goal?', 'SINGLE_CHOICE', 'GOAL', NULL, TRUE, NULL, NULL);

INSERT INTO assessment_question_options
(question_id, option_code, option_label, sort_order)
SELECT id, 'BEGINNER', 'Beginner', 1
FROM assessment_questions WHERE question_code = 'TRAINING_EXPERIENCE'
UNION ALL
SELECT id, 'INTERMEDIATE', 'Intermediate', 2
FROM assessment_questions WHERE question_code = 'TRAINING_EXPERIENCE'
UNION ALL
SELECT id, 'ADVANCED', 'Advanced', 3
FROM assessment_questions WHERE question_code = 'TRAINING_EXPERIENCE';

INSERT INTO assessment_question_options
(question_id, option_code, option_label, sort_order)
SELECT q.id, g.code, g.name, ROW_NUMBER() OVER (ORDER BY g.id)
FROM assessment_questions q
CROSS JOIN goals g
WHERE q.question_code = 'PRIMARY_GOAL';

INSERT INTO exercises
(category_id, code, name, description, difficulty_level, movement_pattern, equipment_required, instructions, safety_notes)
SELECT id, 'PUSH_UP', 'Push Up', 'Basic horizontal pushing movement.', 'BEGINNER', 'HORIZONTAL_PUSH', FALSE,
       'Maintain a neutral spine, lower under control, then press back to the starting position.',
       'Stop if sharp pain occurs. Keep shoulders controlled.'
FROM exercise_categories WHERE code = 'PUSH'
UNION ALL
SELECT id, 'BODYWEIGHT_SQUAT', 'Bodyweight Squat', 'Basic lower-body squat pattern.', 'BEGINNER', 'SQUAT', FALSE,
       'Sit down and back with control, keep the feet stable, then stand tall.',
       'Use a comfortable range of motion and maintain knee control.'
FROM exercise_categories WHERE code = 'LEGS'
UNION ALL
SELECT id, 'PLANK', 'Plank', 'Isometric trunk stability exercise.', 'BEGINNER', 'ANTI_EXTENSION', FALSE,
       'Maintain a straight line from shoulders to hips and ankles while bracing the trunk.',
       'Avoid excessive lower-back extension.'
FROM exercise_categories WHERE code = 'CORE'
UNION ALL
SELECT id, 'PULL_UP', 'Pull Up', 'Vertical pulling movement.', 'INTERMEDIATE', 'VERTICAL_PULL', TRUE,
       'Start from a controlled hang and pull until the chin clears the bar.',
       'Use appropriate assistance if full-range repetitions cannot be controlled.'
FROM exercise_categories WHERE code = 'PULL'
UNION ALL
SELECT id, 'DIP', 'Dip', 'Upper-body pressing movement using parallel bars.', 'INTERMEDIATE', 'VERTICAL_PUSH', TRUE,
       'Lower under control and press back up while keeping the shoulders stable.',
       'Use a reduced range or assistance if shoulder discomfort occurs.';

INSERT INTO exercise_muscles (exercise_id, muscle_id, role, activation_percent)
SELECT e.id, m.id, 'PRIMARY', 60
FROM exercises e JOIN muscles m ON m.code = 'CHEST'
WHERE e.code = 'PUSH_UP'
UNION ALL
SELECT e.id, m.id, 'SECONDARY', 25
FROM exercises e JOIN muscles m ON m.code = 'TRICEPS'
WHERE e.code = 'PUSH_UP'
UNION ALL
SELECT e.id, m.id, 'SECONDARY', 15
FROM exercises e JOIN muscles m ON m.code = 'SHOULDER'
WHERE e.code = 'PUSH_UP'
UNION ALL
SELECT e.id, m.id, 'PRIMARY', 55
FROM exercises e JOIN muscles m ON m.code = 'QUADRICEPS'
WHERE e.code = 'BODYWEIGHT_SQUAT'
UNION ALL
SELECT e.id, m.id, 'SECONDARY', 30
FROM exercises e JOIN muscles m ON m.code = 'GLUTES'
WHERE e.code = 'BODYWEIGHT_SQUAT'
UNION ALL
SELECT e.id, m.id, 'SECONDARY', 15
FROM exercises e JOIN muscles m ON m.code = 'HAMSTRING'
WHERE e.code = 'BODYWEIGHT_SQUAT'
UNION ALL
SELECT e.id, m.id, 'PRIMARY', 70
FROM exercises e JOIN muscles m ON m.code = 'ABS'
WHERE e.code = 'PLANK'
UNION ALL
SELECT e.id, m.id, 'PRIMARY', 55
FROM exercises e JOIN muscles m ON m.code = 'BACK'
WHERE e.code = 'PULL_UP'
UNION ALL
SELECT e.id, m.id, 'SECONDARY', 25
FROM exercises e JOIN muscles m ON m.code = 'BICEPS'
WHERE e.code = 'PULL_UP'
UNION ALL
SELECT e.id, m.id, 'SECONDARY', 20
FROM exercises e JOIN muscles m ON m.code = 'SHOULDER'
WHERE e.code = 'PULL_UP'
UNION ALL
SELECT e.id, m.id, 'PRIMARY', 45
FROM exercises e JOIN muscles m ON m.code = 'TRICEPS'
WHERE e.code = 'DIP'
UNION ALL
SELECT e.id, m.id, 'SECONDARY', 40
FROM exercises e JOIN muscles m ON m.code = 'CHEST'
WHERE e.code = 'DIP'
UNION ALL
SELECT e.id, m.id, 'SECONDARY', 15
FROM exercises e JOIN muscles m ON m.code = 'SHOULDER'
WHERE e.code = 'DIP';

-- ============================================================
-- 12. Useful views
-- ============================================================

CREATE OR REPLACE VIEW v_user_current_profile AS
SELECT
    u.id AS user_id,
    u.email,
    u.status,
    u.role,
    up.first_name,
    up.last_name,
    up.date_of_birth,
    up.gender,
    up.height_cm,
    up.weight_kg,
    up.timezone,
    up.avatar_url
FROM users u
LEFT JOIN user_profiles up ON up.user_id = u.id
WHERE u.deleted_at IS NULL;

CREATE OR REPLACE VIEW v_latest_fitness_profile AS
SELECT fp.*
FROM fitness_profiles fp
JOIN (
    SELECT user_id, MAX(created_at) AS max_created_at
    FROM fitness_profiles
    GROUP BY user_id
) latest
  ON latest.user_id = fp.user_id
 AND latest.max_created_at = fp.created_at;

CREATE OR REPLACE VIEW v_workout_exercise_targets AS
SELECT
    wp.id AS workout_plan_id,
    wp.user_id,
    wp.name AS workout_plan_name,
    wpd.id AS plan_day_id,
    wpd.day_number,
    wpd.name AS day_name,
    wpe.id AS plan_exercise_id,
    wpe.sequence_no,
    e.id AS exercise_id,
    e.code AS exercise_code,
    e.name AS exercise_name,
    wpe.sets,
    wpe.target_reps_min,
    wpe.target_reps_max,
    wpe.target_duration_sec,
    wpe.rest_seconds,
    wpe.target_rpe
FROM workout_plans wp
JOIN workout_plan_days wpd ON wpd.workout_plan_id = wp.id
JOIN workout_plan_exercises wpe ON wpe.workout_plan_day_id = wpd.id
JOIN exercises e ON e.id = wpe.exercise_id;

-- ============================================================
-- 10. AI COACHING & MOTION CONFIGURATION
-- ============================================================

CREATE TABLE IF NOT EXISTS exercise_ai_profiles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    exercise_id BIGINT UNSIGNED NOT NULL,
    profile_name VARCHAR(150) NOT NULL,
    pose_model VARCHAR(50) NOT NULL DEFAULT 'MediaPipe BlazePose GHUM 3D',
    tracking_mode VARCHAR(30) NOT NULL DEFAULT 'FULL_BODY',
    analysis_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    rep_counting_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    form_analysis_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    voice_warning_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    text_warning_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    version VARCHAR(20) NOT NULL DEFAULT '1.0',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    rep_start_condition TEXT NULL,
    rep_down_condition TEXT NULL,
    rep_up_condition TEXT NULL,
    min_rep_duration_ms INT DEFAULT 800,
    max_rep_duration_ms INT DEFAULT 10000,
    debounce_time_ms INT DEFAULT 400,
    min_rom_percentage DOUBLE DEFAULT 75.0,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_ai_profiles_exercise
        FOREIGN KEY (exercise_id) REFERENCES exercises(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_ai_profiles_exercise (exercise_id, status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ai_landmark_requirements (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ai_profile_id BIGINT UNSIGNED NOT NULL,
    landmark_name VARCHAR(60) NOT NULL,
    landmark_index INT NULL,
    required BOOLEAN NOT NULL DEFAULT TRUE,
    min_visibility DOUBLE NOT NULL DEFAULT 0.65,
    side VARCHAR(20) DEFAULT 'BOTH',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_landmark_reqs_profile
        FOREIGN KEY (ai_profile_id) REFERENCES exercise_ai_profiles(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_landmark_reqs_profile (ai_profile_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ai_motion_rules (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ai_profile_id BIGINT UNSIGNED NOT NULL,
    rule_code VARCHAR(80) NOT NULL,
    rule_name VARCHAR(150) NOT NULL,
    rule_type VARCHAR(50) DEFAULT 'FORM_CHECK',
    metric_type VARCHAR(50) NOT NULL,
    operator VARCHAR(30) NOT NULL,
    threshold_min DOUBLE NULL,
    threshold_max DOUBLE NULL,
    warning_threshold DOUBLE NULL,
    critical_threshold DOUBLE NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'WARNING',
    invalid_rep BOOLEAN NOT NULL DEFAULT FALSE,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    priority INT NOT NULL DEFAULT 1,
    feedback_message TEXT NULL,
    voice_prompt TEXT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_motion_rules_profile
        FOREIGN KEY (ai_profile_id) REFERENCES exercise_ai_profiles(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_motion_rules_profile (ai_profile_id, enabled)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ai_feedback_templates (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    rule_id BIGINT UNSIGNED NOT NULL,
    language VARCHAR(10) NOT NULL DEFAULT 'vi',
    feedback_type VARCHAR(30) NOT NULL DEFAULT 'FORM_ERROR',
    text_template TEXT NOT NULL,
    priority INT NOT NULL DEFAULT 1,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_feedback_templates_rule
        FOREIGN KEY (rule_id) REFERENCES ai_motion_rules(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ai_voice_configurations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL DEFAULT 'Default Gemini Voice Coach',
    provider VARCHAR(50) NOT NULL DEFAULT 'GEMINI',
    model VARCHAR(80) NOT NULL DEFAULT 'gemini-2.0-flash',
    api_key VARCHAR(255) NULL,
    language VARCHAR(20) NOT NULL DEFAULT 'vi-VN',
    voice_name VARCHAR(50) NOT NULL DEFAULT 'Aoede (Energetic Coach)',
    speaking_rate DOUBLE DEFAULT 1.05,
    pitch DOUBLE DEFAULT 0.0,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ai_voice_warning_cache (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    text_hash VARCHAR(64) NOT NULL UNIQUE,
    raw_text TEXT NOT NULL,
    language VARCHAR(20) NOT NULL DEFAULT 'vi-VN',
    voice_name VARCHAR(50) NULL,
    audio_url TEXT NULL,
    storage_key VARCHAR(255) NULL,
    duration_seconds DOUBLE NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'READY',
    hit_count BIGINT NOT NULL DEFAULT 1,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    last_accessed_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_voice_cache_hash (text_hash)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ai_configuration_versions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ai_profile_id BIGINT UNSIGNED NOT NULL,
    version_number VARCHAR(20) NOT NULL,
    configuration_snapshot LONGTEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    created_by VARCHAR(100) NULL,
    approved_by VARCHAR(100) NULL,
    change_summary TEXT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    published_at DATETIME(6) NULL,

    CONSTRAINT fk_ai_versions_profile
        FOREIGN KEY (ai_profile_id) REFERENCES exercise_ai_profiles(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ai_configuration_audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    profile_id BIGINT UNSIGNED NOT NULL,
    exercise_name VARCHAR(150) NULL,
    user_email VARCHAR(150) NULL,
    action VARCHAR(30) NOT NULL,
    old_value TEXT NULL,
    new_value TEXT NULL,
    reason TEXT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB;

-- ============================================================
-- End
-- ============================================================

