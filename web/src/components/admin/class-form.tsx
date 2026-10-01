"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import type { ActionState } from "@/lib/data/admin-class-actions";
import type { ClassSession } from "@/lib/types";

/**
 * Create/edit form for a class. Bound to a Server Action passed in by the page,
 * so the same form serves both new and edit flows.
 */
export function ClassForm({
  action,
  initial,
  submitLabel,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  initial?: ClassSession;
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
        <Input id="title" name="title" defaultValue={initial?.title} required />
      </Field>

      <Field label="वर्णन (ऐच्छिक)" htmlFor="description" error={state.fieldErrors?.description?.[0]}>
        <textarea
          id="description"
          name="description"
          defaultValue={initial?.description ?? ""}
          rows={3}
          className="w-full rounded border border-rule bg-canvas px-3 py-2 text-base text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="तारीख" htmlFor="class_date" error={state.fieldErrors?.class_date?.[0]}>
          <Input id="class_date" name="class_date" type="date" defaultValue={initial?.class_date} required />
        </Field>
        <Field label="वेळ" htmlFor="class_time" error={state.fieldErrors?.class_time?.[0]}>
          <Input
            id="class_time"
            name="class_time"
            type="time"
            defaultValue={initial?.class_time?.slice(0, 5)}
            required
          />
        </Field>
      </div>

      <Field label="माध्यम" htmlFor="meeting_platform" error={state.fieldErrors?.meeting_platform?.[0]}>
        <select
          id="meeting_platform"
          name="meeting_platform"
          defaultValue={initial?.meeting_platform ?? "google_meet"}
          className="h-11 w-full rounded border border-rule bg-canvas px-3 text-base text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <option value="google_meet">Google Meet</option>
          <option value="zoom">Zoom</option>
          <option value="other">इतर</option>
        </select>
      </Field>

      <Field
        label="मीटिंग लिंक"
        htmlFor="meeting_url"
        hint="https:// ने सुरू होणारी पूर्ण लिंक"
        error={state.fieldErrors?.meeting_url?.[0]}
      >
        <Input
          id="meeting_url"
          name="meeting_url"
          type="url"
          inputMode="url"
          defaultValue={initial?.meeting_url}
          placeholder="https://meet.google.com/..."
          required
        />
      </Field>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          name="is_published"
          defaultChecked={initial?.is_published ?? false}
          className="size-4 accent-[var(--color-accent)]"
        />
        आता प्रकाशित करा (वापरकर्त्यांना दिसेल)
      </label>

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "जतन करत आहे…" : submitLabel}
      </Button>
    </form>
  );
}
