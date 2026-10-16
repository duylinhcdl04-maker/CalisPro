import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { ROLE_HOME, hasRole } from "../features/auth/permissions";
import type { AuthUser, UserRole } from "../types";

/**
 * Determines where an authenticated user should land based on their role and onboarding status.
 * Admins go to /admin, coaches to /coach, standard users to /home or /onboarding.
 */
function destinationFor(user: AuthUser | null | undefined) {
  if (!user) return "/login";
  if (user.mustChangePassword) return "/change-password";
  if (user.role !== "USER") return ROLE_HOME[user.role];
  return user.onboarding?.status === "COMPLETED" ? ROLE_HOME.USER : "/onboarding";
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (user?.mustChangePassword) return <Navigate to="/change-password" replace />;
  return <>{children}</>;
}

/** Chỉ cho vào khi đang phải đổi mật khẩu tạm (tài khoản Coach do Admin cấp); người đã đổi xong về trang chủ theo vai trò. */
export function RequirePasswordChange({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!user?.mustChangePassword) return <Navigate to={destinationFor(user)} replace />;
  return <>{children}</>;
}

/** Generic role guard: authenticated + one of `roles`, otherwise sent to their own home. */
export function ProtectedRoute({ roles, children }: { roles: UserRole[]; children: ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (user?.mustChangePassword) return <Navigate to="/change-password" replace />;
  if (!hasRole(user, roles)) return <Navigate to={destinationFor(user)} replace />;
  return <>{children}</>;
}

/** Guards admin routes: user must be authenticated and have role === "ADMIN". */
export function RequireAdmin({ children }: { children: ReactNode }) {
  return <ProtectedRoute roles={["ADMIN"]}>{children}</ProtectedRoute>;
}

/** Guards coach routes (/coach/*). Coaches cannot reach /admin/* and vice versa. */
export function RequireCoach({ children }: { children: ReactNode }) {
  return <ProtectedRoute roles={["COACH"]}>{children}</ProtectedRoute>;
}

/** Guards authenticated app routes: onboarding must be COMPLETED first (RULE 6). Admins can preview anytime. */
export function RequireCompletedOnboarding({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (user?.role === "COACH") return <Navigate to={ROLE_HOME.COACH} replace />;
  if (user && user.role !== "ADMIN" && user.onboarding?.status !== "COMPLETED") {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
}

/** Guards /onboarding: staff roles go to their dashboard; already-completed users go straight to /home. */
export function RequireIncompleteOnboarding({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (user) {
    if (user.role !== "USER") return <Navigate to={ROLE_HOME[user.role]} replace />;
    // Đã bỏ qua thì vẫn được vào để làm bài (chỉ người đã hoàn thành hẳn mới bị chuyển về trang chủ)
    if (user.onboarding?.status === "COMPLETED" && !user.onboarding.skipped) return <Navigate to={ROLE_HOME.USER} replace />;
  }
  return <>{children}</>;
}

/** Guards /login and /register: a returning user skips the form and goes to their role dashboard. */
export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return null;
  if (isAuthenticated && user) return <Navigate to={destinationFor(user)} replace />;
  return <>{children}</>;
}

export { destinationFor };
