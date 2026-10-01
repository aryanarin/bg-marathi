"use client";

import { useState, useTransition } from "react";

import { submitQuizAttempt } from "@/lib/data/quiz-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PublicQuizQuestion, QuizOption } from "@/lib/types";

/**
 * Quiz attempt form.
 *
 * Holds the learner's selections in local state and submits them to the server
 * action, which invokes the database scorer. The answer key is never present on
 * the client, so correctness cannot be peeked at before submission.
 */
export function QuizAttemptForm({
  quizId,
  attemptId,
  questions,
}: {
  quizId: string;
  attemptId: string;
  questions: PublicQuizQuestion[];
}) {
  const [answers, setAnswers] = useState<Record<string, QuizOption>>({});
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const answeredCount = Object.keys(answers).length;

  function select(questionId: string, option: QuizOption) {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  }

  function onSubmit() {
    setError(null);
    const payload = questions.map((q) => ({
      question_id: q.id,
      selected_option: answers[q.id] ?? null,
    }));
    startTransition(async () => {
      try {
        await submitQuizAttempt(attemptId, quizId, payload);
      } catch {
        setError("उत्तरे सबमिट करता आली नाहीत. कृपया पुन्हा प्रयत्न करा.");
      }
    });
  }

  return (
    <div className="space-y-5">
      <ol className="space-y-4">
        {questions.map((q, index) => {
          const options: Array<[QuizOption, string]> = [
            ["a", q.option_a],
            ["b", q.option_b],
            ["c", q.option_c],
            ["d", q.option_d],
          ];
          return (
            <li key={q.id}>
              <Card>
                <CardContent className="p-5">
                  <fieldset>
                    <legend className="font-devanagari text-base font-medium text-ink">
                      {toDevanagari(index + 1)}. {q.question}
                    </legend>
                    <div className="mt-3 space-y-2">
                      {options.map(([key, text]) => {
                        const selected = answers[q.id] === key;
                        return (
                          <label
                            key={key}
                            className={cn(
                              "flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5 text-sm transition-colors",
                              selected
                                ? "border-accent bg-accent-soft/40 text-ink"
                                : "border-rule bg-surface text-ink-muted hover:bg-surface-2",
                            )}
                          >
                            <input
                              type="radio"
                              name={q.id}
                              value={key}
                              checked={selected}
                              onChange={() => select(q.id, key)}
                              className="mt-0.5 accent-[var(--color-accent)]"
                            />
                            <span className="prose-marathi">{text}</span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ol>

      {error && (
        <p className="rounded border border-danger bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      <div className="sticky bottom-16 z-10 flex items-center justify-between gap-3 rounded-lg border border-rule bg-surface/95 px-4 py-3 backdrop-blur-sm md:bottom-0">
        <span className="text-sm text-ink-muted">
          {toDevanagari(answeredCount)} / {toDevanagari(questions.length)} उत्तरित
        </span>
        <Button type="button" onClick={onSubmit} disabled={pending}>
          {pending ? "सबमिट करत आहे…" : "सबमिट करा"}
        </Button>
      </div>
    </div>
  );
}

function toDevanagari(n: number): string {
  return String(n).replace(/[0-9]/g, (d) => "०१२३४५६७८९"[Number(d)]);
}
