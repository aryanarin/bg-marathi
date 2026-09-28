import type { Metadata } from "next";
import { ListChecks } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "प्रश्नमंजुषा",
  robots: { index: false, follow: false },
};

/**
 * PHASE 1: shell only. The quiz system is built in Phase 7.
 */
export default function QuizzesPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-devanagari text-2xl text-ink">प्रश्नमंजुषा</h1>
        <p className="mt-1 text-ink-muted prose-marathi">
          वर्गानंतर उपलब्ध होणाऱ्या प्रश्नमंजुषा आणि आपले गुण.
        </p>
      </header>

      <EmptyState
        icon={ListChecks}
        title="अद्याप प्रश्नमंजुषा उपलब्ध नाही"
        description="वर्ग झाल्यानंतर त्या श्लोकांवर आधारित प्रश्नमंजुषा येथे दिसेल."
      />
    </div>
  );
}
