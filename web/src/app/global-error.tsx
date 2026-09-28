"use client";

import { useEffect } from "react";

/**
 * Root error boundary, for failures in the root layout itself.
 *
 * This replaces the entire document, so it must render its own <html> and
 * <body> and cannot rely on global styles or fonts being available. Inline
 * styles are used deliberately for that reason.
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("[global error]", error);
  }, [error]);

  return (
    <html lang="mr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fdfbf7",
          color: "#2d1f15",
          fontFamily: "Georgia, 'Times New Roman', serif",
          padding: "1.5rem",
        }}
      >
        <div style={{ maxWidth: "28rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>
            काहीतरी अडचण आली
          </h1>
          <p style={{ color: "#5c4a3a", lineHeight: 1.8 }}>
            संकेतस्थळ उघडताना अडचण आली. कृपया पान पुन्हा लोड करा.
          </p>
          {/* A plain anchor, not next/link, is deliberate here. This boundary
              catches failures in the root layout itself, so the router may be
              in a broken state; a full document navigation is the only reliable
              way out. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/"
            style={{
              display: "inline-block",
              marginTop: "1.25rem",
              padding: "0.625rem 1.25rem",
              backgroundColor: "#c2410c",
              color: "#fdfbf7",
              borderRadius: "0.25rem",
              textDecoration: "none",
            }}
          >
            मुख्यपृष्ठाकडे जा
          </a>
        </div>
      </body>
    </html>
  );
}
