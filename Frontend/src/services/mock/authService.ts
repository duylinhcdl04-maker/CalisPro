import type { AuthSession, AuthUser, OnboardingStatus } from "../../types";
import { mockDb } from "./db";
import { withLatency, MockApiError } from "./latency";

export const authService = {
  async register(name: string, email: string, password: string): Promise<AuthSession> {
    await withLatency(null, 600);
    if (mockDb.findByEmail(email)) {
      throw new MockApiError("Email này đã được sử dụng.", 409);
    }
    const record = mockDb.createUser(name, email, password);
    const token = mockDb.createSession(record.id);
    const user = mockDb.getUserByToken(token)!;
    return { token, user };
  },

  async login(email: string, password: string): Promise<AuthSession> {
    await withLatency(null, 600);
    const record = mockDb.findByEmail(email);
    if (!record || record.password !== password) {
      throw new MockApiError("Email hoặc mật khẩu không đúng.", 401);
    }
    const token = mockDb.createSession(record.id);
    const user = mockDb.getUserByToken(token)!;
    return { token, user };
  },

  async me(token: string): Promise<AuthSession["user"]> {
    await withLatency(null, 300);
    const user = mockDb.getUserByToken(token);
    if (!user) throw new MockApiError("Phiên đăng nhập đã hết hạn.", 401);
    return user;
  },

  async logout(token: string): Promise<void> {
    mockDb.destroySession(token);
    await withLatency(null, 150);
  },

  /** Persists onboarding progress to the mock "backend" so it survives a reload,
   * mirroring what a real PATCH /me/onboarding call would do. */
  async updateOnboarding(userId: string, status: OnboardingStatus, step: number): Promise<AuthUser> {
    await withLatency(null, 200);
    const user = mockDb.updateOnboarding(userId, status, step);
    if (!user) throw new MockApiError("Người dùng không tồn tại.", 404);
    return user;
  },

  async updateAvatar(userId: string, avatarUrl: string | null): Promise<AuthUser> {
    await withLatency(null, 200);
    const user = mockDb.updateAvatar(userId, avatarUrl);
    if (!user) throw new MockApiError("Người dùng không tồn tại.", 404);
    return user;
  },
};
