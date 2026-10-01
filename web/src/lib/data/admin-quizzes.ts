import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { Quiz, QuizQuestion } from "@/lib/types";

/**
 * Admin quiz reads. Admins may read unpublished quizzes AND the full question
 * rows including correct_option/explanation: the column grant revokes those
 * from learners, but the is_admin() path and service-role are unaffected.
 * Here the caller has passed requireAdmin() and reads via the anon client,
 * which an admin's own policies permit for the quizzes table; for the answer
 * key columns we rely on the admin role's table-level grant.
 */

export const getAllQuizzes = cache(async (): Promise<Quiz[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("quizzes")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as Quiz[] | null) ?? [];
});

export const getQuizForAdmin = cache(
  async (quizId: string): Promise<{ quiz: Quiz; questions: QuizQuestion[] } | null> => {
    const supabase = await createClient();
    const { data: quiz } = await supabase.from("quizzes").select("*").eq("id", quizId).maybeSingle();
    if (!quiz) return null;

    const { data: questions } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq("quiz_id", quizId)
      .order("display_order", { ascending: true });

    return {
      quiz: quiz as Quiz,
      questions: (questions as QuizQuestion[] | null) ?? [],
    };
  },
);
