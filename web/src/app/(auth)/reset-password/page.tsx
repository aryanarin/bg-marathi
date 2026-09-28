import type { Metadata } from "next";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "नवीन पासवर्ड",
  description: "नवीन पासवर्ड सेट करा.",
  robots: { index: false, follow: false },
};

/**
 * PHASE 1: shell only.
 *
 * In Phase 3 this page is reached from the emailed recovery link. Supabase
 * establishes a short-lived recovery session from the URL fragment, so the page
 * must be a Client Component that reads it and then calls updateUser().
 */
export default function ResetPasswordPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h1" className="font-devanagari text-2xl">
          नवीन पासवर्ड सेट करा
        </CardTitle>
        <CardDescription>आपला नवीन पासवर्ड प्रविष्ट करा.</CardDescription>
      </CardHeader>

      <CardContent>
        <p className="rounded border border-dashed border-rule-gold bg-sand/50 p-4 text-sm text-ink-muted">
          ही सुविधा तयार होत आहे.
        </p>
      </CardContent>
    </Card>
  );
}
