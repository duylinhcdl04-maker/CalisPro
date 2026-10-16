import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8081",
        changeOrigin: true,
      },
      // Thông báo realtime (WebSocket)
      "/ws": {
        target: "http://localhost:8081",
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-query": ["@tanstack/react-query", "axios"],
          "vendor-forms": ["react-hook-form", "zod", "@hookform/resolvers"],
          "vendor-charts": ["recharts"],
          "vendor-motion": ["motion"],
          "vendor-radix": [
            "@radix-ui/react-slot",
            "@radix-ui/react-dialog",
            "@radix-ui/react-tabs",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-label",
            "@radix-ui/react-progress",
            "@radix-ui/react-avatar",
          ],
        },
      },
    },
  },
});
