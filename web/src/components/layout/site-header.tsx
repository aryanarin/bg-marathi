import Link from "next/link";

import { Container } from "@/components/layout/container";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { siteConfig } from "@/lib/site-config";

/**
 * Site header.
 *
 * Deliberately minimal: a wordmark, the theme toggle, and a small set of links
 * passed as children. On phones the primary navigation lives in the bottom tab
 * bar instead, since reaching the top of the screen one-handed is awkward.
 */
export function SiteHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-canvas/90 backdrop-blur-sm">
      <Container width="wide" className="flex h-14 items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 rounded text-lg font-semibold text-ink"
        >
          <span aria-hidden="true" className="text-accent text-xl leading-none">
            ॐ
          </span>
          <span className="font-devanagari">{siteConfig.name}</span>
        </Link>

        <div className="flex items-center gap-1">
          {children}
          <ThemeToggle />
        </div>
      </Container>
    </header>
  );
}
