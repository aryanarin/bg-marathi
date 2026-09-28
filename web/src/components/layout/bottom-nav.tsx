"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, CalendarDays, Home, ListChecks, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Bottom tab bar: the primary navigation on phones.
 *
 * Bottom placement is deliberate. Most readers are on a phone one-handed, and
 * the top of a large screen is hard to reach. Hidden on desktop, where the
 * header navigation takes over.
 *
 * `pb-[env(safe-area-inset-bottom)]` keeps the tabs clear of the iPhone home
 * indicator.
 */
const tabs = [
  { href: "/dashboard", label: "मुख्य", icon: Home },
  { href: "/chapters", label: "अध्याय", icon: BookOpen },
  { href: "/progress", label: "प्रगती", icon: TrendingUp },
  { href: "/quizzes", label: "प्रश्न", icon: ListChecks },
  { href: "/classes", label: "वर्ग", icon: CalendarDays },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="मुख्य नेव्हिगेशन"
      className={cn(
        "sticky bottom-0 z-40 border-t border-rule-gold bg-parchment/95 backdrop-blur-sm",
        "pb-[env(safe-area-inset-bottom)] md:hidden",
      )}
    >
      <ul className="flex items-stretch justify-around">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(`${href}/`);

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  // 56px tall: comfortably above the 44px minimum touch target.
                  "flex h-14 flex-col items-center justify-center gap-0.5 rounded",
                  "text-xs transition-colors",
                  isActive
                    ? "text-saffron font-medium"
                    : "text-ink-subtle hover:text-ink",
                )}
              >
                <Icon
                  className="size-5"
                  strokeWidth={isActive ? 2.25 : 1.75}
                  aria-hidden="true"
                />
                <span className="font-devanagari">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
