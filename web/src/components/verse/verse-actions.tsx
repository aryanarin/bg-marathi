"use client";

import { Check, Sparkles } from "lucide-react";
import { useState, useTransition } from "react";

import { toggleMemorized, toggleRead } from "@/lib/data/progress-actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The two progress actions on the verse page.
 *
 * Optimistic: the button reflects the new state immediately, then the Server
 * Action persists it (idempotent upsert, so no duplicate rows). On failure the
 * state reverts. Marking memorized also marks read, matching the server rule.
 */
export function VerseActions({
  verseId,
  initialRead,
  initialMemorized,
}: {
  verseId: string;
  initialRead: boolean;
  initialMemorized: boolean;
}) {
  const [read, setRead] = useState(initialRead);
  const [memorized, setMemorized] = useState(initialMemorized);
  const [pending, startTransition] = useTransition();

  function onToggleRead() {
    const next = !read;
    setRead(next);
    if (!next) setMemorized(false);
    startTransition(async () => {
      try {
        await toggleRead(verseId, next);
      } catch {
        setRead(!next); // revert
      }
    });
  }

  function onToggleMemorized() {
    const next = !memorized;
    setMemorized(next);
    if (next) setRead(true);
    startTransition(async () => {
      try {
        await toggleMemorized(verseId, next);
      } catch {
        setMemorized(!next); // revert
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button
        type="button"
        variant={read ? "sacred" : "outline"}
        fullWidth
        onClick={onToggleRead}
        disabled={pending}
        aria-pressed={read}
        className={cn(read && "border-success")}
      >
        <Check className={cn("size-5", read ? "text-success" : "text-ink-subtle")} />
        {read ? "वाचन पूर्ण झाले" : "वाचन पूर्ण झाले म्हणून खुणा करा"}
      </Button>

      <Button
        type="button"
        variant={memorized ? "sacred" : "outline"}
        fullWidth
        onClick={onToggleMemorized}
        disabled={pending}
        aria-pressed={memorized}
        className={cn(memorized && "border-accent")}
      >
        <Sparkles className={cn("size-5", memorized ? "text-accent" : "text-ink-subtle")} />
        {memorized ? "पाठ झाले" : "पाठ झाले म्हणून खुणा करा"}
      </Button>
    </div>
  );
}
