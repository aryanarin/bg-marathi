import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, Clock, Sparkles } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { getUserDetail } from "@/lib/data/admin-users";
import { formatDuration } from "@/lib/utils";

export const metadata: Metadata = {
  title: "वापरकर्ता तपशील",
  robots: { index: false, follow: false },
};

const toDevanagari = (n: number) =>
  String(n).replace(/[0-9]/g, (d) => "०१२३४५६७८९"[Number(d)]);

export default async function AdminUserDetailPage({
  params,
}: PageProps<"/admin/users/[userId]">) {
  const { userId } = await params;
  const detail = await getUserDetail(userId);
  if (!detail) notFound();

  const { profile, versesRead, versesMemorized, totalTimeSeconds } = detail;

  const stats = [
    { icon: BookOpen, label: "वाचलेले श्लोक", value: toDevanagari(versesRead) },
    { icon: Sparkles, label: "पाठ केलेले श्लोक", value: toDevanagari(versesMemorized) },
    { icon: Clock, label: "अभ्यासाचा वेळ", value: formatDuration(totalTimeSeconds) },
  ] as const;

  return (
    <div className="space-y-6">
      <header>
        <Link href="/admin/users" className="rounded text-sm text-accent underline underline-offset-4">
          ← वापरकर्ते
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-ink">{profile.full_name ?? "—"}</h1>
        <p className="mt-0.5 text-ink-subtle">{profile.email}</p>
      </header>

      <ul className="grid grid-cols-3 gap-3">
        {stats.map(({ icon: Icon, label, value }) => (
          <li key={label}>
            <Card>
              <CardContent className="p-4 pt-4">
                <Icon className="size-5 text-accent" aria-hidden="true" />
                <p className="mt-2 text-xl font-semibold tabular-nums text-ink">{value}</p>
                <p className="mt-0.5 font-devanagari text-xs text-ink-muted">{label}</p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      <p className="text-sm text-ink-subtle">
        वापरकर्त्याची प्रगती केवळ पाहण्यासाठी आहे; ती येथून संपादित करता येत नाही.
      </p>
    </div>
  );
}
