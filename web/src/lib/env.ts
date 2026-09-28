import { z } from "zod";

/**
 * Environment variable validation.
 *
 * Validation is LAZY, on first property access, rather than at module load.
 * That is deliberate: `next build` imports every module, and an eager check
 * would make the build fail on a machine that has not yet been given Supabase
 * credentials. Failing on first *use* still catches misconfiguration well
 * before a user sees a confusing error, without coupling the build to secrets.
 */

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_URL is required")
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url("NEXT_PUBLIC_SITE_URL must be a valid URL")
    .default("http://localhost:3000"),
});

type PublicEnv = z.infer<typeof publicSchema>;

let cached: PublicEnv | null = null;

function readPublicEnv(): PublicEnv {
  if (cached) return cached;

  // Each variable is referenced statically so that Next.js can inline the
  // NEXT_PUBLIC_ values into the browser bundle at build time. `process.env`
  // cannot be spread or iterated for this reason.
  const parsed = publicSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.message}`).join("\n");
    throw new Error(
      `Invalid or missing public environment variables:\n${issues}\n\n` +
        `Copy .env.example to .env.local and fill in the values. See docs/setup.md.`,
    );
  }

  cached = parsed.data;
  return cached;
}

/**
 * Validated public environment. Safe on both server and client.
 *
 * A Proxy defers validation to first property read, so merely importing this
 * module is side-effect free.
 */
export const env: PublicEnv = new Proxy({} as PublicEnv, {
  get(_target, prop: string) {
    return readPublicEnv()[prop as keyof PublicEnv];
  },
});

/**
 * Whether Supabase credentials are present, without throwing.
 *
 * Lets the application boot and serve public pages before Supabase has been
 * configured, which matters for local development, CI and the first deploy.
 *
 * Callers must treat "not configured" as **no session** (fail closed), never as
 * an authenticated user. A misconfigured production deploy then denies access
 * rather than exposing data.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/**
 * The public site origin, without a trailing slash.
 *
 * Falls back to localhost so that metadata, `sitemap.ts` and `robots.ts` can be
 * generated during a build that has no environment configured yet.
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

/**
 * The service-role key bypasses Row Level Security completely.
 *
 * Throws if reached from the browser. That is a deliberate tripwire: should a
 * refactor ever pull this into a Client Component, the app fails immediately
 * and visibly instead of leaking a root-equivalent credential.
 */
export function getServiceRoleKey(): string {
  if (typeof window !== "undefined") {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY must never be read in the browser. " +
        "This code path is server-only.",
    );
  }

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. It is required for admin operations " +
        "and content import. See docs/setup.md.",
    );
  }

  return key;
}
