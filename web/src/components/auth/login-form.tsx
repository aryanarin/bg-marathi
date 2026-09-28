"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signIn, type FormState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signIn, {});

  return (
    <form action={action} className="space-y-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}

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

      <Field label="पासवर्ड" htmlFor="password" error={state.fieldErrors?.password?.[0]}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          invalid={!!state.fieldErrors?.password}
        />
      </Field>

      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="rounded text-sm text-saffron underline underline-offset-4"
        >
          पासवर्ड विसरलात?
        </Link>
      </div>

      <Button type="submit" fullWidth size="lg" disabled={pending}>
        {pending ? "प्रवेश करत आहे…" : "प्रवेश करा"}
      </Button>
    </form>
  );
}
