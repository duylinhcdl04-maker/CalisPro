import { useLocation } from "react-router-dom";

/**
 * Thư viện động tác dùng chung một bộ trang cho Admin và Coach. Trang đang mở dưới /coach thì mọi liên kết quay về /coach/exercises.
 * Coach soạn: bài mới luôn là bản nháp, Admin mới là người xuất bản (backend cũng chặn nếu Coach cố xuất bản).
 */
export function useExerciseBasePath() {
  const { pathname } = useLocation();
  const isCoach = pathname.startsWith("/coach");
  return { isCoach, base: isCoach ? "/coach/exercises" : "/admin/exercises" };
}
