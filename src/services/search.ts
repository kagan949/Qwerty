import type { SearchResults, SourceStatus, Track, Album, Artist } from "@/types";
import { searchJamendo } from "@/services/jamendo";
import { searchArchive } from "@/services/archive";

interface TimedResult<T> {
  value: T | null;
  ok: boolean;
  ms: number;
  error?: string;
}

async function timed<T>(fn: () => Promise<T>): Promise<TimedResult<T>> {
  const start = Date.now();
  try {
    const value = await fn();
    return { value, ok: true, ms: Date.now() - start };
  } catch (error) {
    return {
      value: null,
      ok: false,
      ms: Date.now() - start,
      error: error instanceof Error ? error.message : "unknown",
    };
  }
}

function dedupeTracks(tracks: Track[]): Track[] {
  const seen = new Set<string>();
  return tracks.filter((track) => {
    const key = `${track.title.toLowerCase()}|${track.artist.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dedupeBy<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => (seen.has(item.id) ? false : (seen.add(item.id), true)));
}

export async function searchCatalog(query: string, limit = 20): Promise<SearchResults> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { tracks: [], albums: [], artists: [], playlists: [], sources: [] };
  }

  const [jamendo, archive] = await Promise.all([
    timed(() => searchJamendo(trimmed, limit)),
    timed(() => searchArchive(trimmed, Math.min(limit, 12))),
  ]);

  const sources: SourceStatus[] = [
    {
      id: "jamendo",
      name: "Jamendo",
      ok: jamendo.ok,
      latencyMs: jamendo.ms,
      error: jamendo.error,
      license: "Creative Commons",
      homepage: "https://www.jamendo.com",
    },
    {
      id: "archive",
      name: "Internet Archive",
      ok: archive.ok,
      latencyMs: archive.ms,
      error: archive.error,
      license: "Public domain / open licenses",
      homepage: "https://archive.org",
    },
  ];

  const tracks: Track[] = dedupeTracks([...(jamendo.value?.tracks ?? []), ...(archive.value?.tracks ?? [])]);
  const albums: Album[] = dedupeBy([...(jamendo.value?.albums ?? []), ...(archive.value?.albums ?? [])]);
  const artists: Artist[] = dedupeBy(jamendo.value?.artists ?? []);

  return {
    tracks: tracks.slice(0, limit * 2),
    albums: albums.slice(0, limit),
    artists: artists.slice(0, Math.min(limit, 10)),
    playlists: [],
    sources,
  };
}
