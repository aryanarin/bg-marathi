import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { VerseForm } from "@/components/admin/verse-form";
import { upsertVerse } from "@/lib/data/admin-content-actions";
import { getChapters } from "@/lib/data/content";
import { getVerseById } from "@/lib/data/admin-verses";

export const metadata: Metadata = {
  title: "श्लोक संपादन",
  robots: { index: false, follow: false },
};

export default async function EditVersePage({
  params,
}: PageProps<"/admin/verses/[verseId]">) {
  const { verseId } = await params;
  const [verse, chapters] = await Promise.all([getVerseById(verseId), getChapters()]);
  if (!verse) notFound();

  const action = upsertVerse.bind(null, verseId);

  return (
    <div className="mx-auto max-w-reading space-y-6">
      <header>
        <Link
          href={`/admin/verses?chapter=${verse.chapter_id}`}
          className="rounded text-sm text-accent underline underline-offset-4"
        >
          ← श्लोक
        </Link>
        <h1 className="mt-2 font-devanagari text-2xl text-ink">श्लोक संपादन</h1>
      </header>
      <VerseForm action={action} chapters={chapters} initial={verse} submitLabel="बदल जतन करा" />
    </div>
  );
}
