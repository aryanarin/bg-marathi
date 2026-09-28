import { BottomNav } from "@/components/layout/bottom-nav";
import { Container } from "@/components/layout/container";
import { LearnerNav } from "@/components/layout/learner-nav";
import { SiteHeader } from "@/components/layout/site-header";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { requireUser } from "@/lib/auth/guards";

/**
 * Layout for authenticated learner pages.
 *
 * requireUser() here gives the user a fast redirect to /login when signed out,
 * but it is NOT the security boundary: each page and Server Action re-checks,
 * and RLS enforces access in the database. Layouts do not re-render per
 * navigation, so a check here alone would be unreliable. See docs/architecture.md.
 */
export default async function LearnerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireUser();

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader>
        <div className="flex items-center gap-2">
          <LearnerNav />
          <SignOutButton />
        </div>
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
