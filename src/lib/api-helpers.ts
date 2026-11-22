import { NextResponse } from "next/server";
import { clientKey, rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export function jsonOk<T>(data: T, init?: { cacheSeconds?: number; rateLimitResult?: ReturnType<typeof rateLimit> }) {
  const headers: Record<string, string> = {
    "content-type": "application/json; charset=utf-8",
  };
  if (init?.cacheSeconds) {
    headers["cache-control"] = `public, s-maxage=${init.cacheSeconds}, stale-while-revalidate=${init.cacheSeconds * 4}`;
  }
  if (init?.rateLimitResult) Object.assign(headers, rateLimitHeaders(init.rateLimitResult));
  return NextResponse.json(data, { headers });
}

export function jsonError(message: string, status = 500, extra?: Record<string, unknown>) {
  return NextResponse.json(
    { error: message, ...extra },
    { status, headers: { "content-type": "application/json; charset=utf-8" } },
  );
}

export interface GuardOptions {
  scope: string;
  limit: number;
  windowMs: number;
}

/** Returns a 429 response when the caller exceeds the budget, otherwise null. */
export function guard(request: Request, options: GuardOptions) {
  const result = rateLimit(clientKey(request, options.scope), options.limit, options.windowMs);
  if (!result.allowed) {
    return jsonError("rate_limited", 429, { retryAfter: result.retryAfterSeconds });
  }
  return null;
}

export function parseQueryNumber(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.trunc(parsed), min), max);
}

export function sanitizeQuery(value: string | null, max = 120): string {
  if (!value) return "";
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}
