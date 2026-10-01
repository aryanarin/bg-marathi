"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import type { ActionState } from "@/lib/data/admin-content-actions";
import type { Chapter } from "@/lib/types";

export function ChapterForm({
  action,
  initial,
  submitLabel,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  initial?: Chapter;
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

      <div className="grid grid-cols-2 gap-3">
        <Field label="अध्याय क्रमांक" htmlFor="chapter_number" error={state.fieldErrors?.chapter_number?.[0]}>
          <Input
            id="chapter_number"
            name="chapter_number"
            type="number"
            min={1}
            max={18}
            defaultValue={initial?.chapter_number}
            required
          />
        </Field>
        <Field label="एकूण श्लोक" htmlFor="total_verses" error={state.fieldErrors?.total_verses?.[0]}>
          <Input
            id="total_verses"
            name="total_verses"
            type="number"
            min={1}
            defaultValue={initial?.total_verses}
            required
          />
        </Field>
      </div>

      <Field label="संस्कृत नाव" htmlFor="name_sanskrit" error={state.fieldErrors?.name_sanskrit?.[0]}>
        <Input id="name_sanskrit" name="name_sanskrit" lang="sa" defaultValue={initial?.name_sanskrit} required />
      </Field>

      <Field label="मराठी नाव" htmlFor="name_marathi" error={state.fieldErrors?.name_marathi?.[0]}>
        <Input id="name_marathi" name="name_marathi" lang="mr" defaultValue={initial?.name_marathi} required />
      </Field>

      <Field label="वर्णन (ऐच्छिक)" htmlFor="description" error={state.fieldErrors?.description?.[0]}>
        <textarea
          id="description"
          name="description"
          lang="mr"
          rows={4}
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
