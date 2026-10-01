import Link from "next/link";
import { BookOpen, Check, Sparkles } from "lucide-react";

import { verseLabel } from "@/lib/data/content";
import type { VerseListItem } from "@/lib/types";
import { cn } from "@/lib/utils";

/** A tappable verse row for the chapter page. */
export function VerseRow({ verse }: { verse: VerseListItem }) {
  return (
    <Link
      href={`/verses/${verse.id}`}
      className={cn(
        "flex items-start gap-3 rounded-lg border border-rule bg-surface p-4",
        "transition-colors hover:bg-accent-soft/20 focus-visible:ring-2 focus-visible:ring-accent",
      )}
    >
      <span
        className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft/50 font-devanagari text-sm font-semibold text-ink"
        aria-hidden="true"
      >
        {verseLabel(verse)}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block font-devanagari text-sm text-ink-muted">
          श्लोक {verseLabel(verse)}
        </span>
        {verse.preview && (
          <span className="mt-0.5 line-clamp-2 block text-sm text-ink-subtle prose-marathi">
            {verse.preview}
          </span>
        )}
      </span>

      <span className="flex shrink-0 items-center gap-1.5">
        {verse.is_read && (
          <Check className="size-4 text-success" aria-label="वाचले" />
        )}
        {verse.is_memorized && (
          <Sparkles className="size-4 text-accent" aria-label="पाठ केले" />
        )}
        {!verse.is_read && !verse.is_memorized && (
          <BookOpen className="size-4 text-ink-subtle/40" aria-hidden="true" />
        )}
      </span>
    </Link>
  );
}
