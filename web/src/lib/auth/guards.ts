import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/types";

/**
 * Authorization boundary (Data Access Layer).
 *
 * Every page, Server Action and Route Handler that touches private data calls
 * one of these guards. Proxy redirects are a convenience, not a guarantee:
 * Server Actions are reachable as plain POST requests, so each one must verify
 * for itself. Layouts are also unsuitable, since they do not re-render on every
 * navigation and do not control whether child segments run.
 *
 * `cache()` dedupes the lookup within a single render pass, so calling
 * `requireUser()` in both a page and its data loader costs one round trip.
 */

export interface AuthenticatedUser {
  id: string;
  email: string;
  profile: Profile;
}

/**
 * Current user, or null when signed out. Does not redirect.
 *
 * Use for pages that render differently but legitimately for both states, such
 * as the public chapter list.
 */
export const getCurrentUser = cache(async (): Promise<AuthenticatedUser | null> => {
  // Fail closed when Supabase is not configured: nobody is signed in. This lets
  // public pages render before setup without pretending anyone is authenticated.
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();

  // `getUser()` validates the JWT against the auth server. Never trust
  // `getSession()` for an authorization decision: it only reads the cookie.
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  // A user without a profile row is in an inconsistent state. Treat as signed
  // out rather than inventing a default role.
  if (!profile) return null;

  return {
    id: user.id,
    email: user.email ?? profile.email,
    profile,
  };
});

/** Require a signed-in user, or redirect to /login. */
export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Require an administrator.
 *
 * The role is read from the `profiles` table server-side. It is never taken
 * from a request body, header, cookie or client-supplied value. The database
 * enforces the same rule independently: RLS forbids a user from changing their
 * own role, so a compromised client cannot self-promote.
 *
 * Non-admins are sent to /dashboard rather than /login: they are authenticated,
 * just not authorized, and a login prompt would be misleading.
 */
export async function requireAdmin(): Promise<AuthenticatedUser> {
  const user = await requireUser();
  if (user.profile.role !== "admin") redirect("/dashboard");
  return user;
}

/** Non-redirecting role check, for conditional UI. */
export async function hasRole(role: UserRole): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.profile.role === role;
}
