"use client";

import { useActionState, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import type { ActionState } from "@/lib/data/admin-quiz-actions";

/**
 * Add-question form. On a successful add the action returns an empty state;
 * we clear the form so the next question can be typed immediately.
 */
export function AddQuestionForm({
  action,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    async (prev, fd) => {
      const result = await action(prev, fd);
      if (!result.error && !result.fieldErrors) formRef.current?.reset();
      return result;
    },
    {},
  );

  const options = [
    ["a", "पर्याय अ", "option_a"],
    ["b", "पर्याय ब", "option_b"],
    ["c", "पर्याय क", "option_c"],
    ["d", "पर्याय ड", "option_d"],
  ] as const;

  return (
    <form ref={formRef} action={formAction} className="space-y-4" noValidate>
      {state.error && (
        <p className="rounded border border-danger bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
          {state.error}
        </p>
      )}

      <Field label="प्रश्न" htmlFor="question" error={state.fieldErrors?.question?.[0]}>
        <textarea
          id="question"
          name="question"
          lang="mr"
          rows={2}
          required
          className="w-full rounded border border-rule bg-canvas px-3 py-2 text-base text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        {options.map(([key, label, name]) => (
          <Field key={key} label={label} htmlFor={name} error={state.fieldErrors?.[name]?.[0]}>
            <Input id={name} name={name} lang="mr" required />
          </Field>
        ))}
      </div>

      <Field label="बरोबर उत्तर" htmlFor="correct_option" error={state.fieldErrors?.correct_option?.[0]}>
        <select
          id="correct_option"
          name="correct_option"
          defaultValue="a"
          className="h-11 w-full rounded border border-rule bg-canvas px-3 text-base text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <option value="a">पर्याय अ</option>
          <option value="b">पर्याय ब</option>
          <option value="c">पर्याय क</option>
          <option value="d">पर्याय ड</option>
        </select>
      </Field>

      <Field label="स्पष्टीकरण (ऐच्छिक, निकालात दिसेल)" htmlFor="explanation">
        <textarea
          id="explanation"
          name="explanation"
          lang="mr"
          rows={2}
          className="w-full rounded border border-rule bg-canvas px-3 py-2 text-base text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? "जोडत आहे…" : "प्रश्न जोडा"}
      </Button>
    </form>
  );
}
