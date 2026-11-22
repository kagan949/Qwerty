import type { IAudioMetadata } from "music-metadata";

export interface ParsedAudioMetadata {
  title: string;
  artist: string;
  album?: string;
  genre?: string;
  year?: number;
  duration: number;
  bitrate?: number;
  cover?: Blob;
}

function humanize(value: string): string {
  return value
    .replace(/\.[^.]+$/, "")
    .replace(/[_]+/g, " ")
    .replace(/\s*-\s*/g, " — ")
    .replace(/\s+/g, " ")
    .trim();
}

/** "Artist - Title" / "01 Artist - Title" filename heuristics. */
function parseFileName(fileName: string): { artist?: string; title: string } {
  const base = humanize(fileName).replace(/^\d{1,3}[\s.\-]+/, "");
  if (base.includes(" — ")) {
    const [artist, ...rest] = base.split(" — ");
    const title = rest.join(" — ").trim();
    if (artist.trim() && title) return { artist: artist.trim(), title };
  }
  return { title: base || "Untitled" };
}

/**
 * Reads tags with `music-metadata` in the browser. It only needs the Blob, so
 * large files are never fully loaded into JS memory by our code. Any parser
 * failure degrades to filename-derived metadata — uploads never fail because of
 * a malformed tag.
 */
export async function parseAudioMetadata(file: File): Promise<ParsedAudioMetadata> {
  const fallback = parseFileName(file.name);
  try {
    const { parseBlob } = await import("music-metadata");
    // Only read ~1.5 MB of tag data: enough for ID3v2/APEv2 artwork headers,
    // avoids scanning multi-hundred-MB FLAC files twice.
    const metadata: IAudioMetadata = await parseBlob(file, { duration: true, skipPostHeaders: true });
    const common = metadata.common ?? {};
    const format = metadata.format ?? {};
    const cover = common.picture?.[0];
    let coverBlob: Blob | undefined;
    if (cover?.data) {
      const bytes = cover.data instanceof Uint8Array ? cover.data : new Uint8Array(cover.data as ArrayBufferLike);
      coverBlob = new Blob([bytes as unknown as BlobPart], { type: cover.format || "image/jpeg" });
    }
    return {
      title: (common.title || fallback.title || "").trim(),
      artist: (common.artist || common.albumartist || common.artists?.[0] || fallback.artist || "").trim(),
      album: common.album?.trim() || undefined,
      genre: common.genre?.[0]?.trim() || undefined,
      year: common.year ?? undefined,
      duration: Math.round(format.duration ?? 0),
      bitrate: format.bitrate ? Math.round(format.bitrate / 1000) : undefined,
      cover: coverBlob,
    };
  } catch {
    return {
      title: fallback.title,
      artist: fallback.artist ?? "",
      duration: 0,
    };
  }
}

/** Probe playable duration in the browser when tags lack it (e.g. some WAVs). */
export function probeDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const audio = document.createElement("audio");
    const url = URL.createObjectURL(file);
    const cleanup = () => {
      audio.removeAttribute("src");
      audio.load();
      URL.revokeObjectURL(url);
    };
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      const duration = Number.isFinite(audio.duration) ? Math.round(audio.duration) : 0;
      cleanup();
      resolve(duration);
    };
    audio.onerror = () => {
      cleanup();
      resolve(0);
    };
    setTimeout(() => {
      cleanup();
      resolve(0);
    }, 8000);
    audio.src = url;
  });
}
