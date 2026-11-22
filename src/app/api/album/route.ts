import { jsonError, jsonOk, guard, sanitizeQuery } from "@/lib/api-helpers";
import { jamendoAlbumTracks } from "@/services/jamendo";
import { archiveItemTracks } from "@/services/archive";
import { readStaleCache, writeCache } from "@/database/cache";
import type { Track } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = guard(request, { scope: "album", limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const id = sanitizeQuery(searchParams.get("id"), 240);
  const title = sanitizeQuery(searchParams.get("title"), 200);
  const artist = sanitizeQuery(searchParams.get("artist"), 200);
  if (!id) return jsonError("missing_id", 400);

  const cacheKey = `album:${id}`;
  const cached = await readStaleCache<{ tracks: Track[] }>(cacheKey);
  if (cached) return jsonOk({ ...cached }, { cacheSeconds: 600 });

  try {
    let tracks: Track[] = [];
    if (id.startsWith("jamendo-album:")) {
      tracks = await jamendoAlbumTracks(id.replace("jamendo-album:", ""), 60);
    } else if (id.startsWith("archive-item:")) {
      tracks = await archiveItemTracks(id.replace("archive-item:", ""));
    }
    if (tracks.length === 0) return jsonError("album_empty", 404);
    await writeCache(cacheKey, { tracks }, 60 * 60 * 1000);
    return jsonOk({ id, title, artist, tracks }, { cacheSeconds: 600 });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "album_failed", 502);
  }
}
