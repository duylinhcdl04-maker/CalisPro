import { apiClient } from "../../lib/api/client";
import { profileService } from "../../services/mock/profileService";
import type { PrivacyConsent } from "../../types";

export const profileApi = {
  getPrivacyConsent: () => profileService.getPrivacyConsent(),
  updatePrivacyConsent: (next: Partial<PrivacyConsent>) => profileService.updatePrivacyConsent(next),
  getSession: () => profileService.getSession(),
  changePassword: () => profileService.changePassword(),
  async updateName(name: string) {
    try {
      const names = name.trim().split(" ");
      const firstName = names.slice(1).join(" ") || names[0];
      const lastName = names.length > 1 ? names[0] : "";
      await apiClient.put("/user-profile", { firstName, lastName });
    } catch (err) {
      console.warn("Backend updateName error, fallback to mock", err);
    }
    return profileService.updateName(name);
  },
  async getProfile() {
    try {
      const res = await apiClient.get("/user-profile");
      return res.data;
    } catch {
      return null;
    }
  },
};

