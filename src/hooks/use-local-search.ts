"use client";

import { useMemo } from "react";
import Fuse from "fuse.js";
import { useLibraryStore } from "@/store/library-store";
import type { Track } from "@/types";

/**
 * Instant, offline-capable search over the user's own library (uploads +
 * favourites + playlist tracks). Fuse handles typo tolerance.
 */
export function useLocalSearch(query: string, limit = 8): { tracks: Track[]; total: number } {
  const localTracks = useLibraryStore((state) => state.localTracks);
  const favorites = useLibraryStore((state) => state.favorites);
  const playlists = useLibraryStore((state) => state.playlists);

  const pool = useMemo(() => {
    const map = new Map<string, Track>();
    for (const track of [...localTracks, ...favorites, ...playlists.flatMap((p) => p.tracks)]) {
      if (!map.has(track.id)) map.set(track.id, track);
    }
    return [...map.values()];
  }, [favorites, localTracks, playlists]);

  const fuse = useMemo(
    () =>
      new Fuse(pool, {
        keys: [
          { name: "title", weight: 0.5 },
          { name: "artist", weight: 0.3 },
          { name: "album", weight: 0.15 },
          { name: "genre", weight: 0.05 },
        ],
        threshold: 0.36,
        ignoreLocation: true,
        minMatchCharLength: 2,
      }),
    [pool],
  );

  return useMemo(() => {
    const trimmed = query.trim();
    if (trimmed.length < 1) return { tracks: [], total: 0 };
    const results = fuse.search(trimmed);
    return { tracks: results.slice(0, limit).map((r) => r.item), total: results.length };
  }, [fuse, limit, query]);
}
