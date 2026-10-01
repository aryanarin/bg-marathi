import type { Metadata } from "next";
import Link from "next/link";
import { TrendingUp } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress-bar";
import { getChapterProgress } from "@/lib/data/summary";
import { getProgressSummary } from "@/lib/data/summary";
import { formatDuration } from "@/lib/utils";

export const metadata: Metadata = {
  title: "प्रगती",
  robots: { index: false, follow: false },
};

const toDevanagari = (n: number) =>
  String(n).replace(/[0-9]/g, (d) => "०१२३४५६७८९"[Number(d)]);

export default async function ProgressPage() {
  const [chapters, summary] = await Promise.all([
    getChapterProgress(),
    getProgressSummary(),
  ]);

  const hasChapters = chapters.length > 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-devanagari text-2xl text-ink">आपली प्रगती</h1>
        <p className="mt-1 text-ink-muted prose-marathi">
          अध्यायानुसार वाचलेले आणि पाठ केलेले श्लोक.
        </p>
      </header>

      {!hasChapters ? (
        <EmptyState
          icon={TrendingUp}
          title="अद्याप प्रगती नोंदवली नाही"
          description="श्लोक वाचल्यावर आणि पाठ केल्यावर आपली प्रगती येथे दिसेल."
        />
      ) : (
        <>
          <Card>
            <CardContent className="grid grid-cols-3 gap-3 p-5 text-center">
              <div>
                <p className="text-xl font-semibold tabular-nums text-ink">
                  {toDevanagari(summary.verses_read)}
                </p>
                <p className="font-devanagari text-xs text-ink-muted">वाचलेले</p>
              </div>
              <div>
                <p className="text-xl font-semibold tabular-nums text-ink">
                  {toDevanagari(summary.verses_memorized)}
                </p>
                <p className="font-devanagari text-xs text-ink-muted">पाठ केलेले</p>
              </div>
              <div>
                <p className="text-xl font-semibold tabular-nums text-ink">
                  {formatDuration(summary.total_time_seconds)}
                </p>
                <p className="font-devanagari text-xs text-ink-muted">वेळ</p>
              </div>
            </CardContent>
          </Card>

          <section aria-label="अध्यायानुसार प्रगती" className="space-y-3">
            {chapters.map((c) => (
              <Link
                key={c.id}
                href={`/chapters/${c.chapter_number}`}
                className="block rounded-lg focus-visible:ring-2 focus-visible:ring-accent"
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-devanagari font-medium text-ink">
                        {toDevanagari(c.chapter_number)}. {c.name_marathi}
                      </p>
                      <span className="shrink-0 text-sm text-ink-subtle tabular-nums">
                        {toDevanagari(c.verses_read)} / {toDevanagari(c.total_verses)}
                      </span>
                    </div>
                    <div className="mt-2">
                      <ProgressBar
                        value={c.verses_read}
                        total={c.total_verses}
                        label={`अध्याय ${c.chapter_number} वाचन`}
                        showText={false}
                      />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
