import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { profileApi } from "./api";
import type { PrivacyConsent } from "../../types";

export function usePrivacyConsentQuery() {
  return useQuery({ queryKey: ["privacy-consent"], queryFn: profileApi.getPrivacyConsent });
}

export function useUpdatePrivacyConsentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (next: Partial<PrivacyConsent>) => profileApi.updatePrivacyConsent(next),
    onSuccess: (data) => queryClient.setQueryData(["privacy-consent"], data),
  });
}

export function useSessionQuery() {
  return useQuery({ queryKey: ["session-info"], queryFn: profileApi.getSession });
}

export function useChangePasswordMutation() {
  return useMutation({ mutationFn: profileApi.changePassword });
}

export function useUpdateNameMutation() {
  return useMutation({ mutationFn: profileApi.updateName });
}
