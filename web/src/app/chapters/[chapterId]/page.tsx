import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookOpen } from "lucide-react";

import { Container } from "@/components/layout/container";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { EmptyState } from "@/components/ui/empty-state";
import { VerseRow } from "@/components/verse/verse-row";
import { getChapterByNumber, getChapterVerses } from "@/lib/data/content";

const toDevanagari = (n: number) =>
  String(n).replace(/[0-9]/g, (d) => "०१२३४५६७८९"[Number(d)]);

export async function generateMetadata({
  params,
}: PageProps<"/chapters/[chapterId]">): Promise<Metadata> {
  const { chapterId } = await params;
  const chapter = await getChapterByNumber(Number(chapterId));
  if (!chapter) return { title: "अध्याय सापडला नाही" };

  return {
    title: `अध्याय ${chapter.chapter_number}: ${chapter.name_marathi}`,
    description:
      chapter.description ??
      `श्रीमद्भगवद्गीता अध्याय ${chapter.chapter_number} — ${chapter.name_sanskrit}.`,
  };
}

export default async function ChapterDetailPage({
  params,
}: PageProps<"/chapters/[chapterId]">) {
  const { chapterId } = await params;
  const chapterNumber = Number(chapterId);
  if (!Number.isInteger(chapterNumber)) notFound();

  const chapter = await getChapterByNumber(chapterNumber);
  if (!chapter) notFound();

  const verses = await getChapterVerses(chapter.id);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        <Container width="default" className="py-8">
          <header className="border-b border-rule-gold pb-6">
            <p className="font-devanagari text-sm text-ink-subtle">
              अध्याय {toDevanagari(chapter.chapter_number)}
            </p>
            <h1 className="mt-1 font-devanagari text-3xl text-ink">
              {chapter.name_marathi}
            </h1>
            <p className="mt-1 text-lg text-ink-muted" lang="sa">
              {chapter.name_sanskrit}
            </p>
            {chapter.description && (
              <p className="mt-4 text-ink-muted prose-marathi">{chapter.description}</p>
            )}
          </header>

          <section aria-label="श्लोक" className="mt-6">
            {verses.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="या अध्यायातील श्लोक अद्याप उपलब्ध नाहीत"
                description="मजकूर तयार होताच श्लोक येथे दिसतील."
              />
            ) : (
              <ul className="space-y-3">
                {verses.map((v) => (
                  <li key={v.id}>
                    <VerseRow verse={v} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </Container>
      </main>

      <SiteFooter />
    </div>
  );
}
