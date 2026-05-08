import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Next.js from redirecting trailing-slash URLs (e.g. /api/hire/settings/)
  // to their non-slash equivalents. Without this, Next.js removes the slash, Django's
  // APPEND_SLASH adds it back, and the browser loops until ERR_TOO_MANY_REDIRECTS.
  skipTrailingSlashRedirect: true,

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.DJANGO_API_URL ?? "http://localhost:8000"}/api/:path*/`,
      },
    ];
  },
};

export default nextConfig;
