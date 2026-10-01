import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Pencil, Plus } from "lucide-react";

import { DeleteClassButton, PublishToggle } from "@/components/admin/class-row-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getAllClasses } from "@/lib/data/admin-classes";

export const metadata: Metadata = {
  title: "वर्ग व्यवस्थापन",
  robots: { index: false, follow: false },
};

export default async function AdminClassesPage() {
  const classes = await getAllClasses();

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-devanagari text-2xl text-ink">वर्ग</h1>
          <p className="mt-1 text-sm text-ink-muted">ऑनलाइन वर्ग तयार करा आणि प्रकाशित करा.</p>
        </div>
        <Button asChild>
          <Link href="/admin/classes/new">
            <Plus className="size-4" /> नवीन
          </Link>
        </Button>
      </header>

      {classes.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="अद्याप वर्ग नाहीत"
          description="पहिला वर्ग जोडण्यासाठी ‘नवीन’ वर क्लिक करा."
        />
      ) : (
        <ul className="space-y-3">
          {classes.map((c) => (
            <li key={c.id}>
              <Card>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-devanagari font-medium text-ink">{c.title}</p>
                    <p className="text-sm text-ink-subtle">
                      {c.class_date} · {c.class_time?.slice(0, 5)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <PublishToggle classId={c.id} published={c.is_published} />
                    <Button asChild variant="ghost" size="sm" aria-label="संपादित करा">
                      <Link href={`/admin/classes/${c.id}`}>
                        <Pencil className="size-4" />
                      </Link>
                    </Button>
                    <DeleteClassButton classId={c.id} title={c.title} />
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
