"use client";

import { useTransition } from "react";
import { Eye, EyeOff, Trash2 } from "lucide-react";

import {
  deleteChapter,
  deleteVerse,
  setChapterPublished,
} from "@/lib/data/admin-content-actions";
import { Button } from "@/components/ui/button";

/**
 * Publish/unpublish a whole chapter. An unpublished chapter and all its verses
 * are hidden from learners (enforced by RLS), so the admin can finish auditing
 * before revealing it.
 */
export function ChapterPublishToggle({
  chapterId,
  published,
}: {
  chapterId: string;
  published: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => start(() => setChapterPublished(chapterId, !published))}
    >
      {published ? (
        <>
          <Eye className="size-4 text-success" /> प्रकाशित
        </>
      ) : (
        <>
          <EyeOff className="size-4 text-ink-subtle" /> मसुदा
        </>
      )}
    </Button>
  );
}

export function DeleteChapterButton({ chapterId, name }: { chapterId: string; name: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      aria-label={`${name} हटवा`}
      onClick={() => {
        if (confirm(`"${name}" आणि त्यातील सर्व श्लोक हटवायचे? ही क्रिया पूर्ववत होणार नाही.`)) {
          start(() => deleteChapter(chapterId));
        }
      }}
    >
      <Trash2 className="size-4 text-danger" />
    </Button>
  );
}

export function DeleteVerseButton({ verseId, label }: { verseId: string; label: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      aria-label={`श्लोक ${label} हटवा`}
      onClick={() => {
        if (confirm(`श्लोक ${label} हटवायचा?`)) {
          start(() => deleteVerse(verseId));
        }
      }}
    >
      <Trash2 className="size-4 text-danger" />
    </Button>
  );
}
