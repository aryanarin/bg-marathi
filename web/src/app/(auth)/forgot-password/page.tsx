import type { Metadata } from "next";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "पासवर्ड विसरला",
  description: "पासवर्ड पुन्हा सेट करण्यासाठी दुवा मिळवा.",
  robots: { index: false, follow: false },
};

/** PHASE 1: shell only. Implemented in Phase 3. */
export default function ForgotPasswordPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h1" className="font-devanagari text-2xl">
          पासवर्ड विसरला?
        </CardTitle>
        <CardDescription>
          आपल्या ईमेलवर पासवर्ड पुन्हा सेट करण्याचा दुवा पाठवला जाईल.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="rounded border border-dashed border-rule-gold bg-sand/50 p-4 text-sm text-ink-muted">
          ही सुविधा तयार होत आहे.
        </p>

        <p className="text-sm text-ink-muted">
          <Link
            href="/login"
            className="rounded font-medium text-saffron underline underline-offset-4"
          >
            प्रवेश पानाकडे परत जा
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
