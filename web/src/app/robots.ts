import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private and per-user areas. These are already protected by auth; this
      // simply keeps them out of search results and crawl budget.
      disallow: [
        "/admin",
        "/dashboard",
        "/progress",
        "/quizzes",
        "/classes",
        "/api/",
        "/auth/",
        "/reset-password",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
