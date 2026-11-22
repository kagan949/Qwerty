import { jsonError, jsonOk, guard } from "@/lib/api-helpers";
import { getMix } from "@/services/curated";
import { jamendoTracksByTag } from "@/services/jamendo";
import { archiveCollectionItems } from "@/services/archive";
import { readStaleCache, writeCache } from "@/database/cache";
import type { Track } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = guard(request, { scope: "mix", limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  const id = new URL(request.url).searchParams.get("id");
  const mix = id ? getMix(id) : undefined;
  if (!mix) return jsonError("mix_not_found", 404);

  const cacheKey = `mix:${mix.id}`;
  const cached = await readStaleCache<{ tracks: Track[] }>(cacheKey);
  if (cached) return jsonOk({ mix, ...cached }, { cacheSeconds: 600 });

  try {
    let tracks: Track[] = [];
    if (mix.source === "jamendo" && mix.query.tag) {
      tracks = await jamendoTracksByTag(mix.query.tag, 30);
    } else if (mix.source === "archive") {
      tracks = await archiveCollectionItems(mix.query.archiveQuery?.split(":")[1] ?? "audio_music", 24);
    }
    await writeCache(cacheKey, { tracks }, 20 * 60 * 1000);
    return jsonOk({ mix, tracks }, { cacheSeconds: 300 });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "mix_failed", 502);
  }
}
