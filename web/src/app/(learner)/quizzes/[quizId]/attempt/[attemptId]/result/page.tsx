import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, X } from "lucide-react";

import { requireUser } from "@/lib/auth/guards";
import {
  getAttempt,
  getAttemptAnswers,
  getQuiz,
  getQuizQuestions,
} from "@/lib/data/quizzes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn, percentage } from "@/lib/utils";
import type { QuizOption } from "@/lib/types";

export const metadata = { robots: { index: false, follow: false } };

const toDevanagari = (n: number) =>
  String(n).replace(/[0-9]/g, (d) => "०१२३४५६७८९"[Number(d)]);

export default async function QuizResultPage({
  params,
}: PageProps<"/quizzes/[quizId]/attempt/[attemptId]/result">) {
  await requireUser();
  const { quizId, attemptId } = await params;

  const [quiz, attempt] = await Promise.all([getQuiz(quizId), getAttempt(attemptId)]);
  if (!quiz || !attempt || attempt.quiz_id !== quizId) notFound();

  // Only completed attempts have a result.
  if (attempt.completed_at === null) {
    notFound();
  }

  const [questions, answers] = await Promise.all([
    getQuizQuestions(quizId),
    getAttemptAnswers(attemptId),
  ]);

  const answerByQuestion = new Map(answers.map((a) => [a.question_id, a]));
  const pct = percentage(attempt.score, attempt.total_questions);

  const optionText: Record<QuizOption, (q: (typeof questions)[number]) => string> = {
    a: (q) => q.option_a,
    b: (q) => q.option_b,
    c: (q) => q.option_c,
    d: (q) => q.option_d,
  };

  return (
    <div className="mx-auto max-w-reading space-y-6">
      <header className="text-center">
        <h1 className="font-devanagari text-2xl text-ink">{quiz.title}</h1>
        <p className="mt-1 text-sm text-ink-subtle">निकाल</p>

        <div className="mx-auto mt-5 flex max-w-xs flex-col items-center rounded-lg border border-rule bg-surface p-6">
          <span className="text-4xl font-bold tabular-nums text-ink">
            {toDevanagari(attempt.score)} / {toDevanagari(attempt.total_questions)}
          </span>
          <span className="mt-1 text-sm text-ink-muted">{toDevanagari(pct)}%</span>
        </div>
      </header>

      <section aria-label="प्रश्न आणि उत्तरे" className="space-y-3">
        {questions.map((q, index) => {
          const ans = answerByQuestion.get(q.id);
          const isCorrect = ans?.is_correct ?? false;
          const selected = ans?.selected_option ?? null;

          return (
            <Card key={q.id}>
              <CardContent className="p-5">
                <div className="flex items-start gap-2">
                  <span
                    className={cn(
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                      isCorrect ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
                    )}
                    aria-hidden="true"
                  >
                    {isCorrect ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                  </span>
                  <p className="font-devanagari font-medium text-ink">
                    {toDevanagari(index + 1)}. {q.question}
                  </p>
                </div>

                <dl className="mt-3 space-y-1 pl-7 text-sm">
                  <div className="flex gap-2">
                    <dt className="text-ink-subtle">तुमचे उत्तर:</dt>
                    <dd
                      className={cn(
                        "prose-marathi",
                        isCorrect ? "text-success" : "text-danger",
                      )}
                    >
                      {selected ? optionText[selected](q) : "— (रिक्त)"}
                    </dd>
                  </div>
                  <p className="sr-only">
                    {isCorrect ? "बरोबर" : "चूक"}
                  </p>
                </dl>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <div className="flex gap-3">
        <Button asChild variant="outline">
          <Link href={`/quizzes/${quizId}`}>पुन्हा प्रयत्न करा</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/quizzes">सर्व प्रश्नमंजुषा</Link>
        </Button>
      </div>
    </div>
  );
}
