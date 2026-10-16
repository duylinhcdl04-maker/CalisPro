-- =========================================================================================
-- CALISHEALTH - BƯỚC 16: EXP CHUYÊN CẦN (điểm danh qua check-in sức khỏe, hoàn thành buổi tập, đánh giá định kỳ)
-- exp_events: sổ cái EXP, mỗi sự kiện một dòng. Khóa (user, loại, ref_key) bảo đảm mỗi sự kiện chỉ được tính một lần.
--   CHECKIN (ref = ngày) | SESSION (ref = id buổi tập) | GOOD_FORM (ref = id buổi tập) | STREAK7 (ref = ngày đủ chuỗi) | ASSESSMENT (ref = id phiên đánh giá)
-- points là điểm tại thời điểm ghi (lấy từ tham số exp.* của rule set đang áp dụng); đổi tham số sau này không sửa lịch sử.
-- EXP KHÔNG thay điểm bài test hay điểm form: chỉ làm cổng chuyên cần và điểm cộng nhỏ, chi tiết trong PeriodicDecisionEngine.
-- Bảng mới, chỉ thêm; không đụng dữ liệu cũ. Idempotent; gỡ bằng bản rollback tương ứng.
-- Tham số exp.* / attendance.* nằm trong rule set (qua quy trình Coach soạn, Admin duyệt); thiếu tham số thì tính năng tự tắt.
-- =========================================================================================
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS exp_events (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT UNSIGNED NOT NULL,
    event_type  VARCHAR(20)     NOT NULL COMMENT 'CHECKIN | SESSION | GOOD_FORM | STREAK7 | ASSESSMENT',
    ref_key     VARCHAR(40)     NOT NULL COMMENT 'ngày (CHECKIN, STREAK7) hoặc id nguồn (SESSION, GOOD_FORM, ASSESSMENT)',
    points      INT             NOT NULL,
    event_date  DATE            NOT NULL,
    created_at  DATETIME(6)     NOT NULL,
    UNIQUE KEY uk_exp_event (user_id, event_type, ref_key),
    KEY idx_exp_user_date (user_id, event_date),
    CONSTRAINT fk_exp_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

SELECT COUNT(*) AS exp_events_rows FROM exp_events;
