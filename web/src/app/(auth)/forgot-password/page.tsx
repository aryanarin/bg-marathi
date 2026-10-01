import type { Metadata } from "next";
import Link from "next/link";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "पासवर्ड विसरला",
  description: "पासवर्ड पुन्हा सेट करण्यासाठी दुवा मिळवा.",
  robots: { index: false, follow: false },
};

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
        <ForgotPasswordForm />

        <p className="text-sm text-ink-muted">
          <Link href="/login" className="rounded font-medium text-accent underline underline-offset-4">
            प्रवेश पानाकडे परत जा
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
