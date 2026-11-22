import type { Track } from "@/types";
import { getDb } from "@/database/db";

/**
 * Resolves a Track into something <audio>/Howler can actually play.
 *
 * - Remote catalogue tracks stream through the same-origin `/api/audio` proxy.
 * - Uploaded tracks are read from IndexedDB and exposed as an object URL. The
 *   URL is memoised so repeated plays don't re-read megabytes from disk, and is
 *   released on `revokeAllObjectUrls()` (page unload) to avoid leaks.
 */
const objectUrls = new Map<string, { url: string; createdAt: number }>();
const MAX_OBJECT_URLS = 12;

export async function resolvePlayableUrl(track: Track): Promise<string> {
  if (!track.isLocal) {
    if (!track.streamUrl) throw new Error("missing_stream_url");
    return track.streamUrl;
  }
  const localId = track.localId ?? track.id.replace(/^local:/, "");
  const cached = objectUrls.get(localId);
  if (cached) {
    // refresh LRU position
    objectUrls.delete(localId);
    objectUrls.set(localId, cached);
    return cached.url;
  }
  const record = await getDb().localTracks.get(localId);
  if (!record?.blob) throw new Error("local_file_missing");
  const url = URL.createObjectURL(record.blob);
  objectUrls.set(localId, { url, createdAt: Date.now() });
  while (objectUrls.size > MAX_OBJECT_URLS) {
    const oldest = objectUrls.keys().next().value;
    if (!oldest) break;
    const entry = objectUrls.get(oldest);
    if (entry) URL.revokeObjectURL(entry.url);
    objectUrls.delete(oldest);
  }
  return url;
}

export function releaseObjectUrls() {
  for (const entry of objectUrls.values()) URL.revokeObjectURL(entry.url);
  objectUrls.clear();
}

/** Cover art: local uploads resolve to an object URL, catalogue art is a URL. */
const coverUrls = new Map<string, string>();

export async function resolveArtworkUrl(track: Track): Promise<string | undefined> {
  if (!track.isLocal) return track.artwork;
  const localId = track.localId ?? track.id.replace(/^local:/, "");
  const cached = coverUrls.get(localId);
  if (cached) return cached;
  try {
    const record = await getDb().localTracks.get(localId);
    if (!record?.cover) return undefined;
    const url = URL.createObjectURL(record.cover);
    coverUrls.set(localId, url);
    return url;
  } catch {
    return undefined;
  }
}

export function releaseCoverUrls() {
  for (const url of coverUrls.values()) URL.revokeObjectURL(url);
  coverUrls.clear();
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    releaseObjectUrls();
    releaseCoverUrls();
  });
}
