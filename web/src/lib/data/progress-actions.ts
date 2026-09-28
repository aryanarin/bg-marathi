"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { clampSessionSeconds, MIN_SESSION_SECONDS } from "@/lib/validation/schemas";

/**
 * Progress Server Actions.
 *
 * Each verifies the user itself (Server Actions are reachable as plain POSTs).
 * The heavy lifting is in Postgres functions that run as the calling user under
 * RLS: set_verse_progress upserts idempotently (no duplicate rows), and
 * record_reading_session clamps the duration in-database.
 */

export async function toggleRead(verseId: string, isRead: boolean): Promise<void> {
  const user = await requireUser();
  const supabase = await createClient();

  await supabase.rpc("set_verse_progress", {
    p_verse_id: verseId,
    p_is_read: isRead,
    // Omit p_is_memorized to leave it unchanged (the SQL function coalesces).
  });

  revalidatePath(`/verses/${verseId}`);
  revalidatePath("/dashboard");
  revalidatePath("/progress");
  void user;
}

export async function toggleMemorized(
  verseId: string,
  isMemorized: boolean,
): Promise<void> {
  await requireUser();
  const supabase = await createClient();

  // Memorizing a verse implies it has been read: set both so the two states
  // never contradict each other. When un-memorizing, leave is_read unchanged
  // (omit the arg) rather than forcing it.
  await supabase.rpc("set_verse_progress", {
    p_verse_id: verseId,
    ...(isMemorized ? { p_is_read: true } : {}),
    p_is_memorized: isMemorized,
  });

  revalidatePath(`/verses/${verseId}`);
  revalidatePath("/dashboard");
  revalidatePath("/progress");
}

/**
 * Record time spent reading a verse. The client reports elapsed seconds; the
 * value is clamped here and again by the column check in the database, so a
 * tab left open overnight cannot inflate learning time.
 */
export async function recordReadingTime(
  verseId: string,
  seconds: number,
): Promise<void> {
  const clamped = clampSessionSeconds(seconds);
  if (clamped < MIN_SESSION_SECONDS) return; // not worth recording

  await requireUser();
  const supabase = await createClient();

  await supabase.rpc("record_reading_session", {
    p_verse_id: verseId,
    p_duration: clamped,
  });

  revalidatePath("/dashboard");
  revalidatePath("/progress");
}
