import { notFound, redirect } from "next/navigation";

import { QuizAttemptForm } from "@/components/quiz/quiz-attempt-form";
import { requireUser } from "@/lib/auth/guards";
import { getAttempt, getQuiz, getQuizQuestions } from "@/lib/data/quizzes";

export const metadata = { robots: { index: false, follow: false } };

export default async function QuizAttemptPage({
  params,
}: PageProps<"/quizzes/[quizId]/attempt/[attemptId]">) {
  await requireUser();
  const { quizId, attemptId } = await params;

  const [quiz, attempt] = await Promise.all([getQuiz(quizId), getAttempt(attemptId)]);
  if (!quiz || !attempt || attempt.quiz_id !== quizId) notFound();

  // A finished attempt is immutable; send the learner to the result instead of
  // letting them re-answer. The database also refuses writes to it.
  if (attempt.completed_at !== null) {
    redirect(`/quizzes/${quizId}/attempt/${attemptId}/result`);
  }

  const questions = await getQuizQuestions(quizId);
  if (questions.length === 0) notFound();

  return (
    <div className="mx-auto max-w-reading space-y-5">
      <header>
        <h1 className="font-devanagari text-2xl text-ink">{quiz.title}</h1>
        <p className="mt-1 text-sm text-ink-subtle">
          प्रत्येक प्रश्नाचे एक उत्तर निवडा आणि शेवटी सबमिट करा.
        </p>
      </header>

      <QuizAttemptForm quizId={quizId} attemptId={attemptId} questions={questions} />
    </div>
  );
}
