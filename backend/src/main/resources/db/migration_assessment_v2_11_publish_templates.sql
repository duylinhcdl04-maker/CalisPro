-- =========================================================================================
-- CALISHEALTH - ASSESSMENT FRAMEWORK V2 - BƯỚC 11: XUẤT BẢN 3 TEMPLATE V2 KHI KÍCH HOẠT
-- Template V2 (sàng lọc an toàn, khảo sát ban đầu, Baseline/định kỳ) KHÔNG xuất bản được bằng nút "Phát hành" của trình tạo bài test v1,
-- vì kiểm tra v1 đòi tổng trọng số câu hỏi > 0 và có mức trình độ; V2 chấm bằng rule set chứ không bằng cấu hình chấm điểm v1.
-- Script này chuyển DRAFT -> PUBLISHED đúng 3 template theo mã. CHẠY CÙNG LÚC với việc bật ASSESSMENT_V2_ENABLED, sau khi rule set LEVEL_ENGINE_V2 được duyệt.
-- Idempotent; gỡ bằng 99_rollback (đưa về DRAFT).
-- =========================================================================================
SET NAMES utf8mb4;

SELECT IF(EXISTS (SELECT 1 FROM rule_sets WHERE code = 'LEVEL_ENGINE_V2' AND status = 'ACTIVE'),
          'ok', (SELECT 'rule set LEVEL_ENGINE_V2 chua ACTIVE - hay duyet va kich hoat truoc' UNION ALL SELECT 'abort')) AS guard_rule_set_active;

UPDATE assessment_templates
   SET status = 'PUBLISHED', published_at = COALESCE(published_at, NOW(6))
 WHERE code IN ('CALISHEALTH_SAFETY_V1', 'CALISHEALTH_INITIAL_FW2', 'CALISHEALTH_PERIODIC_FW2') AND status = 'DRAFT';

SELECT code, status, published_at FROM assessment_templates WHERE code IN ('CALISHEALTH_SAFETY_V1', 'CALISHEALTH_INITIAL_FW2', 'CALISHEALTH_PERIODIC_FW2') ORDER BY code;
