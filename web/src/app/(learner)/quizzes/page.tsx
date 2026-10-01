import type { Metadata } from "next";
import Link from "next/link";
import { ListChecks } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getPublishedQuizzes } from "@/lib/data/quizzes";

export const metadata: Metadata = {
  title: "प्रश्नमंजुषा",
  robots: { index: false, follow: false },
};

export default async function QuizzesPage() {
  const quizzes = await getPublishedQuizzes();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-devanagari text-2xl text-ink">प्रश्नमंजुषा</h1>
        <p className="mt-1 text-ink-muted prose-marathi">
          वर्गानंतर उपलब्ध होणाऱ्या प्रश्नमंजुषा आणि आपले गुण.
        </p>
      </header>

      {quizzes.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="अद्याप प्रश्नमंजुषा उपलब्ध नाही"
          description="वर्ग झाल्यानंतर त्या श्लोकांवर आधारित प्रश्नमंजुषा येथे दिसेल."
        />
      ) : (
        <ul className="space-y-3">
          {quizzes.map((quiz) => (
            <li key={quiz.id}>
              <Link
                href={`/quizzes/${quiz.id}`}
                className="block rounded-lg border border-rule bg-surface p-5 transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-accent"
              >
                <Card className="border-0 bg-transparent shadow-none">
                  <CardContent className="p-0">
                    <h2 className="font-devanagari text-lg font-semibold text-ink">
                      {quiz.title}
                    </h2>
                    {quiz.description && (
                      <p className="mt-1 text-sm text-ink-muted prose-marathi">
                        {quiz.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
