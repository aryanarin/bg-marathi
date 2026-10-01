import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ClassForm } from "@/components/admin/class-form";
import { updateClass } from "@/lib/data/admin-class-actions";
import { getClassById } from "@/lib/data/admin-classes";

export const metadata: Metadata = {
  title: "वर्ग संपादन",
  robots: { index: false, follow: false },
};

export default async function EditClassPage({
  params,
}: PageProps<"/admin/classes/[classId]">) {
  const { classId } = await params;
  const session = await getClassById(classId);
  if (!session) notFound();

  // Bind the id so the form's (prev, formData) action signature is preserved.
  const action = updateClass.bind(null, classId);

  return (
    <div className="mx-auto max-w-reading space-y-6">
      <header>
        <Link href="/admin/classes" className="rounded text-sm text-accent underline underline-offset-4">
          ← वर्ग
        </Link>
        <h1 className="mt-2 font-devanagari text-2xl text-ink">वर्ग संपादन</h1>
      </header>
      <ClassForm action={action} initial={session} submitLabel="बदल जतन करा" />
    </div>
  );
}
