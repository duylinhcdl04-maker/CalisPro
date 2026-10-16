import type { PrivacyConsent, SessionInfo } from "../../types";
import { withLatency } from "./latency";

let consentState: PrivacyConsent = {
  dataProcessing: true,
  marketingUpdates: false,
};

const SESSION: SessionInfo = {
  device: "Thiết bị này",
  status: "active",
  lastActiveLabel: "Đang hoạt động",
};

export const profileService = {
  async getPrivacyConsent(): Promise<PrivacyConsent> {
    await withLatency(null, 300);
    return consentState;
  },

  async updatePrivacyConsent(next: Partial<PrivacyConsent>): Promise<PrivacyConsent> {
    await withLatency(null, 250);
    consentState = { ...consentState, ...next };
    return consentState;
  },

  async getSession(): Promise<SessionInfo> {
    await withLatency(null, 250);
    return SESSION;
  },

  async changePassword(): Promise<{ success: boolean }> {
    await withLatency(null, 700);
    return { success: true };
  },

  async updateName(name: string): Promise<{ name: string }> {
    await withLatency(null, 400);
    return { name };
  },
};
