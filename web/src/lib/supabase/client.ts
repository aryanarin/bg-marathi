import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/database.types";
import { env } from "@/lib/env";

/**
 * Supabase client for Client Components.
 *
 * Uses the anon key only. Every query it makes is filtered by Row Level
 * Security, so this client can never read or write data the signed-in user is
 * not entitled to, regardless of what the browser asks for.
 */
export function createClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
