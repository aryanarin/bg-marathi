"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

/**
 * Route-level error boundary.
 *
 * Next.js 16 passes `retry` (previously `reset`) to re-render the segment.
 *
 * The user is shown a plain Marathi message and never a raw database or
 * Supabase error. The real error goes to the server logs via console.error,
 * where it is useful to a developer.
 */
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("[route error]", error);
  }, [error]);

  return (
    <Container width="reading" className="py-16">
      <div className="flex flex-col items-center gap-4 text-center">
        <AlertTriangle
          className="size-9 text-danger"
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <h1 className="font-devanagari text-2xl text-ink">काहीतरी अडचण आली</h1>
        <p className="max-w-sm text-ink-muted prose-marathi">
          हे पान उघडताना अडचण आली. कृपया पुन्हा प्रयत्न करा. अडचण कायम राहिल्यास
          थोड्या वेळाने पुन्हा पहा.
        </p>

        {/* The digest is a non-sensitive reference id that lets a developer find
            the matching server log entry. */}
        {error.digest && (
          <p className="text-xs text-ink-subtle">संदर्भ क्रमांक: {error.digest}</p>
        )}

        <Button onClick={retry} className="mt-2">
          पुन्हा प्रयत्न करा
        </Button>
      </div>
    </Container>
  );
}
