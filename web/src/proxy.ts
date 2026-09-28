import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy-session";

/**
 * Next.js 16 renamed `middleware.ts` to `proxy.ts`. It always runs on the
 * Node.js runtime; setting a `runtime` config here throws.
 *
 * Responsibilities, in order of importance:
 *   1. Refresh the Supabase auth session cookie on every request.
 *   2. Optimistically redirect unauthenticated visitors away from private routes.
 *
 * This is NOT the authorization boundary. See lib/supabase/proxy-session.ts and
 * docs/architecture.md for why, and lib/auth/guards.ts for what is.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  /**
   * Run on everything except static assets and files with an extension.
   *
   * Auth benefits from running broadly: the session refresh needs to happen on
   * any navigation. Excluding `_next/static`, `_next/image` and the favicon
   * keeps us off the hot path for assets that never carry a session.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|robots.txt|sitemap.xml|images/|fonts/).*)",
  ],
};
