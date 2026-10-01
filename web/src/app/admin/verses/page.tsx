import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Plus, ScrollText } from "lucide-react";

import { DeleteVerseButton } from "@/components/admin/content-row-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getChapters, verseLabel } from "@/lib/data/content";
import { getVersesForChapter } from "@/lib/data/admin-verses";

export const metadata: Metadata = {
  title: "श्लोक व्यवस्थापन",
  robots: { index: false, follow: false },
};

export default async function AdminVersesPage({
  searchParams,
}: PageProps<"/admin/verses">) {
  const params = await searchParams;
  const chapterId = typeof params.chapter === "string" ? params.chapter : undefined;

  const chapters = await getChapters();
  const selected = chapterId ? chapters.find((c) => c.id === chapterId) : chapters[0];
  const verses = selected ? await getVersesForChapter(selected.id) : [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-devanagari text-2xl text-ink">श्लोक</h1>
          <p className="mt-1 text-sm text-ink-muted">अध्यायानुसार श्लोक जोडा आणि संपादित करा.</p>
        </div>
        {selected && (
          <Button asChild>
            <Link href={`/admin/verses/new?chapter=${selected.id}`}>
              <Plus className="size-4" /> नवीन श्लोक
            </Link>
          </Button>
        )}
      </header>

      {chapters.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="आधी अध्याय तयार करा"
          description="श्लोक जोडण्यापूर्वी किमान एक अध्याय आवश्यक आहे."
          action={
            <Button asChild>
              <Link href="/admin/chapters/new">अध्याय जोडा</Link>
            </Button>
          }
        />
      ) : (
        <>
          {/* Chapter picker */}
          <div className="flex flex-wrap gap-2">
            {chapters.map((c) => (
              <Link
                key={c.id}
                href={`/admin/verses?chapter=${c.id}`}
                aria-current={selected?.id === c.id ? "page" : undefined}
                className={
                  selected?.id === c.id
                    ? "rounded-md bg-accent-soft px-3 py-1.5 text-sm font-medium text-accent"
                    : "rounded-md border border-rule px-3 py-1.5 text-sm text-ink-muted hover:bg-surface-2"
                }
              >
                {c.chapter_number}
              </Link>
            ))}
          </div>

          {verses.length === 0 ? (
            <EmptyState
              icon={ScrollText}
              title="या अध्यायात अद्याप श्लोक नाहीत"
              description="पहिला श्लोक जोडण्यासाठी ‘नवीन श्लोक’ वर क्लिक करा."
            />
          ) : (
            <ul className="space-y-2">
              {verses.map((v) => (
                <li key={v.id}>
                  <Card>
                    <CardContent className="flex items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="font-devanagari text-sm font-medium text-ink">
                          श्लोक {verseLabel(v)}
                        </p>
                        <p className="truncate text-sm text-ink-subtle" lang="sa">
                          {v.sanskrit_text}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {!v.audio_url && (
                          <span className="rounded bg-surface-2 px-1.5 py-0.5 text-xs text-ink-subtle">
                            ऑडिओ नाही
                          </span>
                        )}
                        <Button asChild variant="ghost" size="sm" aria-label="संपादित करा">
                          <Link href={`/admin/verses/${v.id}`}>
                            <Pencil className="size-4" />
                          </Link>
                        </Button>
                        <DeleteVerseButton verseId={v.id} label={verseLabel(v)} />
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
