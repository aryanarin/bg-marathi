import type { Metadata } from "next";
import Link from "next/link";

import { ChapterForm } from "@/components/admin/chapter-form";
import { upsertChapter } from "@/lib/data/admin-content-actions";

export const metadata: Metadata = {
  title: "नवीन अध्याय",
  robots: { index: false, follow: false },
};

export default function NewChapterPage() {
  const action = upsertChapter.bind(null, null);
  return (
    <div className="mx-auto max-w-reading space-y-6">
      <header>
        <Link href="/admin/chapters" className="rounded text-sm text-accent underline underline-offset-4">
          ← अध्याय
        </Link>
        <h1 className="mt-2 font-devanagari text-2xl text-ink">नवीन अध्याय</h1>
      </header>
      <ChapterForm action={action} submitLabel="अध्याय जतन करा" />
    </div>
  );
}
