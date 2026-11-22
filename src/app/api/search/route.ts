import { jsonError, jsonOk, guard, sanitizeQuery } from "@/lib/api-helpers";
import { searchCatalog } from "@/services/search";
import type { SearchResults } from "@/types";
import { readStaleCache, writeCache } from "@/database/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = guard(request, { scope: "search", limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const query = sanitizeQuery(searchParams.get("q"), 120);
  if (!query) return jsonError("missing_query", 400);
  if (query.length < 2) return jsonOk({ tracks: [], albums: [], artists: [], playlists: [], sources: [] });

  const cacheKey = `search:${query.toLowerCase()}`;
  let results: Awaited<ReturnType<typeof searchCatalog>> | null = null;
  try {
    results = await searchCatalog(query, 20);
    const anyOk = results.sources.some((source) => source.ok);
    if (anyOk) {
      await writeCache(cacheKey, results, 5 * 60 * 1000);
      return jsonOk(results, { cacheSeconds: 120 });
    }
    const stale = await readStaleCache<SearchResults>(cacheKey);
    if (stale) return jsonOk({ ...stale, sources: results.sources }, { cacheSeconds: 0 });
    return jsonOk(results, { cacheSeconds: 0 });
  } catch (error) {
    const stale = await readStaleCache<SearchResults>(cacheKey);
    if (stale) return jsonOk(stale, { cacheSeconds: 0 });
    return jsonError(error instanceof Error ? error.message : "search_failed", 502);
  }
}
