"use client";

import { memo } from "react";
import { Heart, MoreHorizontal, Pause, Play } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { useLibraryStore } from "@/store/library-store";
import { usePlayerStore } from "@/store/player-store";
import { useUiStore } from "@/store/ui-store";
import { Artwork } from "@/components/music/artwork";
import { cn, formatTime } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";
import type { Track } from "@/types";

interface TrackRowProps {
  track: Track;
  index: number;
  onPlay: (track: Track) => void;
  compact?: boolean;
  showAlbum?: boolean;
  showArtwork?: boolean;
  showSource?: boolean;
  activeContextId?: string | null;
}

export const TrackRow = memo(function TrackRow({
  track,
  index,
  onPlay,
  compact,
  showAlbum = true,
  showArtwork = true,
  showSource,
  activeContextId,
}: TrackRowProps) {
  const { t } = useI18n();
  const isFavorite = useLibraryStore((state) => state.favoriteIds.has(track.id));
  const toggleFavorite = useLibraryStore((state) => state.toggleFavorite);
  const openContextMenu = useUiStore((state) => state.openContextMenu);
  const currentTrack = usePlayerStore((state) => state.queue[state.index] ?? null);
  const playing = usePlayerStore((state) => state.status === "playing");
  const isActive = currentTrack?.id === track.id;

  const handleFavorite = async (event: React.MouseEvent) => {
    event.stopPropagation();
    const added = await toggleFavorite(track);
    toast.success(added ? t("toast.favoriteAdded") : t("toast.favoriteRemoved"), { id: `fav-${track.id}` });
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onPlay(track)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onPlay(track);
        }
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        openContextMenu(track, event.clientX, event.clientY);
      }}
      className={cn(
        "group flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 transition-colors",
        "hover:bg-white/6 focus-visible:bg-white/6 focus-visible:outline-none",
        isActive && "bg-white/8",
        compact && "py-1.5",
      )}
      aria-label={`${track.title} — ${track.artist}`}
      data-context={activeContextId ?? undefined}
    >
      <div className="relative w-9 shrink-0 text-center">
        <span
          className={cn(
            "text-[13px] tabular-nums text-muted-foreground transition-opacity group-hover:opacity-0",
            isActive && "text-primary opacity-0",
          )}
        >
          {index + 1}
        </span>
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100",
            isActive && "opacity-100",
          )}
        >
          {isActive && playing ? (
            <span className="eq text-primary" aria-hidden>
              <span /><span /><span /><span />
            </span>
          ) : (
            <Play className="size-3.5 fill-current" />
          )}
        </span>
      </div>

      {showArtwork && (
        <Artwork track={track} className="size-10 shrink-0" rounded="rounded-lg" />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={cn("truncate text-[13.5px] font-medium", isActive && "text-primary")}>{track.title}</p>
          {showSource && (
            <Badge variant={track.source === "local" ? "local" : track.source === "jamendo" ? "jamendo" : "archive"} className="hidden sm:inline-flex">
              {t(`sources.${track.source === "local" ? "local" : track.source === "jamendo" ? "jamendo" : "archive"}`)}
            </Badge>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">{track.artist}</p>
      </div>

      {showAlbum && (
        <p className="hidden w-[22%] truncate text-xs text-muted-foreground lg:block">
          {track.album ?? "—"}
        </p>
      )}

      <button
        type="button"
        onClick={handleFavorite}
        aria-label={isFavorite ? t("player.removeFromFavorites") : t("player.addToFavorites")}
        aria-pressed={isFavorite}
        className={cn(
          "rounded-full p-1.5 text-muted-foreground transition-all hover:bg-white/10 hover:text-foreground",
          isFavorite ? "opacity-100 text-primary" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
        )}
      >
        <Heart className={cn("size-4", isFavorite && "fill-current")} />
      </button>

      <span className="w-10 text-right text-[11.5px] tabular-nums text-muted-foreground">
        {formatTime(track.duration)}
      </span>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
          openContextMenu(track, rect.left, rect.bottom + 4);
        }}
        aria-label={t("common.moreOptions")}
        className="rounded-full p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-white/10 hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100"
      >
        <MoreHorizontal className="size-4" />
      </button>
    </div>
  );
});

export function PlayButtonOverlay({ playing, onClick }: { playing: boolean; onClick: (event: React.MouseEvent) => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={playing ? "Pause" : "Play"}
      className={cn(
        "grid size-11 place-items-center rounded-full",
        "bg-primary text-white shadow-[0_10px_30px_-8px_rgb(124_58_237/0.9)]",
        "translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:translate-y-0",
        playing && "translate-y-0 opacity-100",
      )}
    >
      {playing ? <Pause className="size-4 fill-current" /> : <Play className="size-4 translate-x-0.5 fill-current" />}
    </button>
  );
}
