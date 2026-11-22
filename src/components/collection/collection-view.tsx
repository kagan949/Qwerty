"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Shuffle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/i18n/provider";
import { usePlayer } from "@/components/providers/player-provider";
import { usePlayerStore } from "@/store/player-store";
import { TrackRow } from "@/components/music/track-row";
import { CoverImage } from "@/components/music/artwork";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton, TrackRowSkeleton } from "@/components/ui/skeleton";
import { formatDurationLong } from "@/lib/utils";
import type { Track } from "@/types";

/** Fisher–Yates: an unbiased shuffle (sorting with a random comparator is not). */
function shuffleCopy(items: Track[]): Track[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

interface CollectionResponse {
  tracks: Track[];
  title?: string;
  name?: string;
  artist?: string;
}

interface CollectionViewProps {
  endpoint: string;
  title: string;
  subtitle?: string;
  artworkSeed: string;
  artworkUrl?: string;
  badge?: { label: string; variant: "jamendo" | "archive" | "curated" | "local" };
  backHref?: string;
  emptyFallback?: React.ReactNode;
  kindLabel?: string;
}

/**
 * Shared layout for album / mix / genre / artist pages: hero header, play +
 * shuffle, track table. Data comes from the same rate-limited API layer, so
 * every surface behaves consistently and degrades gracefully.
 */
export function CollectionView({
  endpoint,
  title,
  subtitle,
  artworkSeed,
  artworkUrl,
  badge,
  backHref,
  emptyFallback,
  kindLabel,
}: CollectionViewProps) {
  const { t, intlLocale } = useI18n();
  const router = useRouter();
  const { playCollection, playTrackList } = usePlayer();
  const current = usePlayerStore((state) => state.queue[state.index] ?? null);
  const playing = usePlayerStore((state) => state.status === "playing");
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["collection", endpoint],
    queryFn: async () => {
      const response = await fetch(endpoint, { headers: { accept: "application/json" } });
      if (!response.ok) throw new Error("collection_failed");
      return (await response.json()) as CollectionResponse;
    },
    staleTime: 10 * 60_000,
  });

  useEffect(() => {
    if (data?.title || data?.name) document.title = `${data.title ?? data.name} · VYBE`;
  }, [data]);

  const tracks = data?.tracks ?? [];
  const totalDuration = tracks.reduce((sum, track) => sum + (track.duration || 0), 0);
  const hasTracks = tracks.length > 0;
  const sourceKey = tracks[0]?.source ?? "curated";

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[380px] overflow-hidden opacity-60">
        <div className="absolute inset-0 blur-[100px]">
          <CoverImage src={artworkUrl} seed={artworkSeed} className="size-full" rounded="rounded-none" alt="" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/70 to-background" />
      </div>

      <div className="relative px-4 pt-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => (backHref ? router.push(backHref) : router.back())}
            aria-label={t("common.cancel")}
          >
            <ArrowLeft className="size-4" />
          </Button>
          {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
        </div>

        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end"
        >
          <CoverImage
            src={artworkUrl}
            seed={artworkSeed}
            className="size-[168px] shrink-0 shadow-[0_30px_80px_-40px_rgb(0_0_0/0.95)] sm:size-[196px]"
            rounded="rounded-2xl"
            alt={title}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {kindLabel ?? t("playlist.yourPlaylist")}
            </p>
            <h1 className="mt-1 font-display text-[28px] font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-[40px]">
              {title}
            </h1>
            {subtitle && <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">{subtitle}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
              <span>
                {tracks.length} {t("common.tracks").toLowerCase()}
              </span>
              {totalDuration > 0 && (
                <>
                  <span className="size-1 rounded-full bg-muted-foreground/50" />
                  <span>{formatDurationLong(totalDuration, intlLocale.slice(0, 2))}</span>
                </>
              )}
              {hasTracks && (
                <>
                  <span className="size-1 rounded-full bg-muted-foreground/50" />
                  <span>{t(`sources.${sourceKey}`)}</span>
                </>
              )}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                variant="gradient"
                size="lg"
                disabled={!hasTracks}
                onClick={() => void playCollection(tracks, `collection:${endpoint}`)}
              >
                <Play className="size-4 fill-current" /> {t("library.playAll")}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                disabled={!hasTracks}
                onClick={() => {
                  if (!usePlayerStore.getState().shuffle) toggleShuffle();
                  void playTrackList(shuffleCopy(tracks), 0, `collection:${endpoint}`);
                }}
              >
                <Shuffle className="size-4" /> {t("library.shufflePlay")}
              </Button>
            </div>
          </div>
        </motion.header>

        <div className="mt-8">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-40" />
              <TrackRowSkeleton count={8} />
            </div>
          ) : isError ? (
            <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-5">
              <p className="text-[13px] font-medium text-amber-200">{t("errors.sourceUnavailable")}</p>
              <p className="mt-1 text-[12px] text-amber-200/80">{t("errors.sourceUnavailableHint")}</p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={() => void refetch()}>
                {t("common.retry")}
              </Button>
            </div>
          ) : !hasTracks ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-[13px] text-muted-foreground">
              {emptyFallback ?? t("playlist.emptyTitle")}
            </div>
          ) : (
            <div className="space-y-0.5 pb-4">
              <div className="mb-1 hidden items-center gap-3 border-b border-white/6 px-2 pb-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:flex">
                <span className="w-9 text-center">#</span>
                <span className="w-10" />
                <span className="flex-1">{t("common.title")}</span>
                <span className="hidden w-[22%] lg:block">{t("common.album")}</span>
                <span className="w-10 text-right">{t("common.duration")}</span>
                <span className="w-7" />
              </div>
              {tracks.map((track, index) => (
                <div key={`${track.id}-${index}`} className="relative">
                  <TrackRow
                    track={track}
                    index={index}
                    onPlay={() => void playTrackList(tracks, index, `collection:${endpoint}`)}
                    showSource={false}
                  />
                  {current?.id === track.id && playing && (
                    <span className="absolute right-14 top-1/2 hidden -translate-y-1/2 text-[10px] uppercase tracking-wider text-primary sm:block">
                      {t("player.queuePosition")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="pb-6 text-[11px] leading-relaxed text-muted-foreground/70">{t("explore.licensedNote")}</p>
      </div>
    </div>
  );
}
