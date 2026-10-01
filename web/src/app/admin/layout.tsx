import Link from "next/link";

import { AdminNav } from "@/components/admin/admin-nav";
import { Container } from "@/components/layout/container";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { requireAdmin } from "@/lib/auth/guards";
import { siteConfig } from "@/lib/site-config";

/**
 * Admin layout.
 *
 * requireAdmin() gives a fast redirect for non-admins, but it is NOT the only
 * guard: every admin page and Server Action re-checks, and RLS enforces the
 * `is_admin()` policies in the database. A layout check alone is unreliable
 * because layouts don't re-render per navigation. See docs/architecture.md.
 */
export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireAdmin();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-rule bg-canvas/90 backdrop-blur-sm">
        <Container width="wide" className="flex h-14 items-center justify-between gap-4">
          <Link href="/admin" className="flex items-center gap-2 rounded font-semibold text-ink">
            <span aria-hidden="true" className="text-xl leading-none text-accent">
              ॐ
            </span>
            <span className="font-devanagari">{siteConfig.name}</span>
            <span className="rounded bg-accent-soft px-1.5 py-0.5 text-xs font-medium text-accent">
              प्रशासन
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/dashboard"
              className="hidden rounded-md px-3 py-2 text-sm text-ink-muted hover:bg-surface-2 hover:text-ink sm:block"
            >
              वापरकर्ता दृश्य
            </Link>
            <ThemeToggle />
            <SignOutButton />
          </div>
        </Container>
      </header>

      <div className="flex-1">
        <Container width="wide" className="flex flex-col gap-6 py-6 md:flex-row">
          <AdminNav />
          <main id="main-content" className="min-w-0 flex-1">
            {children}
          </main>
        </Container>
      </div>
    </div>
  );
}
