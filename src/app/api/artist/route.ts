import { jsonError, jsonOk, guard, sanitizeQuery } from "@/lib/api-helpers";
import { jamendoArtistTracks } from "@/services/jamendo";
import { searchArchive } from "@/services/archive";
import { readStaleCache, writeCache } from "@/database/cache";
import type { Track } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = guard(request, { scope: "artist", limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const id = sanitizeQuery(searchParams.get("id"), 240);
  const name = sanitizeQuery(searchParams.get("name"), 200);
  if (!id && !name) return jsonError("missing_id", 400);

  const cacheKey = `artist:${id || name}`;
  const cached = await readStaleCache<{ tracks: Track[] }>(cacheKey);
  if (cached) return jsonOk({ ...cached }, { cacheSeconds: 600 });

  try {
    let tracks: Track[] = [];
    if (id.startsWith("jamendo-artist:")) {
      tracks = await jamendoArtistTracks(id.replace("jamendo-artist:", ""), 50);
    } else if (name) {
      const archive = await searchArchive(`creator:(${name})`, 10);
      tracks = archive.tracks;
    }
    if (tracks.length === 0) return jsonError("artist_empty", 404);
    await writeCache(cacheKey, { tracks }, 60 * 60 * 1000);
    return jsonOk({ id, name, tracks }, { cacheSeconds: 600 });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "artist_failed", 502);
  }
}
