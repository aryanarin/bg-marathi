import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, CalendarDays, Clock, ListChecks, Sparkles } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { getCurrentUser } from "@/lib/auth/guards";
import { getNextClass } from "@/lib/data/classes";
import { getProgressSummary, getRecentQuizResult } from "@/lib/data/summary";
import { formatDuration } from "@/lib/utils";

export const metadata: Metadata = {
  title: "मुख्यपृष्ठ",
  robots: { index: false, follow: false },
};

const toDevanagari = (n: number) =>
  String(n).replace(/[0-9]/g, (d) => "०१२३४५६७८९"[Number(d)]);

export default async function DashboardPage() {
  const [user, summary, nextClass, recent] = await Promise.all([
    getCurrentUser(),
    getProgressSummary(),
    getNextClass(),
    getRecentQuizResult(),
  ]);

  const firstName = user?.profile.full_name?.split(" ")[0];

  const stats = [
    { icon: BookOpen, label: "वाचलेले श्लोक", value: toDevanagari(summary.verses_read) },
    { icon: Sparkles, label: "पाठ केलेले श्लोक", value: toDevanagari(summary.verses_memorized) },
    { icon: Clock, label: "अभ्यासाचा वेळ", value: formatDuration(summary.total_time_seconds) },
  ] as const;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-devanagari text-2xl text-ink">
          हरे कृष्ण{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="mt-1 text-ink-muted prose-marathi">आजचा अभ्यास सुरू करा.</p>
      </header>

      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">
          आपली आकडेवारी
        </h2>
        <ul className="grid grid-cols-3 gap-3">
          {stats.map(({ icon: Icon, label, value }) => (
            <li key={label}>
              <Card>
                <CardContent className="p-4 pt-4">
                  <Icon className="size-5 text-accent" aria-hidden="true" />
                  <p className="mt-2 text-xl font-semibold tabular-nums text-ink sm:text-2xl">
                    {value}
                  </p>
                  <p className="mt-0.5 font-devanagari text-sm text-ink-muted">{label}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>

        {summary.total_verses > 0 && (
          <div className="mt-4">
            <ProgressBar
              value={summary.verses_read}
              total={summary.total_verses}
              label="एकूण वाचन प्रगती"
            />
          </div>
        )}
      </section>

      {nextClass && (
        <section aria-labelledby="class-heading">
          <h2 id="class-heading" className="mb-3 flex items-center gap-2 font-devanagari text-lg font-semibold text-ink">
            <CalendarDays className="size-5 text-accent" aria-hidden="true" />
            पुढील वर्ग
          </h2>
          <Link href="/classes" className="block rounded-lg focus-visible:ring-2 focus-visible:ring-accent">
            <Card>
              <CardContent className="p-5">
                <p className="font-devanagari font-medium text-ink">{nextClass.title}</p>
                <p className="mt-1 text-sm text-ink-muted">
                  {nextClass.class_date} · {nextClass.class_time?.slice(0, 5)}
                </p>
              </CardContent>
            </Card>
          </Link>
        </section>
      )}

      {recent && (
        <section aria-labelledby="quiz-heading">
          <h2 id="quiz-heading" className="mb-3 flex items-center gap-2 font-devanagari text-lg font-semibold text-ink">
            <ListChecks className="size-5 text-accent" aria-hidden="true" />
            अलीकडील प्रश्नमंजुषा निकाल
          </h2>
          <Card>
            <CardContent className="flex items-center justify-between gap-3 p-5">
              <p className="font-devanagari text-ink">{recent.quizTitle}</p>
              <span className="font-semibold tabular-nums text-ink">
                {toDevanagari(recent.attempt.score)} / {toDevanagari(recent.attempt.total_questions)}
              </span>
            </CardContent>
          </Card>
        </section>
      )}

      <section>
        <Link
          href="/chapters"
          className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-3 font-medium text-canvas transition-colors hover:bg-accent-hover"
        >
          <BookOpen className="size-5" aria-hidden="true" />
          अध्याय वाचा
        </Link>
      </section>
    </div>
  );
}
