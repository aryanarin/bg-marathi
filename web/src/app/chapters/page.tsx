import type { Metadata } from "next";
import { BookOpen } from "lucide-react";

import { Container } from "@/components/layout/container";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "अध्याय",
  description:
    "श्रीमद्भगवद्गीतेचे सर्व अध्याय — प्रत्येक अध्यायातील श्लोक, शब्दार्थ, भाषांतर आणि भावार्थासह.",
};

/**
 * Public chapter list.
 *
 * PHASE 1: shell only. The chapter grid, per-chapter progress and verse counts
 * are wired to Supabase in Phase 4, once the schema exists and content has been
 * imported. Rendering a real empty state rather than fake chapters keeps the
 * page honest in the meantime.
 */
export default function ChaptersPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        <Container width="default" className="py-10">
          <h1 className="font-devanagari text-3xl text-ink">अध्याय</h1>
          <p className="mt-2 text-ink-muted prose-marathi">
            श्रीमद्भगवद्गीतेचे अठरा अध्याय.
          </p>

          <div className="mt-8">
            <EmptyState
              icon={BookOpen}
              title="अध्याय अद्याप उपलब्ध नाहीत"
              description="मजकूर तयार होताच अध्याय येथे दिसतील."
            />
          </div>
        </Container>
      </main>

      <SiteFooter />
    </div>
  );
}
