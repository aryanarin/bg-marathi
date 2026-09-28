import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Native tsconfig `paths` resolution (the `vite-tsconfig-paths` plugin is no
  // longer needed in Vite 8), so `@/...` imports resolve in tests.
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    // Playwright owns `tests/e2e`. Keep Vitest away from it so the two runners
    // never try to execute each other's specs.
    include: ["src/**/*.test.{ts,tsx}", "tests/unit/**/*.test.{ts,tsx}"],
    exclude: ["tests/e2e/**", "node_modules/**", ".next/**"],
  },
});
