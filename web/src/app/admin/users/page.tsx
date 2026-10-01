import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getUserSummaries } from "@/lib/data/admin-users";
import { formatDuration } from "@/lib/utils";

export const metadata: Metadata = {
  title: "वापरकर्ते",
  robots: { index: false, follow: false },
};

const toDevanagari = (n: number) =>
  String(n).replace(/[0-9]/g, (d) => "०१२३४५६७८९"[Number(d)]);

export default async function AdminUsersPage() {
  const users = await getUserSummaries();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-devanagari text-2xl text-ink">वापरकर्ते</h1>
        <p className="mt-1 text-sm text-ink-muted">नोंदणीकृत वापरकर्ते आणि त्यांची प्रगती.</p>
      </header>

      {users.length === 0 ? (
        <EmptyState icon={Users} title="अद्याप वापरकर्ते नाहीत" />
      ) : (
        <ul className="space-y-3">
          {users.map(({ profile, versesRead, versesMemorized, totalTimeSeconds }) => (
            <li key={profile.id}>
              <Link
                href={`/admin/users/${profile.id}`}
                className="block rounded-lg focus-visible:ring-2 focus-visible:ring-accent"
              >
                <Card>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">
                        {profile.full_name ?? "—"}
                        {profile.role === "admin" && (
                          <span className="ml-2 rounded bg-accent-soft px-1.5 py-0.5 text-xs text-accent">
                            प्रशासक
                          </span>
                        )}
                      </p>
                      <p className="truncate text-sm text-ink-subtle">{profile.email}</p>
                    </div>
                    <dl className="flex gap-4 text-sm text-ink-muted">
                      <div className="text-center">
                        <dd className="font-semibold tabular-nums text-ink">{toDevanagari(versesRead)}</dd>
                        <dt className="text-xs">वाचले</dt>
                      </div>
                      <div className="text-center">
                        <dd className="font-semibold tabular-nums text-ink">{toDevanagari(versesMemorized)}</dd>
                        <dt className="text-xs">पाठ</dt>
                      </div>
                      <div className="text-center">
                        <dd className="font-semibold tabular-nums text-ink">{formatDuration(totalTimeSeconds)}</dd>
                        <dt className="text-xs">वेळ</dt>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
