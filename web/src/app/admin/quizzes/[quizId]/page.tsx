import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";

import { AddQuestionForm } from "@/components/admin/add-question-form";
import { QuizForm } from "@/components/admin/quiz-form";
import { DeleteQuestionButton, QuizPublishToggle } from "@/components/admin/quiz-row-actions";
import { Card, CardContent } from "@/components/ui/card";
import { addQuestion, upsertQuiz } from "@/lib/data/admin-quiz-actions";
import { getQuizForAdmin } from "@/lib/data/admin-quizzes";
import type { QuizOption } from "@/lib/types";

export const metadata: Metadata = {
  title: "प्रश्नमंजुषा संपादन",
  robots: { index: false, follow: false },
};

const toDevanagari = (n: number) =>
  String(n).replace(/[0-9]/g, (d) => "०१२३४५६७८९"[Number(d)]);

export default async function AdminQuizDetailPage({
  params,
}: PageProps<"/admin/quizzes/[quizId]">) {
  const { quizId } = await params;
  const result = await getQuizForAdmin(quizId);
  if (!result) notFound();

  const { quiz, questions } = result;
  const quizAction = upsertQuiz.bind(null, quizId);
  const questionAction = addQuestion.bind(null, quizId);

  const optionLabels: Record<QuizOption, string> = {
    a: "अ",
    b: "ब",
    c: "क",
    d: "ड",
  };

  return (
    <div className="mx-auto max-w-reading space-y-8">
      <header>
        <Link href="/admin/quizzes" className="rounded text-sm text-accent underline underline-offset-4">
          ← प्रश्नमंजुषा
        </Link>
        <div className="mt-2 flex items-center justify-between gap-3">
          <h1 className="font-devanagari text-2xl text-ink">{quiz.title}</h1>
          <QuizPublishToggle quizId={quiz.id} published={quiz.is_published} />
        </div>
      </header>

      <section aria-labelledby="details">
        <h2 id="details" className="mb-3 font-devanagari text-lg font-semibold text-ink">
          तपशील
        </h2>
        <QuizForm action={quizAction} initial={quiz} submitLabel="तपशील जतन करा" />
      </section>

      <section aria-labelledby="questions">
        <h2 id="questions" className="mb-3 font-devanagari text-lg font-semibold text-ink">
          प्रश्न ({toDevanagari(questions.length)})
        </h2>

        {questions.length > 0 && (
          <ol className="mb-6 space-y-3">
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
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-devanagari font-medium text-ink">
                          {toDevanagari(index + 1)}. {q.question}
                        </p>
                        <DeleteQuestionButton questionId={q.id} quizId={quiz.id} />
                      </div>
                      <ul className="mt-2 space-y-1 text-sm">
                        {options.map(([key, text]) => {
                          const correct = key === q.correct_option;
                          return (
                            <li
                              key={key}
                              className={
                                correct
                                  ? "flex items-center gap-1.5 font-medium text-success"
                                  : "flex items-center gap-1.5 text-ink-muted"
                              }
                            >
                              <span className="font-devanagari">{optionLabels[key]}.</span>
                              <span className="prose-marathi">{text}</span>
                              {correct && <Check className="size-3.5" aria-label="बरोबर उत्तर" />}
                            </li>
                          );
                        })}
                      </ul>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ol>
        )}

        <Card>
          <CardContent className="p-5">
            <h3 className="mb-3 font-devanagari font-medium text-ink">नवीन प्रश्न जोडा</h3>
            <AddQuestionForm action={questionAction} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
