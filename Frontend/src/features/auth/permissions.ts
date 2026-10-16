import type { AuthUser, UserRole } from "../../types";

/** The one place that knows which role lands where. */
export const ROLE_HOME: Record<UserRole, string> = {
  ADMIN: "/admin/dashboard",
  COACH: "/coach/dashboard",
  USER: "/home",
};

export function hasRole(user: AuthUser | null | undefined, roles: UserRole | UserRole[]): boolean {
  if (!user) return false;
  const list = Array.isArray(roles) ? roles : [roles];
  return list.includes(user.role);
}
