import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { AudioPlayer } from "@/components/verse/audio-player";
import { ReadingTimer } from "@/components/verse/reading-timer";
import { VerseActions } from "@/components/verse/verse-actions";
import { getCurrentUser } from "@/lib/auth/guards";
import {
  getVerseNeighbors,
  getVerseProgress,
  getVerseWithChapter,
  verseLabel,
} from "@/lib/data/content";

export async function generateMetadata({
  params,
}: PageProps<"/verses/[verseId]">): Promise<Metadata> {
  const { verseId } = await params;
  const result = await getVerseWithChapter(verseId);
  if (!result) return { title: "श्लोक सापडला नाही", robots: { index: false } };

  const { verse, chapter } = result;
  const label = verseLabel(verse);
  return {
    title: `श्लोक ${chapter.chapter_number}.${label}`,
    description:
      verse.translation?.slice(0, 150) ??
      `भगवद्गीता अध्याय ${chapter.chapter_number}, श्लोक ${label}.`,
  };
}

/** A titled content block, shown only when the field has content. */
function Section({
  heading,
  children,
  lang,
}: {
  heading: string;
  children: React.ReactNode;
  lang?: string;
}) {
  return (
    <section className="border-t border-rule pt-5">
      <h2 className="mb-2 font-devanagari text-sm font-semibold uppercase tracking-wide text-accent">
        {heading}
      </h2>
      <div className="prose-marathi text-ink-muted" lang={lang}>
        {children}
      </div>
    </section>
  );
}

const toDevanagari = (n: number) =>
  String(n).replace(/[0-9]/g, (d) => "०१२३४५६७८९"[Number(d)]);

export default async function VersePage({ params }: PageProps<"/verses/[verseId]">) {
  const { verseId } = await params;

  const result = await getVerseWithChapter(verseId);
  if (!result) notFound();

  const { verse, chapter } = result;
  const [user, progress, neighbors] = await Promise.all([
    getCurrentUser(),
    getVerseProgress(verseId),
    getVerseNeighbors(verse.chapter_id, verse.display_order),
  ]);

  const label = verseLabel(verse);

  return (
    <article className="mx-auto max-w-reading">
      {/* Reading timer only for signed-in users; anonymous writes would be
          rejected by RLS anyway. */}
      {user && <ReadingTimer verseId={verse.id} />}

      <header>
        <Link
          href={`/chapters/${chapter.chapter_number}`}
          className="rounded text-sm text-accent underline underline-offset-4"
        >
          ← अध्याय {toDevanagari(chapter.chapter_number)}: {chapter.name_marathi}
        </Link>
        <h1 className="mt-2 font-devanagari text-2xl text-ink">
          श्लोक {toDevanagari(chapter.chapter_number)}.{label}
        </h1>
      </header>

      {/* Sanskrit verse */}
      <div className="mt-6 rounded-lg border border-rule bg-surface px-5 py-6">
        <p className="verse-text text-center text-ink" lang="sa">
          {verse.sanskrit_text}
        </p>
      </div>

      {/* Audio */}
      <div className="mt-4">
        <AudioPlayer src={verse.audio_url} />
      </div>

      {/* Actions (signed-in only) */}
      {user && (
        <div className="mt-6">
          <VerseActions
            verseId={verse.id}
            initialRead={progress?.is_read ?? false}
            initialMemorized={progress?.is_memorized ?? false}
          />
        </div>
      )}
      {!user && (
        <p className="mt-6 rounded border border-rule bg-accent-soft/20 px-4 py-3 text-sm text-ink-muted">
          प्रगती नोंदवण्यासाठी{" "}
          <Link href="/login" className="font-medium text-accent underline underline-offset-4">
            प्रवेश करा
          </Link>
          .
        </p>
      )}

      {/* Content sections, each shown only if present */}
      <div className="mt-8 space-y-5">
        {verse.word_to_word && (
          <Section heading="शब्दार्थ">{verse.word_to_word}</Section>
        )}
        {verse.translation && (
          <Section heading="भाषांतर">{verse.translation}</Section>
        )}
        {verse.purport && <Section heading="भावार्थ">{verse.purport}</Section>}
        {verse.easy_explanation && (
          <Section heading="सोपे स्पष्टीकरण">{verse.easy_explanation}</Section>
        )}
        {verse.example && <Section heading="उदाहरण">{verse.example}</Section>}
      </div>

      {/* Prev / next */}
      <nav className="mt-10 flex items-center justify-between border-t border-rule pt-5">
        {neighbors.prevId ? (
          <Link
            href={`/verses/${neighbors.prevId}`}
            className="inline-flex items-center gap-1 rounded text-sm text-accent underline underline-offset-4"
          >
            <ChevronLeft className="size-4" /> मागील श्लोक
          </Link>
        ) : (
          <span />
        )}
        {neighbors.nextId ? (
          <Link
            href={`/verses/${neighbors.nextId}`}
            className="inline-flex items-center gap-1 rounded text-sm text-accent underline underline-offset-4"
          >
            पुढील श्लोक <ChevronRight className="size-4" />
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </article>
  );
}
