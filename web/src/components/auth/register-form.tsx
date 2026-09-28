"use client";

import { useActionState } from "react";

import { signUp, type FormState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export function RegisterForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(signUp, {});

  // On success, show only the confirmation notice: the user must now go to
  // their email, so re-showing the form would be confusing.
  if (state.success) {
    return (
      <p
        className="rounded border border-gold bg-gold-soft/40 px-4 py-3 text-sm text-ink"
        role="status"
      >
        {state.success}
      </p>
    );
  }

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.error && (
        <p className="rounded border border-danger bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
          {state.error}
        </p>
      )}

      <Field label="पूर्ण नाव" htmlFor="fullName" error={state.fieldErrors?.fullName?.[0]}>
        <Input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          required
          invalid={!!state.fieldErrors?.fullName}
        />
      </Field>

      <Field label="ईमेल" htmlFor="email" error={state.fieldErrors?.email?.[0]}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          invalid={!!state.fieldErrors?.email}
        />
      </Field>

      <Field
        label="पासवर्ड"
        htmlFor="password"
        hint="किमान ८ अक्षरे"
        error={state.fieldErrors?.password?.[0]}
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          invalid={!!state.fieldErrors?.password}
        />
      </Field>

      <Field
        label="पासवर्ड पुन्हा टाका"
        htmlFor="confirmPassword"
        error={state.fieldErrors?.confirmPassword?.[0]}
      >
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          invalid={!!state.fieldErrors?.confirmPassword}
        />
      </Field>

      <Button type="submit" fullWidth size="lg" disabled={pending}>
        {pending ? "नोंदणी करत आहे…" : "नोंदणी करा"}
      </Button>
    </form>
  );
}
