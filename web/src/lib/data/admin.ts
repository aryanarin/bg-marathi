import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { ClassSession } from "@/lib/types";

/**
 * Admin data access.
 *
 * Uses the anon-key server client. The caller must have passed requireAdmin()
 * first; the `is_admin()` RLS policies then permit the cross-user reads below.
 * We do NOT use the service-role client in request handling — it bypasses RLS
 * and is reserved for offline scripts.
 */

export interface AdminStats {
  totalUsers: number;
  versesRead: number;
  versesMemorized: number;
  publishedQuizzes: number;
  nextClass: ClassSession | null;
}

/** Count rows matching a query using head+exact for efficiency. */
async function countOf(
  table: "profiles" | "verse_progress" | "quizzes",
  apply?: (q: ReturnType<Awaited<ReturnType<typeof createClient>>["from"]>) => unknown,
): Promise<number> {
  const supabase = await createClient();
  let query = supabase.from(table).select("*", { count: "exact", head: true });
  if (apply) query = apply(query) as typeof query;
  const { count } = await query;
  return count ?? 0;
}

export const getAdminStats = cache(async (): Promise<AdminStats> => {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [
    totalUsers,
    versesRead,
    versesMemorized,
    publishedQuizzes,
    { data: nextClassRows },
  ] = await Promise.all([
    countOf("profiles"),
    countOf("verse_progress", (q) => q.eq("is_read", true)),
    countOf("verse_progress", (q) => q.eq("is_memorized", true)),
    countOf("quizzes", (q) => q.eq("is_published", true)),
    supabase
      .from("classes")
      .select("*")
      .eq("is_published", true)
      .gte("class_date", today)
      .order("class_date", { ascending: true })
      .order("class_time", { ascending: true })
      .limit(1),
  ]);

  return {
    totalUsers,
    versesRead,
    versesMemorized,
    publishedQuizzes,
    nextClass: (nextClassRows as ClassSession[] | null)?.[0] ?? null,
  };
});
