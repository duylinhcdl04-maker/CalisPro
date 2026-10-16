-- =========================================================================================
-- CALISHEALTH - ASSESSMENT FRAMEWORK V2 - BƯỚC 7: COACH SOẠN RULE SET (tác giả + nhật ký thay đổi)
-- Coach soạn rule set (clone -> sửa bản DRAFT -> gửi duyệt); ADMIN duyệt và kích hoạt (Admin không tự duyệt bản mình soạn).
-- rule_sets.author_id: Coach sở hữu bản DRAFT (NULL = do hệ thống/migration tạo, Coach đầu tiên sửa/gửi duyệt trở thành tác giả); submitted_at: thời điểm gửi duyệt (hàng chờ của Admin).
-- rule_set_changes: nhật ký từng thay đổi (giá trị cũ -> mới) - căn cứ để xác định phạm vi review bắt buộc và để audit.
-- Chạy sau 01..06; idempotent; gỡ bằng 99_rollback. Không đụng dữ liệu v1 (cột mới NULL cho rule set v1).
-- =========================================================================================
SET NAMES utf8mb4;

SELECT IF(NOT EXISTS (SELECT 1 FROM rule_sets WHERE code = 'LEVEL_ENGINE_V2'), (SELECT 'chua chay 02_seed' UNION ALL SELECT 'abort'), 'ok') AS guard_v2_seeded;

SET @ddl := IF(EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'rule_sets' AND column_name = 'author_id'),
               'SELECT 1',
               'ALTER TABLE rule_sets ADD COLUMN author_id BIGINT UNSIGNED NULL, ADD COLUMN submitted_at DATETIME(6) NULL');
PREPARE s FROM @ddl; EXECUTE s; DEALLOCATE PREPARE s;

CREATE TABLE IF NOT EXISTS rule_set_changes (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    rule_set_id BIGINT          NOT NULL,
    actor_id    BIGINT UNSIGNED NOT NULL,
    target_type VARCHAR(20)     NOT NULL COMMENT 'PARAM | LEVEL | REQUIREMENT',
    target_key  VARCHAR(120)    NOT NULL,
    old_value   VARCHAR(500)    NULL,
    new_value   VARCHAR(500)    NULL,
    created_at  DATETIME(6)     NOT NULL,
    KEY idx_rsc_ruleset (rule_set_id),
    CONSTRAINT fk_rsc_ruleset FOREIGN KEY (rule_set_id) REFERENCES rule_sets (id),
    CONSTRAINT fk_rsc_actor FOREIGN KEY (actor_id) REFERENCES users (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

SELECT (SELECT COUNT(*) FROM rule_set_changes) AS changes,
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'rule_sets' AND column_name IN ('author_id', 'submitted_at')) AS new_columns_expect_2;
