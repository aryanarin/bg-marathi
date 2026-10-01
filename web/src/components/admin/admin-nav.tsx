"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  LayoutDashboard,
  ListChecks,
  ScrollText,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "सारांश", icon: LayoutDashboard, exact: true },
  { href: "/admin/chapters", label: "अध्याय", icon: BookOpen, exact: false },
  { href: "/admin/verses", label: "श्लोक", icon: ScrollText, exact: false },
  { href: "/admin/classes", label: "वर्ग", icon: CalendarDays, exact: false },
  { href: "/admin/quizzes", label: "प्रश्नमंजुषा", icon: ListChecks, exact: false },
  { href: "/admin/users", label: "वापरकर्ते", icon: Users, exact: false },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="प्रशासन नेव्हिगेशन" className="md:w-52 md:shrink-0">
      {/* Horizontal scroll on mobile, vertical sidebar on desktop. */}
      <ul className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
        {items.map(({ href, label, icon: Icon, exact }) => {
          const active = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-accent-soft font-medium text-accent"
                    : "text-ink-muted hover:bg-surface-2 hover:text-ink",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                <span className="font-devanagari">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
