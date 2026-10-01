import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Card: a warm canvas surface with a hairline accent rule.
 *
 * Elevation comes from tonal layering rather than hard shadows, per the design
 * direction. Cards sit on the canvas canvas in surface.
 */
export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "bg-surface border border-rule rounded-lg",
        "shadow-card",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("p-5 pb-3", className)} {...props} />;
}

export function CardTitle({
  className,
  as: Component = "h3",
  ...props
}: React.ComponentProps<"h3"> & { as?: "h1" | "h2" | "h3" | "h4" }) {
  // `h1` is allowed because on single-purpose pages (sign in, reset password)
  // the card title genuinely is the page heading, and a page must have one.
  return (
    <Component
      className={cn("text-lg font-semibold text-ink", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p className={cn("text-sm text-ink-muted mt-1", className)} {...props} />
  );
}

export function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("p-5 pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("p-5 pt-0 flex items-center gap-3", className)}
      {...props}
    />
  );
}
