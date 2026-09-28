"use client";

import { useActionState } from "react";

import { updatePassword, type FormState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    updatePassword,
    {},
  );

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.error && (
        <p className="rounded border border-danger bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
          {state.error}
        </p>
      )}

      <Field
        label="नवीन पासवर्ड"
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
        {pending ? "जतन करत आहे…" : "पासवर्ड जतन करा"}
      </Button>
    </form>
  );
}
