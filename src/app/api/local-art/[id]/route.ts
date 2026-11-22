import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cover art for uploads is a Blob inside IndexedDB; the UI renders it through
 * `components/music/artwork.tsx`, which resolves a local object URL. This route
 * exists so the URL shape is stable and fails safely when requested directly.
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return NextResponse.json(
    { error: "local_asset_is_client_side", id },
    { status: 404, headers: { "cache-control": "no-store" } },
  );
}
