import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Pencil, Plus, ScrollText } from "lucide-react";

import {
  ChapterPublishToggle,
  DeleteChapterButton,
} from "@/components/admin/content-row-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getChapters } from "@/lib/data/content";

export const metadata: Metadata = {
  title: "अध्याय व्यवस्थापन",
  robots: { index: false, follow: false },
};

const toDevanagari = (n: number) =>
  String(n).replace(/[0-9]/g, (d) => "०१२३४५६७८९"[Number(d)]);

export default async function AdminChaptersPage() {
  const chapters = await getChapters();

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-devanagari text-2xl text-ink">अध्याय</h1>
          <p className="mt-1 text-sm text-ink-muted">अध्याय तयार करा आणि त्यांची माहिती संपादित करा.</p>
        </div>
        <Button asChild>
          <Link href="/admin/chapters/new">
            <Plus className="size-4" /> नवीन
          </Link>
        </Button>
      </header>

      {chapters.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="अद्याप अध्याय नाहीत"
          description="पहिला अध्याय जोडण्यासाठी ‘नवीन’ वर क्लिक करा."
        />
      ) : (
        <ul className="space-y-3">
          {chapters.map((c) => (
            <li key={c.id}>
              <Card>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-devanagari font-medium text-ink">
                      {toDevanagari(c.chapter_number)}. {c.name_marathi}
                    </p>
                    <p className="text-sm text-ink-subtle">
                      {toDevanagari(c.total_verses)} श्लोक · {c.name_sanskrit}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <ChapterPublishToggle chapterId={c.id} published={c.is_published} />
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/verses?chapter=${c.id}`}>
                        <ScrollText className="size-4" /> श्लोक
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm" aria-label="संपादित करा">
                      <Link href={`/admin/chapters/${c.id}`}>
                        <Pencil className="size-4" />
                      </Link>
                    </Button>
                    <DeleteChapterButton chapterId={c.id} name={c.name_marathi} />
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
