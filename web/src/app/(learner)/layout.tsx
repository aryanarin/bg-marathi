import { BottomNav } from "@/components/layout/bottom-nav";
import { Container } from "@/components/layout/container";
import { LearnerNav } from "@/components/layout/learner-nav";
import { SiteHeader } from "@/components/layout/site-header";

/**
 * Layout for authenticated learner pages.
 *
 * SECURITY: this layout deliberately performs NO authorization check.
 *
 * Layouts do not re-render on every navigation and do not control whether child
 * segments run, so a check here would be unreliable and misleading. Each page
 * calls `requireUser()` from the data access layer, and RLS enforces the same
 * rule in Postgres. `proxy.ts` additionally redirects signed-out visitors before
 * a render is wasted. See docs/architecture.md.
 */
export default function LearnerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader>
        <LearnerNav />
      </SiteHeader>

      <main id="main-content" className="flex-1">
        <Container width="default" className="py-8">
          {children}
        </Container>
      </main>

      <BottomNav />
    </div>
  );
}
