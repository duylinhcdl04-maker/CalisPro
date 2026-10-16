import { useQuery } from "@tanstack/react-query";
import { homeApi } from "./api";

export function useHomeQuery(userName: string) {
  return useQuery({
    queryKey: ["home", userName],
    queryFn: () => homeApi.getHome(userName),
  });
}
