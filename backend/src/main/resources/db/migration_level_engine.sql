-- Level Engine (LEVEL_ASSESSMENT_ROADMAP_DESIGN.md)
-- Các bảng/cột mới được Hibernate (ddl-auto: update) tự tạo khi khởi động. Chạy file này MỘT LẦN sau lần khởi động đầu tiên.

-- 1) Hibernate KHÔNG tự bỏ NOT NULL của cột đã có: phiên đo MediaPipe của bài đánh giá định kỳ
--    không bắt buộc thuộc một buổi tập.
ALTER TABLE movement_sessions MODIFY workout_session_id BIGINT UNSIGNED NULL;

-- 2) Các bảng cũ dùng khoá chính BIGINT UNSIGNED, còn Hibernate tạo cột khoá ngoại BIGINT (signed) nên
--    không tạo được ràng buộc FK. Đổi kiểu cột cho khớp; lần khởi động sau Hibernate sẽ tự thêm FK.
ALTER TABLE competency_ladder_nodes     MODIFY exercise_id BIGINT UNSIGNED NOT NULL;
ALTER TABLE question_competency_weights MODIFY question_id BIGINT UNSIGNED NOT NULL;
ALTER TABLE question_competency_weights MODIFY exercise_id BIGINT UNSIGNED NULL;
ALTER TABLE level_requirements          MODIFY exercise_id BIGINT UNSIGNED NULL;
ALTER TABLE assessment_test_items       MODIFY template_id BIGINT UNSIGNED NOT NULL;
ALTER TABLE assessment_test_items       MODIFY exercise_id BIGINT UNSIGNED NOT NULL;
ALTER TABLE goals                       MODIFY target_exercise_id BIGINT UNSIGNED NULL;
