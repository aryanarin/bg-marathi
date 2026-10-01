import type { Metadata } from "next";
import Link from "next/link";
import { ListChecks, Pencil, Plus } from "lucide-react";

import { DeleteQuizButton, QuizPublishToggle } from "@/components/admin/quiz-row-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getAllQuizzes } from "@/lib/data/admin-quizzes";

export const metadata: Metadata = {
  title: "प्रश्नमंजुषा व्यवस्थापन",
  robots: { index: false, follow: false },
};

export default async function AdminQuizzesPage() {
  const quizzes = await getAllQuizzes();

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-devanagari text-2xl text-ink">प्रश्नमंजुषा</h1>
          <p className="mt-1 text-sm text-ink-muted">प्रश्नमंजुषा तयार करा, प्रश्न जोडा आणि प्रकाशित करा.</p>
        </div>
        <Button asChild>
          <Link href="/admin/quizzes/new">
            <Plus className="size-4" /> नवीन
          </Link>
        </Button>
      </header>

      {quizzes.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="अद्याप प्रश्नमंजुषा नाहीत"
          description="पहिली प्रश्नमंजुषा तयार करण्यासाठी ‘नवीन’ वर क्लिक करा."
        />
      ) : (
        <ul className="space-y-3">
          {quizzes.map((q) => (
            <li key={q.id}>
              <Card>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-devanagari font-medium text-ink">{q.title}</p>
                    {q.description && (
                      <p className="truncate text-sm text-ink-subtle">{q.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <QuizPublishToggle quizId={q.id} published={q.is_published} />
                    <Button asChild variant="ghost" size="sm" aria-label="संपादित करा">
                      <Link href={`/admin/quizzes/${q.id}`}>
                        <Pencil className="size-4" />
                      </Link>
                    </Button>
                    <DeleteQuizButton quizId={q.id} title={q.title} />
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
