import { defineConfig } from "vitest/config";
import { config as loadEnv } from "dotenv";

// Integration tests hit the live Supabase project, so load .env.local.
loadEnv({ path: ".env.local" });

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    // Node environment: these talk to Postgres/PostgREST, no DOM needed.
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    // Live network calls; give them room and run serially to avoid seed races.
    testTimeout: 30_000,
    hookTimeout: 30_000,
    fileParallelism: false,
  },
});
