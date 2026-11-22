"use client";

import { use, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, Heart, Play, ShieldCheck } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { usePlayer } from "@/components/providers/player-provider";
import { useLibraryStore } from "@/store/library-store";
import { Artwork } from "@/components/music/artwork";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTime } from "@/lib/utils";
import { toast } from "@/lib/toast";
import type { Track } from "@/types";

export default function TrackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const decoded = decodeURIComponent(id);
  const { t } = useI18n();
  const router = useRouter();
  const { playTrackList } = usePlayer();
  const isFavorite = useLibraryStore((state) => state.favoriteIds.has(decoded));
  const toggleFavorite = useLibraryStore((state) => state.toggleFavorite);

  const localTracks = useLibraryStore((state) => state.localTracks);
  const favorites = useLibraryStore((state) => state.favorites);
  const hydrated = useLibraryStore((state) => state.hydrated);
  const isRemoteId = decoded.startsWith("jamendo:") || decoded.startsWith("archive:");

  // Local uploads and favourites already live in memory, so try those first —
  // only catalogue ids need a network round-trip.
  const localMatch = useMemo(
    () =>
      localTracks.find((item) => item.id === decoded) ?? favorites.find((item) => item.id === decoded) ?? null,
    [decoded, localTracks, favorites],
  );

  const { data, isLoading } = useQuery({
    queryKey: ["track", decoded],
    queryFn: async () => {
      const response = await fetch(`/api/stats?id=${encodeURIComponent(decoded)}`);
      if (!response.ok) throw new Error("track_not_found");
      return (await response.json()) as { track: Track };
    },
    enabled: isRemoteId,
    retry: 1,
  });

  const track = localMatch ?? data?.track;
  const loading = !track && (isRemoteId ? isLoading : !hydrated);

  return (
    <div className="px-4 pt-4 sm:px-6 lg:px-8">
      <Button variant="ghost" size="icon-sm" onClick={() => router.back()} aria-label={t("common.cancel")}>
        <ArrowLeft className="size-4" />
      </Button>

      <div className="mx-auto mt-4 max-w-3xl">
        {loading ? (
          <div className="flex flex-col gap-6 sm:flex-row">
            <Skeleton className="size-56 shrink-0 rounded-3xl" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-10 w-40 rounded-full" />
            </div>
          </div>
        ) : !track ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
            <p className="font-display text-lg font-semibold">{t("errors.notFound")}</p>
            <p className="mt-1 text-[12.5px] text-muted-foreground">{t("toast.trackNotFound")}</p>
            <Button className="mt-4" variant="secondary" onClick={() => router.push("/search")}>
              {t("nav.search")}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
            <Artwork track={track} className="size-56 shrink-0 shadow-2xl" rounded="rounded-3xl" priority />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={track.source === "jamendo" ? "jamendo" : track.source === "archive" ? "archive" : "curated"}>
                  {t(`sources.${track.source}`)}
                </Badge>
                {track.license && <span className="text-[11px] text-muted-foreground">{track.license}</span>}
              </div>
              <h1 className="mt-2 font-display text-[28px] font-extrabold leading-tight tracking-tight">{track.title}</h1>
              <p className="mt-1 text-[14px] text-muted-foreground">{track.artist}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
                {track.album && <span>{track.album}</span>}
                <span>{formatTime(track.duration)}</span>
                {track.year && <span>{track.year}</span>}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="gradient" onClick={() => void playTrackList([track], 0, "track")}>
                  <Play className="size-4 fill-current" /> {t("common.play")}
                </Button>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    const added = await toggleFavorite(track);
                    toast.success(added ? t("toast.favoriteAdded") : t("toast.favoriteRemoved"));
                  }}
                >
                  <Heart className={isFavorite ? "size-4 fill-current text-primary" : "size-4"} />
                  {t("player.addToFavorites")}
                </Button>
                {track.sourceUrl && (
                  <Button variant="ghost" asChild>
                    <a href={track.sourceUrl} target="_blank" rel="noreferrer noopener">
                      <ExternalLink className="size-4" /> {t("player.sourceLabel")}
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-white/8 bg-card/40 p-4">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold">
            <ShieldCheck className="size-3.5 text-emerald-400" /> {t("player.licenseLabel")}
          </p>
          <p className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground">{t("credits.body")}</p>
          {track?.licenseUrl && (
            <a
              href={track.licenseUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-2 inline-flex items-center gap-1 text-[11.5px] text-primary hover:underline"
            >
              {track.license} <ExternalLink className="size-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
