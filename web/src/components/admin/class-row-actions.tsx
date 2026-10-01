"use client";

import { useTransition } from "react";
import { Eye, EyeOff, Trash2 } from "lucide-react";

import { deleteClass, setClassPublished } from "@/lib/data/admin-class-actions";
import { Button } from "@/components/ui/button";

/** Publish/unpublish toggle for a class row. */
export function PublishToggle({ classId, published }: { classId: string; published: boolean }) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => start(() => setClassPublished(classId, !published))}
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

/** Delete control with a confirm step. */
export function DeleteClassButton({ classId, title }: { classId: string; title: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      aria-label={`${title} हटवा`}
      onClick={() => {
        if (confirm(`"${title}" हटवायचे? ही क्रिया पूर्ववत होणार नाही.`)) {
          start(() => deleteClass(classId));
        }
      }}
    >
      <Trash2 className="size-4 text-danger" />
    </Button>
  );
}
