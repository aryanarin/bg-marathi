import Link from "next/link";

import { siteConfig } from "@/lib/site-config";

/**
 * Layout for authentication pages.
 *
 * A narrow, centred, single-purpose surface with no site navigation: someone
 * signing in should not be offered six other places to go.
 */
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col bg-parchment">
      <header className="border-b border-rule-gold">
        <div className="mx-auto flex h-14 max-w-md items-center px-5">
          <Link
            href="/"
            className="flex items-center gap-2 rounded font-semibold text-ink"
          >
            <span aria-hidden="true" className="text-xl leading-none text-gold-dark">
              ॐ
            </span>
            <span className="font-devanagari">{siteConfig.name}</span>
          </Link>
        </div>
      </header>

      <main id="main-content" className="flex flex-1 items-start justify-center px-5 py-10">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
