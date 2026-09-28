import type { Metadata } from "next";
import { BookOpen, Clock, GraduationCap, Sparkles } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "मुख्यपृष्ठ",
  robots: { index: false, follow: false },
};

/**
 * PHASE 1: shell only.
 *
 * Real figures require the schema (Phase 2) and the progress system (Phase 5).
 * The stat cards render zeroes rather than invented numbers, so nothing here is
 * misleading while the data layer is built.
 */
const stats = [
  { icon: BookOpen, label: "वाचलेले श्लोक", value: "0" },
  { icon: Sparkles, label: "पाठ केलेले श्लोक", value: "0" },
  { icon: Clock, label: "अभ्यासाचा वेळ", value: "0 min" },
  { icon: GraduationCap, label: "पूर्ण अध्याय", value: "0" },
] as const;

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-devanagari text-2xl text-ink">हरे कृष्ण</h1>
        <p className="mt-1 text-ink-muted prose-marathi">
          आजचा अभ्यास सुरू करा.
        </p>
      </header>

      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">
          आपली आकडेवारी
        </h2>

        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map(({ icon: Icon, label, value }) => (
            <li key={label}>
              <Card>
                <CardContent className="p-4 pt-4">
                  <Icon
                    className="size-5 text-gold-dark"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                  <p className="mt-2 text-2xl font-semibold tabular-nums text-ink">
                    {value}
                  </p>
                  <p className="mt-0.5 text-sm text-ink-muted font-devanagari">
                    {label}
                  </p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="continue-heading">
        <h2
          id="continue-heading"
          className="mb-3 font-devanagari text-lg font-semibold text-ink"
        >
          अभ्यास सुरू ठेवा
        </h2>
        <EmptyState
          icon={BookOpen}
          title="अद्याप अभ्यास सुरू झालेला नाही"
          description="मजकूर उपलब्ध होताच पहिल्या अध्यायापासून सुरुवात करा."
        />
      </section>
    </div>
  );
}
