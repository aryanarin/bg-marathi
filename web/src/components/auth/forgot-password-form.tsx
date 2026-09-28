"use client";

import { useActionState } from "react";

import { requestPasswordReset, type FormState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    requestPasswordReset,
    {},
  );

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

      <Button type="submit" fullWidth size="lg" disabled={pending}>
        {pending ? "पाठवत आहे…" : "दुवा पाठवा"}
      </Button>
    </form>
  );
}
