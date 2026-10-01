"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";

import { deleteChapter } from "@/lib/data/admin-content-actions";
import { deleteVerse } from "@/lib/data/admin-content-actions";
import { Button } from "@/components/ui/button";

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
