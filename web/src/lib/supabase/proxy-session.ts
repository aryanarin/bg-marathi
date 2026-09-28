import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { env, isSupabaseConfigured } from "@/lib/env";

/**
 * Refresh the Supabase auth session on each request.
 *
 * Supabase access tokens are short-lived. Without a refresh on the edge of the
 * request, a user reading a long purport would silently lose their session.
 * This runs in `proxy.ts`, which in Next.js 16 always uses the Node.js runtime.
 *
 * SECURITY: this performs an *optimistic* check only. It reads the session and
 * redirects unauthenticated visitors away from private routes to save a wasted
 * render. It is deliberately NOT the authorization boundary, because:
 *
 *   1. Proxy matchers also gate Server Actions (they POST to the route they are
 *      used on), so a matcher change could silently remove coverage.
 *   2. Proxy runs on prefetches, so it must stay cheap and avoid role lookups.
 *
 * The real boundary is Postgres RLS plus `requireUser()` / `requireAdmin()` in
 * the data access layer, which every page and Server Action calls.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  // Before Supabase is configured, there is no session to refresh. Treat the
  // visitor as signed out (fail closed) and let public pages render normally
  // rather than returning 500 for the whole site. A misconfigured production
  // deploy therefore denies access to private routes instead of exposing them.
  if (!isSupabaseConfigured()) {
    return handleRouting(request, response, false);
  }

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write refreshed tokens onto both the forwarded request and the
          // outgoing response, so this render and the browser agree.
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // `getUser()` rather than `getSession()`: it validates the token with the
  // Supabase auth server instead of trusting the cookie contents. This call is
  // what triggers the refresh.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return handleRouting(request, response, user !== null);
}

/** Route groups that require a signed-in user. */
const PRIVATE_PREFIXES = [
  "/dashboard",
  "/progress",
  "/quizzes",
  "/classes",
  "/verses",
  "/admin",
] as const;

/** Auth pages that a signed-in user has no reason to see. */
const AUTH_ONLY_PREFIXES = ["/login", "/register", "/forgot-password"] as const;

function handleRouting(
  request: NextRequest,
  response: NextResponse,
  isAuthenticated: boolean,
): NextResponse {
  const { pathname, search } = request.nextUrl;

  const isPrivate = PRIVATE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (isPrivate && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    // Preserve intent so the user lands where they were headed after signing in.
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  const isAuthOnly = AUTH_ONLY_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (isAuthOnly && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}
