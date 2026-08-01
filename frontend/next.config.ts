import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Next.js from redirecting trailing-slash URLs (e.g. /api/hire/settings/)
  // to their non-slash equivalents. Without this, Next.js removes the slash, Django's
  // APPEND_SLASH adds it back, and the browser loops until ERR_TOO_MANY_REDIRECTS.
  skipTrailingSlashRedirect: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.scootershop.com.au",
        pathname: "/media/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/media/**",
      },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 31,

    // Trimmed from the defaults, which emit 10+ srcset candidates per responsive
    // image. Nothing on the site is laid out wider than ~1400px, so 2048 covers
    // a 2x retina hero and 3840 was only ever downloaded by 4K displays.
    // Dropping the redundant intermediate steps costs a little granularity and
    // saves a large amount of markup on image-dense pages.
    deviceSizes: [640, 828, 1080, 1440, 2048],
    imageSizes: [32, 64, 128, 256, 384],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      // Step 1 of the booking flow moved onto /service; the wizard's remaining
      // steps live at /service-booking/details (noindexed). 301 the old
      // booking URL so its links and index entry transfer to /service.
      {
        source: "/service-booking",
        destination: "/service",
        permanent: true,
      },
    ];
  },

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
