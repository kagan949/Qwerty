import { NextResponse } from "next/server";
import { guard } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_SUFFIXES = [".archive.org", ".imgjam.com", ".jamendo.com", ".jamendo.net"];

function allowed(hostname: string) {
  const host = hostname.toLowerCase();
  return ALLOWED_SUFFIXES.some((suffix) => host === suffix.slice(1) || host.endsWith(suffix));
}

/**
 * Artwork proxy — keeps third-party image hosts from seeing a direct browser
 * request (privacy), lets us enforce content-type/size limits, and gives
 * album art a stable, cacheable same-origin URL.
 */
export async function GET(request: Request) {
  const limited = guard(request, { scope: "artwork", limit: 240, windowMs: 60_000 });
  if (limited) return limited;

  const raw = new URL(request.url).searchParams.get("src");
  let url: URL;
  try {
    url = new URL(raw ?? "");
  } catch {
    return NextResponse.json({ error: "invalid_source" }, { status: 400 });
  }
  if (url.protocol !== "https:" || !allowed(url.hostname)) {
    return NextResponse.json({ error: "invalid_source" }, { status: 400 });
  }

  try {
    const upstream = await fetch(url, {
      headers: { "user-agent": "VYBE/1.0", accept: "image/*" },
      cache: "no-store",
    });
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "upstream_error" }, { status: 502 });
    }
    const contentType = upstream.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "not_an_image" }, { status: 415 });
    }
    const contentLength = Number(upstream.headers.get("content-length") ?? "0");
    if (contentLength > 12 * 1024 * 1024) {
      return NextResponse.json({ error: "image_too_large" }, { status: 413 });
    }
    return new Response(upstream.body, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=604800, stale-while-revalidate=2592000, immutable",
        "x-content-type-options": "nosniff",
        "content-security-policy": "default-src 'none'; sandbox",
      },
    });
  } catch {
    return NextResponse.json({ error: "upstream_error" }, { status: 502 });
  }
}
