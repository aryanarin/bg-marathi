import { cn, percentage } from "@/lib/utils";

/**
 * Progress bar.
 *
 * Uses a native semantic wrapper with explicit ARIA so screen readers announce
 * the value, and renders the number as text too. A colour-only progress
 * indication would be inaccessible.
 */
export function ProgressBar({
  value,
  total,
  label,
  showText = true,
  className,
}: {
  value: number;
  total: number;
  label: string;
  showText?: boolean;
  className?: string;
}) {
  const pct = percentage(value, total);

  return (
    <div className={cn("space-y-1.5", className)}>
      {showText && (
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-ink-muted">{label}</span>
          <span className="font-medium text-ink tabular-nums">
            {value} / {total}
          </span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="h-2 w-full overflow-hidden rounded-full bg-surface-2"
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
