import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { env, getServiceRoleKey } from "@/lib/env";

/**
 * Privileged Supabase client. BYPASSES Row Level Security.
 *
 * Only use this where the operation genuinely cannot be expressed as the
 * signed-in user, and only after an explicit `requireAdmin()` check in the
 * calling code. Current legitimate uses:
 *
 *   - content import scripts (no user session exists)
 *   - admin reads across all users' progress
 *
 * Do NOT reach for this to work around an RLS policy that feels inconvenient;
 * fix the policy instead. The `server-only` import above makes bundling this
 * into client code a build error.
 */
export function createAdminClient() {
  return createSupabaseClient(env.NEXT_PUBLIC_SUPABASE_URL, getServiceRoleKey(), {
    auth: {
      // No session persistence or refresh: this client is stateless and
      // request-scoped, never tied to a browser session.
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
