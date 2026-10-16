import { apiClient } from "../../lib/api/client";
import type { AuthSession, AuthUser, OnboardingStatus, UserRole } from "../../types";

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface RegisterResponse {
  message: string;
  email: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export interface ResendOtpPayload {
  email: string;
}

export interface SimpleMessageResponse {
  message: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthApiResponse {
  accessToken: string;
  tokenType: string;
  userId: string;
  email: string;
  fullName: string | null;
  /** true = token chỉ dùng để đổi mật khẩu (tài khoản Coach vừa được Admin cấp). */
  mustChangePassword?: boolean;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface UserProfileResponse {
  userId: number;
  email: string;
  role: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  heightCm: number | null;
  weightKg: number | null;
  timezone: string | null;
  avatarUrl: string | null;
}

export function parseJwt(token: string): { sub?: string; email?: string; role?: string; exp?: number; mcp?: boolean } | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function buildAuthUser(
  token: string,
  authData?: Partial<AuthApiResponse>,
  profile?: Partial<UserProfileResponse> | null
): AuthUser {
  const jwt = parseJwt(token);
  const userId = authData?.userId ?? (jwt?.sub ? String(jwt.sub) : String(profile?.userId ?? ""));
  const email = authData?.email ?? profile?.email ?? jwt?.email ?? "";
  const rawRole = (profile?.role ?? jwt?.role ?? "USER").toUpperCase();
  const role: UserRole = rawRole === "ADMIN" || rawRole === "COACH" ? rawRole : "USER";
  
  const fullName = authData?.fullName ?? profile?.fullName ?? (email ? email.split("@")[0] : "Người dùng");
  const avatarUrl = profile?.avatarUrl ?? null;

  // Retrieve saved onboarding status from local storage for USER role
  const savedOnboarding = localStorage.getItem(`calis_onboarding_${userId}`);
  let onboarding: AuthUser["onboarding"] = { status: "NOT_STARTED", currentStep: 0 };
  
  if (role !== "USER") {
    onboarding = { status: "COMPLETED", currentStep: 4 };
  } else if (savedOnboarding) {
    try {
      onboarding = JSON.parse(savedOnboarding);
    } catch {
      onboarding = { status: "NOT_STARTED", currentStep: 0 };
    }
  }

  return {
    id: userId,
    name: fullName,
    email,
    avatarUrl,
    role,
    onboarding,
    mustChangePassword: authData?.mustChangePassword ?? jwt?.mcp === true,
  };
}

export const authApi = {
  /** Đổi mật khẩu của chính mình. Trả token mới (không còn hạn chế) nên người dùng đi tiếp mà không phải đăng nhập lại. */
  async changePassword(data: ChangePasswordPayload): Promise<AuthSession> {
    const res = await apiClient.post<AuthApiResponse>("/account/change-password", data);
    const token = res.data.accessToken;
    localStorage.setItem("calis_token", token);
    return { token, user: buildAuthUser(token, res.data) };
  },

  async register(data: RegisterPayload): Promise<RegisterResponse> {
    const res = await apiClient.post<RegisterResponse>("/auth/register", data);
    return res.data;
  },

  async verifyOtp(data: VerifyOtpPayload): Promise<AuthSession> {
    const res = await apiClient.post<AuthApiResponse>("/auth/verify-otp", data);
    const token = res.data.accessToken;
    localStorage.setItem("calis_token", token);
    const user = buildAuthUser(token, res.data);
    return { token, user };
  },

  async resendOtp(data: ResendOtpPayload): Promise<SimpleMessageResponse> {
    const res = await apiClient.post<SimpleMessageResponse>("/auth/resend-otp", data);
    return res.data;
  },

  async login(data: LoginPayload): Promise<AuthSession> {
    const res = await apiClient.post<AuthApiResponse>("/auth/login", data);
    const token = res.data.accessToken;
    localStorage.setItem("calis_token", token);
    
    // Optionally fetch full profile
    let profile: UserProfileResponse | null = null;
    try {
      const pRes = await apiClient.get<UserProfileResponse>("/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      profile = pRes.data;
    } catch {
      // Ignored if profile fetch fails
    }

    const user = buildAuthUser(token, res.data, profile);
    return { token, user };
  },

  async getProfile(): Promise<UserProfileResponse> {
    const res = await apiClient.get<UserProfileResponse>("/profile");
    return res.data;
  },

  async updateAvatar(userId: string, avatarUrl: string | null): Promise<void> {
    await apiClient.put("/profile", { avatarUrl });
  },
};
