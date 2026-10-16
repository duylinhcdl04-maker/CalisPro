import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { coachService } from "../services";
import type { AvailabilitySlot, ChangePasswordInput, CoachProfileInput, NotificationPreferences } from "../types";
import { coachKeys } from "./queryKeys";

export function useCoachDashboard() {
  return useQuery({ queryKey: coachKeys.dashboard(), queryFn: coachService.getDashboard });
}

export function useCoachProfile() {
  return useQuery({ queryKey: coachKeys.profile(), queryFn: coachService.getProfile });
}

export function useUpdateCoachProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CoachProfileInput) => coachService.updateProfile(input),
    onSuccess: (profile) => qc.setQueryData(coachKeys.profile(), profile),
  });
}

export function useCoachSettings() {
  return useQuery({ queryKey: coachKeys.settings(), queryFn: coachService.getSettings });
}

function useSettingsMutation<TVars>(fn: (vars: TVars) => ReturnType<typeof coachService.getSettings>) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: (settings) => qc.setQueryData(coachKeys.settings(), settings) });
}

export const useUpdateNotificationPreferences = () => useSettingsMutation((prefs: NotificationPreferences) => coachService.updateNotificationPreferences(prefs));
export const useUpdateAvailability = () => useSettingsMutation((slots: AvailabilitySlot[]) => coachService.updateAvailability(slots));
export const useSetTwoFactor = () => useSettingsMutation((enabled: boolean) => coachService.setTwoFactor(enabled));

export function useChangePassword() {
  return useMutation({ mutationFn: (input: ChangePasswordInput) => coachService.changePassword(input) });
}
