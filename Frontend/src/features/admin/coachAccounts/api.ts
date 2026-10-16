import { isAxiosError } from "axios";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api/client";

/** Tài khoản Coach do Admin tạo: mật khẩu tạm gửi qua email, bắt buộc đổi ở lần đăng nhập đầu. Không API nào trả mật khẩu. */
/** LOCKED = nhập sai mật khẩu nhiều lần (tạm khoá). status (ACTIVE | INACTIVE | SUSPENDED | DELETED) là trạng thái tài khoản, độc lập với state. */
export type CoachAccountState = "LOCKED" | "PENDING_FIRST_LOGIN" | "TEMP_EXPIRED" | "ACTIVE";

export interface CoachAccount {
  id: number;
  email: string;
  fullName: string;
  status: string;
  state: CoachAccountState;
  mustChangePassword: boolean;
  tempPasswordExpiresAt: string | null;
  lockedUntil: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface CreateCoachInput {
  email: string;
  fullName: string;
}

const KEY = ["admin", "coach-accounts"] as const;

export const coachAccountApi = {
  async list(): Promise<CoachAccount[]> {
    return (await apiClient.get<CoachAccount[]>("/admin/coaches")).data;
  },
  async create(input: CreateCoachInput): Promise<CoachAccount> {
    return (await apiClient.post<CoachAccount>("/admin/coaches", input)).data;
  },
  async resetPassword(id: number): Promise<CoachAccount> {
    return (await apiClient.post<CoachAccount>(`/admin/coaches/${id}/reset-password`)).data;
  },
  async unlock(id: number): Promise<CoachAccount> {
    return (await apiClient.post<CoachAccount>(`/admin/coaches/${id}/unlock`)).data;
  },
  /** Vô hiệu hoá (SUSPENDED) hoặc kích hoạt lại (ACTIVE): token đang dùng mất hiệu lực trong vài chục giây. */
  async setStatus(id: number, status: "ACTIVE" | "SUSPENDED"): Promise<void> {
    await apiClient.put(`/admin/users/${id}/status`, { status });
  },
};

export function useCoachAccounts() {
  return useQuery({ queryKey: KEY, queryFn: coachAccountApi.list, placeholderData: keepPreviousData });
}

export function useCreateCoach() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: coachAccountApi.create, onSuccess: () => qc.invalidateQueries({ queryKey: KEY }) });
}

export function useUnlockCoach() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: coachAccountApi.unlock, onSuccess: () => qc.invalidateQueries({ queryKey: KEY }) });
}

export function useSetCoachStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: number; status: "ACTIVE" | "SUSPENDED" }) => coachAccountApi.setStatus(v.id, v.status),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useResetCoachPassword() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: coachAccountApi.resetPassword, onSuccess: () => qc.invalidateQueries({ queryKey: KEY }) });
}

/** Thông điệp lỗi từ backend (ApiError.message), nếu không có thì dùng thông điệp dự phòng. */
export function apiMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const message = (error.response?.data as { message?: unknown } | undefined)?.message;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}
