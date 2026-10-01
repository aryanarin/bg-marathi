import type { Metadata } from "next";
import Link from "next/link";

import { ClassForm } from "@/components/admin/class-form";
import { createClass } from "@/lib/data/admin-class-actions";

export const metadata: Metadata = {
  title: "नवीन वर्ग",
  robots: { index: false, follow: false },
};

export default function NewClassPage() {
  return (
    <div className="mx-auto max-w-reading space-y-6">
      <header>
        <Link href="/admin/classes" className="rounded text-sm text-accent underline underline-offset-4">
          ← वर्ग
        </Link>
        <h1 className="mt-2 font-devanagari text-2xl text-ink">नवीन वर्ग</h1>
      </header>
      <ClassForm action={createClass} submitLabel="वर्ग जतन करा" />
    </div>
  );
}
