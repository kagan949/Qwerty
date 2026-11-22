import type { NextConfig } from "next";

/**
 * `frame-ancestors` replaces X-Frame-Options on purpose: SAMEORIGIN would also
 * block the hosted preview shells VYBE is embedded in (Arena's `*.e2b.app`
 * proxies and Vercel preview domains), while a plain `*` would drop clickjacking
 * protection entirely. Only the two real embedding origins are allowed.
 */
const frameAncestors = [
  "'self'",
  "https://*.e2b.app",
  "https://*.vercel.app",
].join(" ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Content-Security-Policy", value: `frame-ancestors ${frameAncestors}` },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
    // Album art arrives from many legal public catalogues; serve it unoptimized
    // through the proxy route so no third-party optimizer quota is required.
    unoptimized: true,
  },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600" }],
      },
    ];
  },
};

export default nextConfig;
