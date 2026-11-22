import { jsonError, jsonOk, guard, sanitizeQuery, parseQueryNumber } from "@/lib/api-helpers";
import { GENRES, JAMENDO_TAG_OVERRIDES } from "@/lib/constants";
import { jamendoTracksByTag } from "@/services/jamendo";
import { readStaleCache, writeCache } from "@/database/cache";
import type { Track } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = guard(request, { scope: "genre", limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const slug = sanitizeQuery(searchParams.get("slug"), 40);
  const limit = parseQueryNumber(searchParams.get("limit"), 30, 1, 60);
  const genre = GENRES.find((item) => item.slug === slug);
  if (!genre) return jsonError("genre_not_found", 404);

  const cacheKey = `genre:${genre.slug}:${limit}`;
  const cached = await readStaleCache<{ tracks: Track[] }>(cacheKey);
  if (cached) return jsonOk({ genre, ...cached }, { cacheSeconds: 600 });

  try {
    const tag = JAMENDO_TAG_OVERRIDES[genre.slug] ?? genre.slug;
    const tracks = await jamendoTracksByTag(tag, limit);
    await writeCache(cacheKey, { tracks }, 20 * 60 * 1000);
    return jsonOk({ genre, tracks }, { cacheSeconds: 300 });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "genre_failed", 502);
  }
}
