import { useLocation } from 'react-router-dom';

/**
 * Cùng một bộ màn hình bài test đánh giá dùng cho hai vai trò:
 *  - Coach (/coach/assessment-tests): SOẠN (tạo, sửa bản nháp, nhân bản, xem trước, ngân hàng câu hỏi), gửi bản nháp cho Admin.
 *  - Admin (/admin/assessments): xem, duyệt (phát hành), lưu trữ, xóa, đặt bài test đầu vào.
 * Quyền thật do backend quyết định; phần này chỉ ẩn nút không dùng được để người dùng khỏi bấm nhầm.
 */
export function useAssessmentScope() {
  const { pathname } = useLocation();
  const isCoach = pathname.startsWith('/coach');
  return { isCoach, base: isCoach ? '/coach/assessment-tests' : '/admin/assessments' };
}
