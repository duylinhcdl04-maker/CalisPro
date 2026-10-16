import { useMutation } from "@tanstack/react-query";
import { useAuth } from "./AuthContext";
import type { RegisterPayload } from "./api";

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object") {
    const err = error as { response?: { data?: { message?: string; error?: string } }; message?: string };
    if (err.response?.data?.message) {
      return err.response.data.message;
    }
    if (err.message) {
      return err.message;
    }
  }
  return fallback;
}

export function useLoginMutation() {
  const { login } = useAuth();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => login(email, password),
  });
}

export function useRegisterMutation() {
  const { register } = useAuth();
  return useMutation({
    mutationFn: (payload: RegisterPayload) => register(payload),
  });
}

export function useVerifyOtpMutation() {
  const { verifyOtp } = useAuth();
  return useMutation({
    mutationFn: ({ email, otp }: { email: string; otp: string }) => verifyOtp(email, otp),
  });
}

export function useResendOtpMutation() {
  const { resendOtp } = useAuth();
  return useMutation({
    mutationFn: (email: string) => resendOtp(email),
  });
}
