import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Button.
 *
 * Variants follow the design direction: accent for primary actions, an
 * ivory-and-accent "sacred" secondary, and quiet ghost/link styles.
 *
 * Sizes keep a minimum 44px touch target on the default and larger variants,
 * which is the iOS/Android accessibility guideline. `sm` is reserved for
 * genuinely secondary controls inside dense admin tables.
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded font-medium",
    "transition-colors duration-150",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: "bg-accent text-canvas hover:bg-accent-hover",
        sacred:
          "bg-surface text-ink border border-accent hover:bg-accent-soft/40",
        outline:
          "bg-transparent text-ink border border-rule hover:bg-surface-2",
        ghost: "bg-transparent text-ink hover:bg-surface-2",
        danger: "bg-danger text-canvas hover:brightness-90",
        link: "bg-transparent text-accent underline underline-offset-4 hover:text-accent-hover",
      },
      size: {
        sm: "h-9 px-3 text-sm [&_svg]:size-4",
        default: "h-11 px-5 text-base [&_svg]:size-5",
        lg: "h-12 px-6 text-lg [&_svg]:size-5",
        icon: "size-11 [&_svg]:size-5",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  /** Render as the child element instead of a <button>, e.g. to wrap a Link. */
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  fullWidth,
  asChild = false,
  type,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : "button";

  return (
    <Component
      // Default to type="button". An unspecified type inside a form defaults to
      // "submit", which causes surprising accidental submissions.
      type={asChild ? undefined : (type ?? "button")}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
