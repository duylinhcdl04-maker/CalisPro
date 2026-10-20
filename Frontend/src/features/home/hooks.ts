import { useQuery } from "@tanstack/react-query";
import { homeApi } from "./api";

/** Khóa ["home"] được làm mới khi người dùng đổi cách tập / tạo chu kỳ (xem plan-choice/api.ts). */
export function useHomeQuery() {
  return useQuery({ queryKey: ["home"], queryFn: homeApi.get, retry: 1, staleTime: 30_000 });
}
