"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Route } from "next";

import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { getQuizQuestions } from "@/lib/data/quizzes";

/**
 * Quiz Server Actions.
 *
 * Scoring happens in the database function submit_quiz_attempt() under security
 * definer, because the answer-key column is not readable by learner accounts.
 * These actions only create an attempt and invoke the scorer; they never read
 * correct_option themselves.
 */

/**
 * Start an attempt and go to the attempt page. A learner may retake a quiz;
 * each start creates a new in-progress attempt. total_questions is recorded now
 * so the score denominator is fixed even if the quiz is later edited.
 */
export async function startQuizAttempt(quizId: string): Promise<void> {
  const user = await requireUser();
  const supabase = await createClient();

  const questions = await getQuizQuestions(quizId);
  if (questions.length === 0) {
    // Dynamic path from a runtime id; typedRoutes can't verify it statically.
    redirect(`/quizzes/${quizId}` as Route);
  }

  const { data, error } = await supabase
    .from("quiz_attempts")
    .insert({
      quiz_id: quizId,
      user_id: user.id,
      total_questions: questions.length,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error("प्रश्नमंजुषा सुरू करता आली नाही.");
  }

  redirect(`/quizzes/${quizId}/attempt/${data.id}` as Route);
}

/**
 * Submit an attempt. `answers` is the learner's selections; the database scorer
 * compares them to the key, writes quiz_answers rows, finalises the attempt
 * (sets completed_at, making it immutable), and returns the breakdown.
 */
export async function submitQuizAttempt(
  attemptId: string,
  quizId: string,
  answers: { question_id: string; selected_option: string | null }[],
): Promise<void> {
  await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.rpc("submit_quiz_attempt", {
    p_attempt_id: attemptId,
    p_answers: answers,
  });

  if (error) {
    throw new Error("उत्तरे सबमिट करता आली नाहीत.");
  }

  revalidatePath("/quizzes");
  revalidatePath("/dashboard");
  redirect(`/quizzes/${quizId}/attempt/${attemptId}/result` as Route);
}
