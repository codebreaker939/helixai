import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const apiProxyTarget = process.env.VITE_API_PROXY_TARGET || "http://localhost:8000";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": apiProxyTarget,
      "/patients": apiProxyTarget,
      "/health": apiProxyTarget,
      "/metrics": apiProxyTarget,
      "/openapi.json": apiProxyTarget,
      "/docs": apiProxyTarget
    }
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    css: true
  }
});
