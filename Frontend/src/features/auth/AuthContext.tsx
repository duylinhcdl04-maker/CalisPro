import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { authApi, buildAuthUser, parseJwt, type RegisterPayload, type RegisterResponse, type SimpleMessageResponse } from "./api";
import type { AuthUser } from "../../types";
import { toast } from "sonner";
import { SESSION_EXPIRED_EVENT } from "../../lib/api/client";
import { onboardingApi, type OnboardingServerStatus } from "../onboarding/api";

const ONBOARDING_FROM_SERVER: Record<OnboardingServerStatus, AuthUser["onboarding"]["status"]> = {
  PENDING: "NOT_STARTED",
  COMPLETED: "COMPLETED",
  SKIPPED: "COMPLETED",
  NOT_REQUIRED: "COMPLETED",
  BLOCKED: "BLOCKED",
};

/**
 * Trạng thái bài test đầu vào lấy từ BACKEND (gắn với tài khoản, không phụ thuộc trình duyệt).
 * Chỉ áp dụng cho USER; lỗi mạng -> giữ trạng thái đang có để không chặn nhầm người dùng.
 */
async function withServerOnboarding(user: AuthUser): Promise<AuthUser> {
  if (user.role !== "USER") return user;
  try {
    const st = await onboardingApi.getStatus();
    const status = ONBOARDING_FROM_SERVER[st.status] ?? "NOT_STARTED";
    const keepProgress = status === "NOT_STARTED" && user.onboarding?.status === "IN_PROGRESS";
    return { ...user, onboarding: keepProgress ? user.onboarding : { status, currentStep: 0, skipped: st.status === "SKIPPED" } };
  } catch {
    return user;
  }
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<RegisterResponse>;
  verifyOtp: (email: string, otp: string) => Promise<AuthUser>;
  resendOtp: (email: string) => Promise<SimpleMessageResponse>;
  logout: () => Promise<void>;
  setOnboardingStatus: (status: AuthUser["onboarding"]) => void;
  /** Đọc lại trạng thái bài test đầu vào từ backend (sau khi nộp bài / bỏ qua) */
  refreshOnboarding: () => Promise<AuthUser | null>;
  updateAvatar: (avatarUrl: string | null) => Promise<void>;
  /** Đổi mật khẩu (bắt buộc ở lần đăng nhập đầu của tài khoản Coach do Admin cấp). Cập nhật phiên bằng token mới. */
  changePassword: (currentPassword: string, newPassword: string) => Promise<AuthUser>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "calis_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setIsLoading(false);
      return;
    }

    const jwt = parseJwt(token);
    if (!jwt || (jwt.exp && jwt.exp * 1000 < Date.now())) {
      localStorage.removeItem(TOKEN_KEY);
      setIsLoading(false);
      return;
    }

    authApi
      .getProfile()
      .then(async (profile) => {
        const authUser = await withServerOnboarding(buildAuthUser(token, undefined, profile));
        setUser(authUser);
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          localStorage.removeItem(TOKEN_KEY);
          setUser(null);
        } else {
          // If network error, still construct fallback user from JWT
          const fallbackUser = buildAuthUser(token);
          setUser(fallbackUser);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Phiên hết hạn: API trả 401 cho request có token, hoặc đến đúng thời điểm `exp` của JWT.
  // Đăng xuất + báo rõ cho người dùng; route guard sẽ đưa về /login và quay lại trang cũ sau khi đăng nhập.
  const userRef = useRef<AuthUser | null>(null);
  userRef.current = user;

  useEffect(() => {
    function handleExpired() {
      localStorage.removeItem(TOKEN_KEY);
      if (userRef.current) {
        toast.warning("Phiên đăng nhập đã hết hạn", {
          id: "session-expired",
          description: "Vui lòng đăng nhập lại để tiếp tục. Dữ liệu chưa lưu trên trang hiện tại có thể bị mất.",
        });
      }
      setUser(null);
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
  }, []);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem(TOKEN_KEY);
    const exp = token ? parseJwt(token)?.exp : undefined;
    if (!exp) return;
    const msLeft = exp * 1000 - Date.now();
    const timer = window.setTimeout(
      () => window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT)),
      Math.max(0, Math.min(msLeft, 2_147_483_647))
    );
    return () => window.clearTimeout(timer);
  }, [user]);

  async function login(email: string, password: string) {
    const session = await authApi.login({ email, password });
    const authUser = await withServerOnboarding(session.user);
    setUser(authUser);
    return authUser;
  }

  async function register(payload: RegisterPayload) {
    const res = await authApi.register(payload);
    return res;
  }

  async function verifyOtp(email: string, otp: string) {
    const session = await authApi.verifyOtp({ email, otp });
    const authUser = await withServerOnboarding(session.user);
    setUser(authUser);
    return authUser;
  }

  async function resendOtp(email: string) {
    return await authApi.resendOtp({ email });
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    const session = await authApi.changePassword({ currentPassword, newPassword });
    const updated = { ...session.user, avatarUrl: userRef.current?.avatarUrl ?? session.user.avatarUrl };
    setUser(updated);
    return updated;
  }

  async function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }

  function setOnboardingStatus(onboarding: AuthUser["onboarding"]) {
    setUser((prev) => {
      if (!prev) return prev;
      localStorage.setItem(`calis_onboarding_${prev.id}`, JSON.stringify(onboarding));
      return { ...prev, onboarding };
    });
  }

  async function refreshOnboarding() {
    const current = userRef.current;
    if (!current) return null;
    const updated = await withServerOnboarding(current);
    setUser(updated);
    return updated;
  }

  async function updateAvatar(avatarUrl: string | null) {
    if (!user) return;
    await authApi.updateAvatar(user.id, avatarUrl);
    setUser((prev) => (prev ? { ...prev, avatarUrl } : prev));
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        verifyOtp,
        resendOtp,
        logout,
        setOnboardingStatus,
        refreshOnboarding,
        updateAvatar,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
