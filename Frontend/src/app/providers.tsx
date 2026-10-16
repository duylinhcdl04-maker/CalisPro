import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider, theme as antdTheme } from "antd";
import { Toaster } from "sonner";
import { queryClient } from "./queryClient";
import { AuthProvider } from "../features/auth/AuthContext";
import { ThemeProvider, useTheme } from "../features/theme/ThemeProvider";

function ThemedProviders({ children }: { children: ReactNode }) {
  const { resolved } = useTheme();
  return (
    <ConfigProvider
      theme={{
        algorithm: resolved === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: "#0ea5e9",
          borderRadius: 16,
          fontFamily: '"Be Vietnam Pro", ui-sans-serif, system-ui, sans-serif',
          colorSuccess: "#0ea5e9",
          colorWarning: "#f59e0b",
          colorError: "#ef4444",
          colorInfo: "#38bdf8",
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
          <Toaster position="top-right" duration={3000} closeButton theme={resolved} />
        </AuthProvider>
      </QueryClientProvider>
    </ConfigProvider>
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ThemedProviders>{children}</ThemedProviders>
    </ThemeProvider>
  );
}
