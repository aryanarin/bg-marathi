import "server-only";

import { cache } from "react";

import { getCurrentUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type {
  PublicQuizQuestion,
  Quiz,
  QuizAnswer,
  QuizAttempt,
} from "@/lib/types";

/**
 * Quiz data access.
 *
 * Reads go through the anon-key server client under RLS. Crucially, the learner
 * select on quiz_questions is column-restricted at the database level, so the
 * answer key (correct_option, explanation) is never returned here before
 * submission. Scoring is done by the submit_quiz_attempt() database function.
 */

/** Published quizzes, newest first. */
export const getPublishedQuizzes = cache(async (): Promise<Quiz[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("quizzes")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as Quiz[] | null) ?? [];
});

export const getQuiz = cache(async (quizId: string): Promise<Quiz | null> => {
  const supabase = await createClient();
  const { data } = await supabase.from("quizzes").select("*").eq("id", quizId).maybeSingle();
  return (data as Quiz | null) ?? null;
});

/**
 * Questions for a quiz, WITHOUT the answer key.
 *
 * The explicit column list matches the RLS grant for the authenticated role.
 * Even if this list were wrong, the database would reject a request for
 * correct_option — this is defence in depth, not the only guard.
 */
export const getQuizQuestions = cache(
  async (quizId: string): Promise<PublicQuizQuestion[]> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("quiz_questions")
      .select(
        "id, quiz_id, question, option_a, option_b, option_c, option_d, display_order, created_at, updated_at",
      )
      .eq("quiz_id", quizId)
      .order("display_order", { ascending: true });
    return (data as PublicQuizQuestion[] | null) ?? [];
  },
);

/** The current user's attempts for a quiz, newest first. */
export const getUserAttempts = cache(
  async (quizId: string): Promise<QuizAttempt[]> => {
    const user = await getCurrentUser();
    if (!user) return [];

    const supabase = await createClient();
    const { data } = await supabase
      .from("quiz_attempts")
      .select("*")
      .eq("quiz_id", quizId)
      .eq("user_id", user.id)
      .order("started_at", { ascending: false });
    return (data as QuizAttempt[] | null) ?? [];
  },
);

/** One attempt by id, if it belongs to the current user (enforced by RLS). */
export const getAttempt = cache(
  async (attemptId: string): Promise<QuizAttempt | null> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("quiz_attempts")
      .select("*")
      .eq("id", attemptId)
      .maybeSingle();
    return (data as QuizAttempt | null) ?? null;
  },
);

/**
 * Answers recorded for a completed attempt. After submission the learner may
 * read their own answers (RLS allows it), including whether each was correct.
 */
export const getAttemptAnswers = cache(
  async (attemptId: string): Promise<QuizAnswer[]> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("quiz_answers")
      .select("*")
      .eq("attempt_id", attemptId);
    return (data as QuizAnswer[] | null) ?? [];
  },
);

/**
 * After submission, the question text + the correct option, assembled for the
 * result page. The correct option comes from the scorer's output, which is why
 * the result page passes it in rather than selecting it here (learners still
 * cannot read correct_option directly).
 */
export const getQuizWithQuestions = cache(
  async (quizId: string): Promise<{ quiz: Quiz; questions: PublicQuizQuestion[] } | null> => {
    const quiz = await getQuiz(quizId);
    if (!quiz) return null;
    const questions = await getQuizQuestions(quizId);
    return { quiz, questions };
  },
);
