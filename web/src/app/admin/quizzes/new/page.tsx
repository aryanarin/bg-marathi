import type { Metadata } from "next";
import Link from "next/link";

import { QuizForm } from "@/components/admin/quiz-form";
import { upsertQuiz } from "@/lib/data/admin-quiz-actions";

export const metadata: Metadata = {
  title: "नवीन प्रश्नमंजुषा",
  robots: { index: false, follow: false },
};

export default function NewQuizPage() {
  const action = upsertQuiz.bind(null, null);
  return (
    <div className="mx-auto max-w-reading space-y-6">
      <header>
        <Link href="/admin/quizzes" className="rounded text-sm text-accent underline underline-offset-4">
          ← प्रश्नमंजुषा
        </Link>
        <h1 className="mt-2 font-devanagari text-2xl text-ink">नवीन प्रश्नमंजुषा</h1>
        <p className="mt-1 text-sm text-ink-subtle">
          जतन केल्यानंतर पुढील पानावर प्रश्न जोडता येतील.
        </p>
      </header>
      <QuizForm action={action} submitLabel="तयार करा आणि प्रश्न जोडा" />
    </div>
  );
}
