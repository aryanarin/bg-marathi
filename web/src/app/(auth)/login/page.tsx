import type { Metadata } from "next";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "प्रवेश",
  description: "आपल्या खात्यात प्रवेश करा.",
  robots: { index: false, follow: false },
};

/**
 * PHASE 1: shell only.
 *
 * The sign-in form, Supabase auth call and error handling arrive in Phase 3.
 * The route exists now so navigation and `typedRoutes` are correct.
 */
export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h1" className="font-devanagari text-2xl">
          प्रवेश करा
        </CardTitle>
        <CardDescription>आपल्या खात्यात प्रवेश करून अभ्यास सुरू ठेवा.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="rounded border border-dashed border-rule-gold bg-sand/50 p-4 text-sm text-ink-muted">
          प्रवेश सुविधा तयार होत आहे.
        </p>

        <p className="text-sm text-ink-muted">
          खाते नाही?{" "}
          <Link href="/register" className="rounded font-medium text-saffron underline underline-offset-4">
            नोंदणी करा
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
