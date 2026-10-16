import { useLocation } from "react-router-dom";

/**
 * Giáo án mẫu (program template) dùng chung một bộ màn hình cho hai vai trò, nối thẳng /admin/program-templates:
 *  - Coach (/coach/plans): SOẠN (tạo, sửa bản nháp, nhân bản, xem trước). Lưu luôn ra bản nháp; không xuất bản, không xóa.
 *  - Admin (/admin/workout-plans): xem, duyệt (xuất bản), lưu trữ, xóa. Giáo án đã có học viên dùng chỉ được lưu trữ (backend quyết định).
 * Quyền thật do backend chặn; phần này chỉ ẩn nút không dùng được.
 */
export function useWorkoutPlanScope() {
  const { pathname } = useLocation();
  const isCoach = pathname.startsWith("/coach");
  return { isCoach, base: isCoach ? "/coach/plans" : "/admin/workout-plans" };
}
