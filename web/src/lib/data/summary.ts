import "server-only";

import { cache } from "react";

import { getCurrentUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type { ChapterWithProgress, ProgressSummary, QuizAttempt } from "@/lib/types";
import { getChaptersWithProgress } from "@/lib/data/content";

/**
 * Learner dashboard / progress aggregates for the signed-in user. All reads are
 * the user's own rows under RLS.
 */

export const getProgressSummary = cache(async (): Promise<ProgressSummary> => {
  const user = await getCurrentUser();
  const empty: ProgressSummary = {
    verses_read: 0,
    verses_memorized: 0,
    total_time_seconds: 0,
    total_verses: 0,
  };
  if (!user) return empty;

  const supabase = await createClient();

  const [{ data: progress }, { data: chapters }] = await Promise.all([
    supabase
      .from("verse_progress")
      .select("is_read, is_memorized, total_time_seconds")
      .eq("user_id", user.id),
    supabase.from("chapters").select("total_verses"),
  ]);

  const totalVerses = (chapters ?? []).reduce((sum, c) => sum + (c.total_verses ?? 0), 0);

  const summary = (progress ?? []).reduce<ProgressSummary>(
    (acc, row) => {
      if (row.is_read) acc.verses_read += 1;
      if (row.is_memorized) acc.verses_memorized += 1;
      acc.total_time_seconds += row.total_time_seconds ?? 0;
      return acc;
    },
    { ...empty, total_verses: totalVerses },
  );

  return summary;
});

/** Chapters with this user's progress, for the progress page. */
export const getChapterProgress = cache(async (): Promise<ChapterWithProgress[]> => {
  return getChaptersWithProgress();
});

/** The user's most recent completed quiz attempt, for the dashboard. */
export const getRecentQuizResult = cache(
  async (): Promise<{ attempt: QuizAttempt; quizTitle: string } | null> => {
    const user = await getCurrentUser();
    if (!user) return null;

    const supabase = await createClient();
    const { data } = await supabase
      .from("quiz_attempts")
      .select("*, quizzes(title)")
      .eq("user_id", user.id)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return null;

    const { quizzes, ...attempt } = data as QuizAttempt & { quizzes: { title: string } | null };
    return {
      attempt: attempt as QuizAttempt,
      quizTitle: quizzes?.title ?? "प्रश्नमंजुषा",
    };
  },
);
