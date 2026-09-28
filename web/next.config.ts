import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Typed `href` values for <Link> and router calls. Requires TypeScript.
  typedRoutes: true,

  // We intentionally do NOT enable `cacheComponents` (Partial Prerendering).
  // Reason: almost every authenticated page in this app is per-user and must be
  // rendered per request. The default model (dynamic as soon as `cookies()` is
  // read) gives us that guarantee with far less ceremony. Revisit only if we
  // later need to statically shell public marketing pages.

  // Audio is hosted externally (see docs/architecture.md). We never proxy or
  // optimise it, so no `images.remotePatterns` entry is needed for audio.
  // Verse artwork ships from /public, so the image optimiser stays local-only.
  images: {
    remotePatterns: [],
  },

  // Defence-in-depth headers. These complement (not replace) RLS and the
  // server-side authorization checks in the data access layer.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
