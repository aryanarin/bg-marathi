import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/**
 * Admin user reads.
 *
 * The is_admin() RLS policies let an admin read all profiles and all progress
 * rows. We aggregate per-user counts for the list, and per-chapter detail for
 * one user. Reads go through the anon client under those policies.
 */

export interface UserSummary {
  profile: Profile;
  versesRead: number;
  versesMemorized: number;
  totalTimeSeconds: number;
}

export const getUserSummaries = cache(async (): Promise<UserSummary[]> => {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (!profiles || profiles.length === 0) return [];

  // One progress read, aggregated in memory. Fine at study-group scale.
  const { data: progress } = await supabase
    .from("verse_progress")
    .select("user_id, is_read, is_memorized, total_time_seconds");

  const read = new Map<string, number>();
  const mem = new Map<string, number>();
  const time = new Map<string, number>();

  for (const row of progress ?? []) {
    if (row.is_read) read.set(row.user_id, (read.get(row.user_id) ?? 0) + 1);
    if (row.is_memorized) mem.set(row.user_id, (mem.get(row.user_id) ?? 0) + 1);
    time.set(row.user_id, (time.get(row.user_id) ?? 0) + (row.total_time_seconds ?? 0));
  }

  return (profiles as Profile[]).map((profile) => ({
    profile,
    versesRead: read.get(profile.id) ?? 0,
    versesMemorized: mem.get(profile.id) ?? 0,
    totalTimeSeconds: time.get(profile.id) ?? 0,
  }));
});

export const getUserDetail = cache(
  async (userId: string): Promise<UserSummary | null> => {
    const summaries = await getUserSummaries();
    return summaries.find((s) => s.profile.id === userId) ?? null;
  },
);
