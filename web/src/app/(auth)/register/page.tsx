import type { Metadata } from "next";
import Link from "next/link";

import { RegisterForm } from "@/components/auth/register-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "नोंदणी",
  description: "नवीन खाते तयार करा आणि श्रीमद्भगवद्गीतेचा अभ्यास सुरू करा.",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h1" className="font-devanagari text-2xl">
          नोंदणी करा
        </CardTitle>
        <CardDescription>खाते तयार केल्यावर आपली प्रगती नोंदवली जाईल.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <RegisterForm />

        <p className="text-sm text-ink-muted">
          खाते आहे?{" "}
          <Link href="/login" className="rounded font-medium text-saffron underline underline-offset-4">
            प्रवेश करा
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
