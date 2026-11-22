import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/manrope";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";
import { AppShell } from "@/components/layout/app-shell";

/**
 * Prefer an explicit public URL, then Vercel's production alias, then the
 * per-deployment URL, and only fall back to localhost in local dev.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.startsWith("http") ? explicit : `https://${explicit}`;
  const vercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export const metadata: Metadata = {
  // Absolute URLs are required for Open Graph images. Vercel injects the real
  // deployment host at build time, so no manual configuration is needed; the
  // explicit env var still wins for custom domains.
  metadataBase: new URL(resolveSiteUrl()),
  title: {
    default: "VYBE — Free music streaming",
    template: "%s · VYBE",
  },
  description:
    "Discover millions of free, legally licensed tracks. Stream, build playlists and upload your own music — no account needed.",
  applicationName: "VYBE",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "VYBE",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/icons/icon-192.png",
  },
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: "website",
    title: "VYBE — Free music streaming",
    description: "Millions of legally licensed tracks. No account. Free forever.",
    siteName: "VYBE",
    url: "/",
    locale: "en_US",
    images: [{ url: "/images/og-image.png", width: 1200, height: 630, alt: "VYBE — free music streaming" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "VYBE — Free music streaming",
    description: "Millions of legally licensed tracks. No account. Free forever.",
    images: ["/images/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
    { media: "(prefers-color-scheme: light)", color: "#f7f7fa" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
