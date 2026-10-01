import type { Metadata } from "next";
import Link from "next/link";

import { VerseForm } from "@/components/admin/verse-form";
import { upsertVerse } from "@/lib/data/admin-content-actions";
import { getChapters } from "@/lib/data/content";

export const metadata: Metadata = {
  title: "नवीन श्लोक",
  robots: { index: false, follow: false },
};

export default async function NewVersePage({
  searchParams,
}: PageProps<"/admin/verses/new">) {
  const params = await searchParams;
  const defaultChapterId = typeof params.chapter === "string" ? params.chapter : undefined;
  const chapters = await getChapters();
  const action = upsertVerse.bind(null, null);

  return (
    <div className="mx-auto max-w-reading space-y-6">
      <header>
        <Link href="/admin/verses" className="rounded text-sm text-accent underline underline-offset-4">
          ← श्लोक
        </Link>
        <h1 className="mt-2 font-devanagari text-2xl text-ink">नवीन श्लोक</h1>
      </header>
      <VerseForm
        action={action}
        chapters={chapters}
        defaultChapterId={defaultChapterId}
        submitLabel="श्लोक जतन करा"
      />
    </div>
  );
}
