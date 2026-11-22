import { jsonOk, guard } from "@/lib/api-helpers";
import { GENRES } from "@/lib/constants";
import { mixesToCurated, MIXES } from "@/services/curated";
import { archivePopular } from "@/services/archive";
import { readStaleCache, writeCache } from "@/database/cache";
import type { ExplorePayload, SourceStatus } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = guard(request, { scope: "explore", limit: 40, windowMs: 60_000 });
  if (limited) return limited;

  const cached = await readStaleCache<ExplorePayload>("explore");
  if (cached) return jsonOk(cached, { cacheSeconds: 300 });

  let collections: ExplorePayload["collections"] = [];
  let archiveOk = true;
  try {
    collections = await archivePopular(12);
  } catch {
    archiveOk = false;
  }

  const sources: SourceStatus[] = [
    {
      id: "jamendo",
      name: "Jamendo",
      ok: true,
      license: "Creative Commons",
      homepage: "https://www.jamendo.com",
    },
    {
      id: "archive",
      name: "Internet Archive",
      ok: archiveOk,
      license: "Public domain / open licenses",
      homepage: "https://archive.org",
    },
  ];

  const payload: ExplorePayload = {
    mixes: mixesToCurated(MIXES),
    genres: GENRES,
    collections,
    sources,
  };
  await writeCache("explore", payload, 15 * 60 * 1000);
  return jsonOk(payload, { cacheSeconds: 600 });
}
