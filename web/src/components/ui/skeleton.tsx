import { cn } from "@/lib/utils";

/** Skeleton placeholder for loading states. */
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("animate-pulse rounded bg-birch/60", className)}
      aria-hidden="true"
      {...props}
    />
  );
}

/** Loading placeholder shaped like a list of verse or chapter cards. */
export function CardListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="लोड होत आहे">
      <span className="sr-only">लोड होत आहे…</span>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-rule-gold bg-cream p-5 space-y-3"
        >
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
        </div>
      ))}
    </div>
  );
}
