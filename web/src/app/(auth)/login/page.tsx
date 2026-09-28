import type { Metadata } from "next";
import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "प्रवेश",
  description: "आपल्या खात्यात प्रवेश करा.",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;
  const linkError = params.error === "link_invalid";

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h1" className="font-devanagari text-2xl">
          प्रवेश करा
        </CardTitle>
        <CardDescription>आपल्या खात्यात प्रवेश करून अभ्यास सुरू ठेवा.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {linkError && (
          <p className="rounded border border-danger bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
            दुवा कालबाह्य किंवा अवैध आहे. कृपया पुन्हा प्रयत्न करा.
          </p>
        )}

        <LoginForm next={next} />

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
