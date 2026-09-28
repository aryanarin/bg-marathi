import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/env";

/**
 * Sitemap for public routes.
 *
 * Phase 1 lists only the static public pages. Once chapters and verses are in
 * the database (Phase 4), public chapter and verse URLs are appended here by
 * querying them with the anon client, which is safe because those rows are
 * world-readable by design.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const lastModified = new Date();

  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${siteUrl}/about`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/chapters`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];
}
