import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ChapterForm } from "@/components/admin/chapter-form";
import { upsertChapter } from "@/lib/data/admin-content-actions";
import { getChapters } from "@/lib/data/content";

export const metadata: Metadata = {
  title: "अध्याय संपादन",
  robots: { index: false, follow: false },
};

export default async function EditChapterPage({
  params,
}: PageProps<"/admin/chapters/[chapterId]">) {
  const { chapterId } = await params;
  const chapters = await getChapters();
  const chapter = chapters.find((c) => c.id === chapterId);
  if (!chapter) notFound();

  const action = upsertChapter.bind(null, chapterId);

  return (
    <div className="mx-auto max-w-reading space-y-6">
      <header>
        <Link href="/admin/chapters" className="rounded text-sm text-accent underline underline-offset-4">
          ← अध्याय
        </Link>
        <h1 className="mt-2 font-devanagari text-2xl text-ink">अध्याय संपादन</h1>
      </header>
      <ChapterForm action={action} initial={chapter} submitLabel="बदल जतन करा" />
    </div>
  );
}
