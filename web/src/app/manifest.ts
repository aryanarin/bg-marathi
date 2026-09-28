import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site-config";

/**
 * PWA manifest.
 *
 * Installability only. Offline scripture caching is explicitly out of scope for
 * the MVP: a service worker that caches verse content correctly is a meaningful
 * amount of complexity, and getting it half right produces stale content, which
 * is worse than no offline mode at all.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteConfig.name} — ${siteConfig.tagline}`,
    short_name: "भगवद्गीता",
    description: siteConfig.description,
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fdfbf7",
    theme_color: "#fdfbf7",
    lang: "mr",
    dir: "ltr",
    categories: ["education", "books"],
    icons: [
      {
        src: "/images/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/images/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/images/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
