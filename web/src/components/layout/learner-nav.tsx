"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { learnerNav } from "@/lib/site-config";
import { cn } from "@/lib/utils";

/** Header navigation for signed-in learners. Desktop only; phones use BottomNav. */
export function LearnerNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="मुख्य" className="hidden items-center gap-1 md:flex">
      {learnerNav.map(({ href, labelMarathi }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "rounded px-3 py-2 text-sm font-devanagari transition-colors",
              isActive
                ? "bg-accent-soft/40 font-medium text-ink"
                : "text-ink-muted hover:bg-surface-2 hover:text-ink",
            )}
          >
            {labelMarathi}
          </Link>
        );
      })}
    </nav>
  );
}
