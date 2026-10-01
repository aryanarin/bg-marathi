import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Empty state.
 *
 * Every list in the application needs one of these. An empty screen with no
 * explanation reads as a bug to a non-technical user.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg",
        "border border-dashed border-rule bg-surface/50 px-6 py-12 text-center",
        className,
      )}
    >
      {Icon && (
        <Icon className="size-8 text-accent" aria-hidden="true" strokeWidth={1.5} />
      )}
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      {description && (
        <p className="max-w-sm text-sm text-ink-muted">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
