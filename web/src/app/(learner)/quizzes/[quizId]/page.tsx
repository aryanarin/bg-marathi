import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListChecks } from "lucide-react";

import { StartQuizButton } from "@/components/quiz/start-quiz-button";
import { Card, CardContent } from "@/components/ui/card";
import { getQuiz, getQuizQuestions, getUserAttempts } from "@/lib/data/quizzes";

export async function generateMetadata({
  params,
}: PageProps<"/quizzes/[quizId]">): Promise<Metadata> {
  const { quizId } = await params;
  const quiz = await getQuiz(quizId);
  return {
    title: quiz?.title ?? "प्रश्नमंजुषा",
    robots: { index: false, follow: false },
  };
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("mr-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

export default async function QuizIntroPage({
  params,
}: PageProps<"/quizzes/[quizId]">) {
  const { quizId } = await params;

  const quiz = await getQuiz(quizId);
  if (!quiz) notFound();

  const [questions, attempts] = await Promise.all([
    getQuizQuestions(quizId),
    getUserAttempts(quizId),
  ]);

  const completed = attempts.filter((a) => a.completed_at !== null);

  return (
    <div className="mx-auto max-w-reading space-y-6">
      <header>
        <Link
          href="/quizzes"
          className="rounded text-sm text-accent underline underline-offset-4"
        >
          ← सर्व प्रश्नमंजुषा
        </Link>
        <h1 className="mt-2 font-devanagari text-2xl text-ink">{quiz.title}</h1>
        {quiz.description && (
          <p className="mt-1 text-ink-muted prose-marathi">{quiz.description}</p>
        )}
      </header>

      <Card>
        <CardContent className="flex flex-col items-start gap-4 p-5">
          <p className="flex items-center gap-2 text-sm text-ink-muted">
            <ListChecks className="size-4 text-accent" aria-hidden="true" />
            {toDevanagari(questions.length)} प्रश्न
          </p>

          {questions.length === 0 ? (
            <p className="text-sm text-ink-subtle">
              या प्रश्नमंजुषेत अद्याप प्रश्न जोडलेले नाहीत.
            </p>
          ) : (
            <StartQuizButton
              quizId={quiz.id}
              label={completed.length > 0 ? "पुन्हा प्रयत्न करा" : "सुरू करा"}
            />
          )}
        </CardContent>
      </Card>

      {completed.length > 0 && (
        <section aria-labelledby="history">
          <h2 id="history" className="mb-3 font-devanagari text-lg font-semibold text-ink">
            मागील प्रयत्न
          </h2>
          <ul className="space-y-2">
            {completed.map((attempt) => (
              <li key={attempt.id}>
                <Link
                  href={`/quizzes/${quiz.id}/attempt/${attempt.id}/result`}
                  className="flex items-center justify-between rounded-lg border border-rule bg-surface px-4 py-3 text-sm transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <span className="text-ink-muted">
                    {attempt.completed_at && formatDateTime(attempt.completed_at)}
                  </span>
                  <span className="font-semibold tabular-nums text-ink">
                    {toDevanagari(attempt.score)} / {toDevanagari(attempt.total_questions)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function toDevanagari(n: number): string {
  return String(n).replace(/[0-9]/g, (d) => "०१२३४५६७८९"[Number(d)]);
}
