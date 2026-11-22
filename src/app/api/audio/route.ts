import { NextResponse } from "next/server";
import { guard } from "@/lib/api-helpers";
import { AUDIO_PROXY_HOSTS } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Audio proxy for licensed catalogue sources.
 *
 * Why a proxy instead of hot-linking?
 *  - Jamendo/IA occasionally restrict CORS for media elements and Web Audio
 *    (analyser) needs same-origin or permissive CORS. Proxying normalises that.
 *  - It gives us a single choke point for allow-listing hosts, so the endpoint
 *    can never be used as an open SSRF relay.
 *
 * Security: HTTPS-only, host allow-list, redirects followed manually, byte
 * ranges forwarded so seeking works without downloading the whole file.
 */

const EXTRA_HOSTS = (process.env.AUDIO_PROXY_ALLOWED_HOSTS?.split(",") ?? [])
  .map((host) => host.trim().toLowerCase())
  .filter(Boolean);

function allowedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (EXTRA_HOSTS.includes(host)) return true;
  return AUDIO_PROXY_HOSTS.some((candidate) => host === candidate || host.endsWith(`.${candidate}`)) ||
    host.endsWith(".archive.org") ||
    host.endsWith(".jamendo.com") ||
    host.endsWith(".jamendo.net") ||
    host.endsWith(".imgjam.com");
}

function validate(raw: string | null): URL | null {
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (!allowedHost(url.hostname)) return null;
  // No credentials, no odd ports
  if (url.username || url.password) return null;
  if (url.port && url.port !== "443") return null;
  return url;
}

async function fetchUpstream(url: URL, range: string | null, head: boolean): Promise<Response> {
  let current = url;
  for (let hop = 0; hop < 4; hop++) {
    const response = await fetch(current, {
      method: head ? "HEAD" : "GET",
      headers: {
        "user-agent": "VYBE/1.0 (+https://github.com/kagan949/Qwerty)",
        ...(range ? { range } : {}),
        ...(process.env.INTERNET_ARCHIVE_TOKEN && current.hostname.endsWith("archive.org")
          ? { "x-archive-token": process.env.INTERNET_ARCHIVE_TOKEN }
          : {}),
      },
      redirect: "manual",
      cache: "no-store",
    });

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) return response;
      const next = validate(new URL(location, current).toString());
      if (!next) throw new Error("redirect_not_allowed");
      current = next;
      continue;
    }
    return response;
  }
  throw new Error("too_many_redirects");
}

function upstreamError(status: number) {
  const text = status === 404 ? "not_found" : status === 403 ? "forbidden_upstream" : "upstream_error";
  return NextResponse.json({ error: text }, { status: status === 404 ? 404 : 502 });
}

export async function GET(request: Request) {
  const limited = guard(request, { scope: "audio", limit: 120, windowMs: 60_000 });
  if (limited) return limited;

  const target = validate(new URL(request.url).searchParams.get("src"));
  if (!target) return NextResponse.json({ error: "invalid_source" }, { status: 400 });

  const range = request.headers.get("range");
  try {
    const upstream = await fetchUpstream(target, range, false);
    if (!upstream.ok && upstream.status !== 206) return upstreamError(upstream.status);
    if (!upstream.body) return upstreamError(502);

    const headers = new Headers();
    const passthrough = [
      "content-type",
      "content-length",
      "content-range",
      "accept-ranges",
      "last-modified",
      "etag",
    ];
    for (const key of passthrough) {
      const value = upstream.headers.get(key);
      if (value) headers.set(key, value);
    }
    if (!headers.has("accept-ranges")) headers.set("accept-ranges", "bytes");
    headers.set("cache-control", "public, max-age=86400, stale-while-revalidate=604800");
    headers.set("x-content-type-options", "nosniff");
    headers.set("content-disposition", "inline");
    headers.set("access-control-allow-origin", "*");

    return new Response(upstream.body, { status: upstream.status, headers });
  } catch {
    return upstreamError(502);
  }
}

export async function HEAD(request: Request) {
  const limited = guard(request, { scope: "audio-head", limit: 200, windowMs: 60_000 });
  if (limited) return limited;
  const target = validate(new URL(request.url).searchParams.get("src"));
  if (!target) return new Response(null, { status: 400 });
  try {
    const upstream = await fetchUpstream(target, null, true);
    if (!upstream.ok) return new Response(null, { status: 502 });
    const headers = new Headers();
    for (const key of ["content-type", "content-length", "accept-ranges", "last-modified"]) {
      const value = upstream.headers.get(key);
      if (value) headers.set(key, value);
    }
    return new Response(null, { status: 200, headers });
  } catch {
    return new Response(null, { status: 502 });
  }
}
