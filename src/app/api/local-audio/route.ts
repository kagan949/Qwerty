import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Uploaded files live in IndexedDB, which only the browser can read. This route
 * documents the contract and fails gracefully if a stale URL is requested on the
 * server; the client resolves `local:<id>` ids through `lib/audio-source.ts`
 * (an in-memory object URL handed to Howler) so playback never round-trips
 * through the network and keeps working offline.
 */
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  return NextResponse.json(
    {
      error: "local_asset_is_client_side",
      message:
        "Uploaded audio is stored in IndexedDB on the device. Playback is resolved in the browser.",
      id,
    },
    { status: 404, headers: { "cache-control": "no-store" } },
  );
}
