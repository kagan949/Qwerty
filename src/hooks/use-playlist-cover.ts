"use client";

import { useEffect, useState } from "react";
import type { Playlist } from "@/types";

const cache = new Map<string, string>();

/**
 * Resolve a playlist cover stored as a Blob (IndexedDB) into an object URL.
 *
 * The URL is derived during render whenever possible (URL covers and
 * already-minted blob URLs); only first-time blob→object-URL minting runs in an
 * effect, so no state is set synchronously for the common cases.
 */
export function useLocalPlaylistCover(playlist: Pick<Playlist, "id" | "coverBlob" | "coverUrl">) {
  const id = playlist.id;
  const known = playlist.coverUrl ?? cache.get(id);
  const [minted, setMinted] = useState<{ id: string; url: string } | undefined>();

  useEffect(() => {
    if (known || !playlist.coverBlob) return;
    let cancelled = false;
    // Queue the mint as a microtask: creating the URL itself is synchronous,
    // and setting state from an effect body would cascade an extra render.
    void Promise.resolve().then(() => {
      if (cancelled) return;
      const objectUrl = URL.createObjectURL(playlist.coverBlob as Blob);
      cache.set(id, objectUrl);
      setMinted({ id, url: objectUrl });
    });
    return () => {
      cancelled = true;
    };
  }, [id, known, playlist.coverBlob]);

  if (known) return known;
  if (minted?.id === id) return minted.url;
  return undefined;
}
