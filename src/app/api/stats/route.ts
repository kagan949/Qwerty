import { jsonError, guard, jsonOk } from "@/lib/api-helpers";
import { jamendoTrackById } from "@/services/jamendo";
import { archiveItemFirstTracks } from "@/services/archive";
import type { Track } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Resolve a single track by its namespaced id (used for share links). */
export async function GET(request: Request) {
  const limited = guard(request, { scope: "track", limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  const id = new URL(request.url).searchParams.get("id") ?? "";
  try {
    let track: Track | null = null;
    if (id.startsWith("jamendo:")) {
      track = await jamendoTrackById(id.replace("jamendo:", ""));
    } else if (id.startsWith("archive:")) {
      const [, rest] = id.split("archive:");
      const [identifier] = rest.split("/");
      const tracks = await archiveItemFirstTracks(identifier, 50);
      track = tracks.find((item) => item.id === id) ?? null;
    }
    if (!track) return jsonError("not_found", 404);
    return jsonOk({ track }, { cacheSeconds: 3600 });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "failed", 502);
  }
}
