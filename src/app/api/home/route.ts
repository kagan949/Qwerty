import { jsonOk, guard } from "@/lib/api-helpers";
import { buildHomePayload } from "@/services/home";
import { readStaleCache, writeCache } from "@/database/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = guard(request, { scope: "home", limit: 40, windowMs: 60_000 });
  if (limited) return limited;

  try {
    const payload = await buildHomePayload();
    const anyOk = payload.sources.some((source) => source.ok) && payload.sections.length > 1;
    if (anyOk) {
      await writeCache("home", payload, 10 * 60 * 1000);
      return jsonOk(payload, { cacheSeconds: 300 });
    }
    const stale = await readStaleCache<typeof payload>("home");
    return jsonOk(stale ?? payload, { cacheSeconds: 0 });
  } catch {
    const stale = await readStaleCache<Awaited<ReturnType<typeof buildHomePayload>>>("home");
    if (stale) return jsonOk(stale, { cacheSeconds: 0 });
    return jsonOk({ sections: [], sources: [], generatedAt: Date.now() }, { cacheSeconds: 0 });
  }
}
