"use client";

import { useEffect, useState } from "react";
import { getDb } from "@/database/db";
import { artworkPlaceholder } from "@/lib/artwork-fallback";
import { cn } from "@/lib/utils";
import type { Track } from "@/types";

const blobCache = new Map<string, string>();

export function useLocalArtwork(track: Pick<Track, "id" | "isLocal" | "artwork">) {
  const localId = track.isLocal ? track.id.replace(/^local:/, "") : undefined;
  const [resolved, setResolved] = useState<{ localId: string; url: string } | undefined>();

  useEffect(() => {
    if (!localId) return;
    if (blobCache.has(localId)) return;
    let cancelled = false;
    void (async () => {
      try {
        const record = await getDb().localTracks.get(localId);
        if (!record?.cover || cancelled) return;
        const objectUrl = URL.createObjectURL(record.cover);
        blobCache.set(localId, objectUrl);
        setResolved({ localId, url: objectUrl });
      } catch {
        // No embedded cover — the generated placeholder is used instead.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [localId]);

  // Remote tracks and cached blobs resolve synchronously during render, so no
  // first frame flashes the placeholder.
  if (!localId) return track.artwork;
  return blobCache.get(localId) ?? (resolved?.localId === localId ? resolved.url : undefined);
}

interface ArtworkProps {
  track: Track;
  className?: string;
  rounded?: string;
  sizes?: string;
  priority?: boolean;
  alt?: string;
}

/**
 * Album art with three-tier fallback: local blob → remote URL → generated SVG.
 * Uses a plain <img> on purpose: art URLs are proxied, already sized by the
 * source and must work offline (next/image cannot optimise blob: URLs).
 */
export function Artwork({ track, className, rounded = "rounded-xl", alt, priority }: ArtworkProps) {
  const url = useLocalArtwork(track);
  // Track *which* src failed rather than a boolean, so switching tracks
  // automatically restores the new artwork without an effect.
  const [failedUrl, setFailedUrl] = useState<string | undefined>();
  const failed = Boolean(url) && failedUrl === url;
  const fallback = artworkPlaceholder(`${track.artist}-${track.title}`);

  return (
    <div className={cn("relative overflow-hidden bg-white/5", rounded, className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={!failed && url ? url : fallback}
        alt={alt ?? `${track.title} by ${track.artist}`}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        onError={() => setFailedUrl(url)}
        className="size-full object-cover transition-transform duration-500"
      />
    </div>
  );
}

interface CoverImageProps {
  src?: string;
  seed: string;
  className?: string;
  rounded?: string;
  alt?: string;
}

/** Generic cover (playlists, mixes, albums) with generated fallback. */
export function CoverImage({ src, seed, className, rounded = "rounded-xl", alt }: CoverImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | undefined>();
  const resolved = src && failedSrc !== src ? src : artworkPlaceholder(seed);
  return (
    <div className={cn("relative overflow-hidden bg-white/5", rounded, className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={resolved}
        alt={alt ?? seed}
        loading="lazy"
        decoding="async"
        onError={() => setFailedSrc(src)}
        className="size-full object-cover"
      />
    </div>
  );
}
