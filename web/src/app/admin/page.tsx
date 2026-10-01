import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, CalendarDays, ListChecks, Sparkles, Users } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { getAdminStats } from "@/lib/data/admin";

export const metadata: Metadata = {
  title: "प्रशासन",
  robots: { index: false, follow: false },
};

const toDevanagari = (n: number) =>
  String(n).replace(/[0-9]/g, (d) => "०१२३४५६७८९"[Number(d)]);

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  const cards = [
    { icon: Users, label: "एकूण वापरकर्ते", value: toDevanagari(stats.totalUsers), href: "/admin/users" },
    { icon: BookOpen, label: "वाचलेले श्लोक", value: toDevanagari(stats.versesRead), href: null },
    { icon: Sparkles, label: "पाठ केलेले श्लोक", value: toDevanagari(stats.versesMemorized), href: null },
    { icon: ListChecks, label: "प्रकाशित प्रश्नमंजुषा", value: toDevanagari(stats.publishedQuizzes), href: "/admin/quizzes" },
  ] as const;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-devanagari text-2xl text-ink">प्रशासन सारांश</h1>
        <p className="mt-1 text-ink-muted prose-marathi">
          मजकूर, वर्ग आणि प्रश्नमंजुषा व्यवस्थापित करा.
        </p>
      </header>

      <section aria-label="आकडेवारी">
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {cards.map(({ icon: Icon, label, value, href }) => {
            const inner = (
              <Card>
                <CardContent className="p-4 pt-4">
                  <Icon className="size-5 text-accent" aria-hidden="true" />
                  <p className="mt-2 text-2xl font-semibold tabular-nums text-ink">{value}</p>
                  <p className="mt-0.5 font-devanagari text-sm text-ink-muted">{label}</p>
                </CardContent>
              </Card>
            );
            return (
              <li key={label}>
                {href ? (
                  <Link href={href} className="block rounded-lg focus-visible:ring-2 focus-visible:ring-accent">
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="next-class-heading">
        <h2 id="next-class-heading" className="mb-3 flex items-center gap-2 font-devanagari text-lg font-semibold text-ink">
          <CalendarDays className="size-5 text-accent" aria-hidden="true" />
          पुढील वर्ग
        </h2>
        {stats.nextClass ? (
          <Card>
            <CardContent className="p-5">
              <p className="font-devanagari font-medium text-ink">{stats.nextClass.title}</p>
              <p className="mt-1 text-sm text-ink-muted">
                {stats.nextClass.class_date} · {stats.nextClass.class_time}
              </p>
              <Link
                href="/admin/classes"
                className="mt-3 inline-block rounded text-sm text-accent underline underline-offset-4"
              >
                वर्ग व्यवस्थापित करा
              </Link>
            </CardContent>
          </Card>
        ) : (
          <p className="text-sm text-ink-subtle">
            पुढील वर्ग ठरलेला नाही.{" "}
            <Link href="/admin/classes" className="rounded text-accent underline underline-offset-4">
              नवीन वर्ग जोडा
            </Link>
          </p>
        )}
      </section>
    </div>
  );
}
