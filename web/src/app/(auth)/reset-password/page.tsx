import type { Metadata } from "next";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "नवीन पासवर्ड",
  description: "नवीन पासवर्ड सेट करा.",
  robots: { index: false, follow: false },
};

/**
 * Reached from the emailed recovery link, which first hits /auth/callback to
 * establish a recovery session, then redirects here. updatePassword() then
 * works against that session.
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
        <ResetPasswordForm />
      </CardContent>
    </Card>
  );
}
