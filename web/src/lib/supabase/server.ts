import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/lib/database.types";
import { env } from "@/lib/env";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 *
 * Still the anon key, so RLS remains in force: this client acts strictly as the
 * signed-in user. `cookies()` is async in Next.js 16, which also means reading
 * it opts the route into dynamic rendering. That is exactly what we want for
 * per-user pages, since it guarantees no authenticated page is ever statically
 * cached or shared between users.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components cannot set cookies: HTTP does not allow it once
            // streaming has started. This is expected and safe to ignore,
            // because proxy.ts refreshes the session on every request. Server
            // Actions and Route Handlers *can* set cookies, and there this
            // branch never runs.
          }
        },
      },
    },
  );
}
