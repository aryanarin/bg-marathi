"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import type { ActionState } from "@/lib/data/admin-quiz-actions";
import type { Quiz } from "@/lib/types";

export function QuizForm({
  action,
  initial,
  submitLabel,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  initial?: Quiz;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.error && (
        <p className="rounded border border-danger bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
          {state.error}
        </p>
      )}

      <Field label="शीर्षक" htmlFor="title" error={state.fieldErrors?.title?.[0]}>
        <Input id="title" name="title" lang="mr" defaultValue={initial?.title} required />
      </Field>

      <Field label="वर्णन (ऐच्छिक)" htmlFor="description" error={state.fieldErrors?.description?.[0]}>
        <textarea
          id="description"
          name="description"
          lang="mr"
          rows={3}
          defaultValue={initial?.description ?? ""}
          className="w-full rounded border border-rule bg-canvas px-3 py-2 text-base text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
      </Field>

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "जतन करत आहे…" : submitLabel}
      </Button>
    </form>
  );
}
