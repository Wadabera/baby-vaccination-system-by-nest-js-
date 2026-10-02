import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

/**
 * Dev-only proxy target. Not used in a production build.
 *
 * In production the frontend calls the API directly at `VITE_API_URL`, which
 * Vite inlines into the bundle at build time. That variable must be set in the
 * Vercel dashboard, because Vite reads it while building — a value added to
 * the running app would be too late.
 */
const BACKEND_URL = process.env.VITE_BACKEND_URL ?? "http://localhost:5000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Fail the deploy rather than shipping a bundle that cannot reach the API.
    // A production build with no VITE_API_URL falls back to the relative
    // "/api", which silently 404s once the app is on a different domain.
    outDir: "dist",
    sourcemap: false,
    chunkSizeWarningLimit: 900,
  },
  server: {
    port: 3000,
    // Proxy /api to the NestJS backend so the browser makes same-origin
    // requests in development and CORS never comes into play.
    proxy: {
      "/api": {
        target: BACKEND_URL,
        changeOrigin: true,
      },
    },
  },
});
