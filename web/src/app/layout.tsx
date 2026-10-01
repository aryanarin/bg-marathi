import type { Metadata, Viewport } from "next";
import { Noto_Sans_Devanagari, Tiro_Devanagari_Marathi } from "next/font/google";

import { ThemeScript } from "@/components/layout/theme-script";
import { getSiteUrl } from "@/lib/env";
import { siteConfig } from "@/lib/site-config";

import "./globals.css";

/**
 * Typography.
 *
 * Latin UI text uses a system sans stack (set in globals.css) for a clean,
 * fast, git-scm-like feel. Two loaded families remain, each with a job:
 *   - Noto Sans Devanagari: Marathi UI and prose. Broadest glyph coverage of any
 *     free Devanagari face, which matters for conjuncts and rare matras.
 *   - Tiro Devanagari Marathi: Sanskrit verse display. Explicitly designed for
 *     Marathi orthography and drawn for readability at large sizes.
 *
 * `display: "swap"` keeps text visible during font load, which matters on the
 * slow mobile connections most readers will be on.
 */
const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari", "latin"],
  display: "swap",
  variable: "--font-noto-devanagari",
});

const tiroDevanagari = Tiro_Devanagari_Marathi({
  subsets: ["devanagari", "latin"],
  weight: "400",
  display: "swap",
  variable: "--font-tiro-devanagari",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.nameEnglish,
  openGraph: {
    type: "website",
    locale: "mr_IN",
    url: getSiteUrl(),
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Zoom is intentionally NOT disabled. Clamping it would fail WCAG 1.4.4 and
  // hurt exactly the readers most likely to need it.
  maximumScale: 5,
  // Theme color follows the active scheme's canvas background.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f4f4" },
    { media: "(prefers-color-scheme: dark)", color: "#16181d" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // lang="mr" so screen readers use Marathi pronunciation and the browser
    // picks Devanagari-appropriate default fonts. suppressHydrationWarning
    // because ThemeScript sets the `.dark` class before React hydrates.
    <html
      lang="mr"
      suppressHydrationWarning
      className={`${notoDevanagari.variable} ${tiroDevanagari.variable}`}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-dvh bg-canvas text-ink antialiased">
        <a href="#main-content" className="skip-link">
          मुख्य मजकुराकडे जा
        </a>
        {children}
      </body>
    </html>
  );
}
