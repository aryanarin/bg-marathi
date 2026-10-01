import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";

import { ClassCard } from "@/components/classes/class-card";
import { EmptyState } from "@/components/ui/empty-state";
import { getUpcomingClasses } from "@/lib/data/classes";

export const metadata: Metadata = {
  title: "वर्ग",
  robots: { index: false, follow: false },
};

export default async function ClassesPage() {
  const classes = await getUpcomingClasses();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-devanagari text-2xl text-ink">वर्ग</h1>
        <p className="mt-1 text-ink-muted prose-marathi">
          पुढील ऑनलाइन वर्गांची माहिती आणि सहभागी होण्याचा दुवा.
        </p>
      </header>

      {classes.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="पुढील वर्ग ठरलेला नाही"
          description="नवीन वर्ग ठरल्यावर त्याची तारीख, वेळ आणि दुवा येथे दिसेल."
        />
      ) : (
        <ul className="space-y-4">
          {classes.map((session) => (
            <li key={session.id}>
              <ClassCard session={session} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
