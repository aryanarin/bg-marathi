import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";

import { Container } from "@/components/layout/container";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress-bar";
import { getChaptersWithProgress } from "@/lib/data/content";
import { getCurrentUser } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "अध्याय",
  description:
    "श्रीमद्भगवद्गीतेचे सर्व अध्याय — प्रत्येक अध्यायातील श्लोक, शब्दार्थ, भाषांतर आणि भावार्थासह.",
};

const toDevanagari = (n: number) =>
  String(n).replace(/[0-9]/g, (d) => "०१२३४५६७८९"[Number(d)]);

export default async function ChaptersPage() {
  const [chapters, user] = await Promise.all([
    getChaptersWithProgress(),
    getCurrentUser(),
  ]);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        <Container width="default" className="py-10">
          <h1 className="font-devanagari text-3xl text-ink">अध्याय</h1>
          <p className="mt-2 text-ink-muted prose-marathi">
            श्रीमद्भगवद्गीतेचे अठरा अध्याय.
          </p>

          {chapters.length === 0 ? (
            <div className="mt-8">
              <EmptyState
                icon={BookOpen}
                title="अध्याय अद्याप उपलब्ध नाहीत"
                description="मजकूर तयार होताच अध्याय येथे दिसतील."
              />
            </div>
          ) : (
            <ul className="mt-8 space-y-3">
              {chapters.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/chapters/${c.chapter_number}`}
                    className="block rounded-lg border border-rule-gold bg-cream p-5 transition-colors hover:bg-gold-soft/20 focus-visible:ring-2 focus-visible:ring-saffron"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <h2 className="font-devanagari text-lg font-semibold text-ink">
                        {toDevanagari(c.chapter_number)}. {c.name_marathi}
                      </h2>
                      <span className="shrink-0 font-devanagari text-sm text-ink-subtle">
                        {toDevanagari(c.total_verses)} श्लोक
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-ink-subtle" lang="sa">
                      {c.name_sanskrit}
                    </p>

                    {user && (
                      <div className="mt-3">
                        <ProgressBar
                          value={c.verses_read}
                          total={c.total_verses}
                          label="वाचन प्रगती"
                        />
                      </div>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </main>

      <SiteFooter />
    </div>
  );
}
