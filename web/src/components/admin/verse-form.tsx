"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import type { ActionState } from "@/lib/data/admin-content-actions";
import type { Chapter, Verse } from "@/lib/types";

/** A labelled textarea matching the Field/Input styling. */
function TextArea({
  label,
  name,
  defaultValue,
  rows = 3,
  hint,
  error,
  lang,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  rows?: number;
  hint?: string;
  error?: string;
  lang?: string;
}) {
  return (
    <Field label={label} htmlFor={name} hint={hint} error={error}>
      <textarea
        id={name}
        name={name}
        rows={rows}
        lang={lang}
        defaultValue={defaultValue ?? ""}
        className="w-full rounded border border-rule bg-canvas px-3 py-2 text-base text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      />
    </Field>
  );
}

export function VerseForm({
  action,
  chapters,
  initial,
  defaultChapterId,
  submitLabel,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  chapters: Chapter[];
  initial?: Verse;
  defaultChapterId?: string;
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

      <Field label="अध्याय" htmlFor="chapter_id" error={state.fieldErrors?.chapter_id?.[0]}>
        <select
          id="chapter_id"
          name="chapter_id"
          defaultValue={initial?.chapter_id ?? defaultChapterId ?? ""}
          required
          className="h-11 w-full rounded border border-rule bg-canvas px-3 text-base text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <option value="" disabled>
            अध्याय निवडा
          </option>
          {chapters.map((c) => (
            <option key={c.id} value={c.id}>
              {c.chapter_number}. {c.name_marathi}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="श्लोक क्रमांक" htmlFor="verse_number" error={state.fieldErrors?.verse_number?.[0]}>
          <Input id="verse_number" name="verse_number" type="number" min={1} defaultValue={initial?.verse_number} required />
        </Field>
        <Field
          label="अंतिम क्रमांक (जोड श्लोकासाठी)"
          htmlFor="verse_number_end"
          hint="उदा. १६-१८ साठी १८"
          error={state.fieldErrors?.verse_number_end?.[0]}
        >
          <Input
            id="verse_number_end"
            name="verse_number_end"
            type="number"
            min={1}
            defaultValue={initial?.verse_number_end ?? ""}
          />
        </Field>
      </div>

      <TextArea
        label="संस्कृत पाठ"
        name="sanskrit_text"
        lang="sa"
        rows={3}
        defaultValue={initial?.sanskrit_text}
        error={state.fieldErrors?.sanskrit_text?.[0]}
      />
      <TextArea label="शब्दार्थ" name="word_to_word" lang="mr" defaultValue={initial?.word_to_word} />
      <TextArea label="भाषांतर" name="translation" lang="mr" defaultValue={initial?.translation} />
      <TextArea label="भावार्थ" name="purport" lang="mr" rows={6} defaultValue={initial?.purport} />
      <TextArea
        label="सोपे स्पष्टीकरण (प्रशासकाने लिहायचे)"
        name="easy_explanation"
        lang="mr"
        rows={4}
        defaultValue={initial?.easy_explanation}
      />
      <TextArea
        label="उदाहरण (प्रशासकाने लिहायचे)"
        name="example"
        lang="mr"
        rows={3}
        defaultValue={initial?.example}
      />

      <Field
        label="ऑडिओ URL (ऐच्छिक)"
        htmlFor="audio_url"
        hint="रिकामे ठेवल्यास उच्चारण दाखवले जाणार नाही"
        error={state.fieldErrors?.audio_url?.[0]}
      >
        <Input id="audio_url" name="audio_url" type="url" inputMode="url" defaultValue={initial?.audio_url ?? ""} />
      </Field>

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "जतन करत आहे…" : submitLabel}
      </Button>
    </form>
  );
}
