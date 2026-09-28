import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Form field primitives: a labelled text input and an inline error, with the
 * ARIA wiring that screen readers need. Used across the auth and admin forms.
 */

export function Field({
  label,
  htmlFor,
  error,
  children,
  hint,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const errorId = `${htmlFor}-error`;
  const hintId = `${htmlFor}-hint`;

  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink">
        {label}
      </label>
      {hint && (
        <p id={hintId} className="text-xs text-ink-subtle">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={errorId} className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input"> & { invalid?: boolean }
>(function Input({ className, invalid, ...props }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "h-11 w-full rounded border bg-parchment px-3 text-base text-ink",
        "placeholder:text-ink-subtle",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-saffron",
        invalid ? "border-danger" : "border-rule",
        className,
      )}
      {...props}
    />
  );
});
