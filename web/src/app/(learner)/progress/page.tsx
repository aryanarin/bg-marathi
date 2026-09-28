import type { Metadata } from "next";
import { TrendingUp } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "प्रगती",
  robots: { index: false, follow: false },
};

/**
 * PHASE 1: shell only. Chapter-wise progress and learning time land in Phase 5.
 */
export default function ProgressPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-devanagari text-2xl text-ink">आपली प्रगती</h1>
        <p className="mt-1 text-ink-muted prose-marathi">
          अध्यायानुसार वाचलेले आणि पाठ केलेले श्लोक.
        </p>
      </header>

      <EmptyState
        icon={TrendingUp}
        title="अद्याप प्रगती नोंदवली नाही"
        description="श्लोक वाचल्यावर आणि पाठ केल्यावर आपली प्रगती येथे दिसेल."
      />
    </div>
  );
}
