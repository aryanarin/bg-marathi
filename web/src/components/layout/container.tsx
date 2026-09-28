import { cn } from "@/lib/utils";

/**
 * Page container.
 *
 * Mobile-first: full width with comfortable gutters on a phone, capped and
 * centred on larger screens. `reading` applies the ~60-65 character measure used
 * for verse and purport text, which is the most important readability control in
 * the whole application.
 */
export function Container({
  className,
  width = "default",
  ...props
}: React.ComponentProps<"div"> & { width?: "default" | "reading" | "wide" }) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-5",
        width === "reading" && "max-w-reading",
        width === "default" && "max-w-3xl",
        width === "wide" && "max-w-6xl",
        className,
      )}
      {...props}
    />
  );
}
