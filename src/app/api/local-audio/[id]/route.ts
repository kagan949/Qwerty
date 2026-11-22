import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Blob for an uploaded track. Bytes live in IndexedDB (per device), so the
 * authoritative URL is created in the browser via `lib/audio-source.ts`.
 * If someone opens this URL directly (old bookmark, share link) we answer with
 * a clear, non-crashing 404 that the player turns into a friendly message.
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return NextResponse.json(
    {
      error: "local_asset_is_client_side",
      message: "Uploaded audio is stored privately in this browser and cannot be fetched from a server.",
      id,
    },
    { status: 404, headers: { "cache-control": "no-store" } },
  );
}
