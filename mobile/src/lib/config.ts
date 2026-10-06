/**
 * Public runtime configuration.
 *
 * These values are safe to ship in the client: the Supabase anon key only ever
 * acts as the signed-in user, and every request is filtered by row-level
 * security. We read them from EXPO_PUBLIC_* env vars (inlined at build time)
 * with a hardcoded fallback so the app runs even without a local .env.
 */

const FALLBACK_SUPABASE_URL = "https://mjavrqbierktlafrkoxu.supabase.co";
const FALLBACK_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qYXZycWJpZXJrdGxhZnJrb3h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1NTY1OTAsImV4cCI6MjEwNjEzMjU5MH0.3wqraTLzlg2Ixi8ckTDZU77gTqlQOulGcJpgJH3nm_0";
const FALLBACK_SITE_URL = "https://gita.bhakti.eu.org";

export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? FALLBACK_SUPABASE_URL;

export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? FALLBACK_SUPABASE_ANON_KEY;

export const SITE_URL = process.env.EXPO_PUBLIC_SITE_URL ?? FALLBACK_SITE_URL;
