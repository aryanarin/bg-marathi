import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Auth callback.
 *
 * Supabase email links (confirmation, password recovery) redirect here with a
 * `code` to exchange for a session. This must be a Route Handler, not a page,
 * because it sets session cookies.
 *
 * `next` is validated to be a same-site relative path, so a crafted link cannot
 * turn this into an open redirect.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");
  const next = nextParam && nextParam.startsWith("/") ? nextParam : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // No code, or exchange failed (expired/used link).
  return NextResponse.redirect(`${origin}/login?error=link_invalid`);
}
