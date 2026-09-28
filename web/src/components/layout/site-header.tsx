import Link from "next/link";

import { Container } from "@/components/layout/container";
import { siteConfig } from "@/lib/site-config";

/**
 * Site header.
 *
 * Deliberately minimal: a wordmark and a small set of links. On phones the
 * primary navigation lives in the bottom tab bar instead, since reaching the top
 * of the screen one-handed is awkward.
 */
export function SiteHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-40 border-b border-rule-gold bg-parchment/95 backdrop-blur-sm">
      <Container width="wide" className="flex h-14 items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 rounded text-lg font-semibold text-ink"
        >
          {/* Decorative mark. Kept as text so the header renders correctly even
              with no image assets present. */}
          <span aria-hidden="true" className="text-gold-dark text-xl leading-none">
            ॐ
          </span>
          <span className="font-devanagari">{siteConfig.name}</span>
        </Link>

        {children}
      </Container>
    </header>
  );
}
