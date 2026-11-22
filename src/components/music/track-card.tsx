"use client";

import { usePlayerStore } from "@/store/player-store";
import { useLibraryStore } from "@/store/library-store";
import { useUiStore } from "@/store/ui-store";
import { useI18n } from "@/i18n/provider";
import { Artwork } from "@/components/music/artwork";
import { PlayButtonOverlay } from "@/components/music/track-row";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { Heart, MoreHorizontal } from "lucide-react";
import type { Track } from "@/types";

interface TrackCardProps {
  track: Track;
  onPlay: (track: Track) => void;
  className?: string;
  priority?: boolean;
}

export function TrackCard({ track, onPlay, className, priority }: TrackCardProps) {
  const { t } = useI18n();
  const current = usePlayerStore((state) => state.queue[state.index] ?? null);
  const playing = usePlayerStore((state) => state.status === "playing");
  const isActive = current?.id === track.id;
  const isFavorite = useLibraryStore((state) => state.favoriteIds.has(track.id));
  const toggleFavorite = useLibraryStore((state) => state.toggleFavorite);
  const openContextMenu = useUiStore((state) => state.openContextMenu);

  return (
    <article
      className={cn(
        "group relative flex cursor-pointer flex-col rounded-2xl border border-transparent p-2 transition-all duration-300",
        "hover:border-white/8 hover:bg-white/5",
        className,
      )}
      onClick={() => onPlay(track)}
      onContextMenu={(event) => {
        event.preventDefault();
        openContextMenu(track, event.clientX, event.clientY);
      }}
    >
      <div className="relative">
        <Artwork
          track={track}
          rounded="rounded-xl"
          className="aspect-square w-full shadow-[0_18px_40px_-24px_rgb(0_0_0/0.9)]"
          priority={priority}
        />
        <div className="absolute bottom-2.5 right-2.5">
          <PlayButtonOverlay
            playing={isActive && playing}
            onClick={(event) => {
              event.stopPropagation();
              onPlay(track);
            }}
          />
        </div>
        <div className="absolute left-2.5 top-2.5 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <button
            type="button"
            aria-label={isFavorite ? t("player.removeFromFavorites") : t("player.addToFavorites")}
            onClick={async (event) => {
              event.stopPropagation();
              const added = await toggleFavorite(track);
              toast.success(added ? t("toast.favoriteAdded") : t("toast.favoriteRemoved"), { id: `fav-${track.id}` });
            }}
            className={cn(
              "grid size-8 place-items-center rounded-full bg-black/55 text-white backdrop-blur-md transition-colors hover:bg-black/75",
              isFavorite && "text-primary",
            )}
          >
            <Heart className={cn("size-3.5", isFavorite && "fill-current")} />
          </button>
          <button
            type="button"
            aria-label={t("common.moreOptions")}
            onClick={(event) => {
              event.stopPropagation();
              const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
              openContextMenu(track, rect.left, rect.bottom + 6);
            }}
            className="grid size-8 place-items-center rounded-full bg-black/55 text-white backdrop-blur-md transition-colors hover:bg-black/75"
          >
            <MoreHorizontal className="size-3.5" />
          </button>
        </div>
      </div>
      <div className="mt-3 min-w-0 px-0.5 pb-0.5">
        <p className={cn("truncate text-[13.5px] font-semibold", isActive && "text-primary")}>{track.title}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{track.artist}</p>
      </div>
    </article>
  );
}
