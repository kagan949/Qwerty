"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronUp, Heart, ListMusic, Maximize2 } from "lucide-react";
import { usePlayerStore } from "@/store/player-store";
import { usePlayer } from "@/components/providers/player-provider";
import { useLibraryStore } from "@/store/library-store";
import { useI18n } from "@/i18n/provider";
import { Artwork } from "@/components/music/artwork";
import { PlayerControls } from "@/components/player/player-controls";
import { ProgressBar } from "@/components/player/progress-bar";
import { VolumeControl } from "@/components/player/volume-control";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { formatTime } from "@/lib/utils";

/**
 * Persistent bottom player. Desktop: full transport + progress + volume.
 * Mobile: compact bar that expands into the full-screen player on tap.
 */
export function MiniPlayer() {
  const { t } = useI18n();
  const { openFullScreen } = usePlayer();
  const track = usePlayerStore((state) => state.queue[state.index] ?? null);
  const status = usePlayerStore((state) => state.status);
  const progress = usePlayerStore((state) => state.progress);
  const duration = usePlayerStore((state) => state.duration);
  const setQueueOpen = usePlayerStore((state) => state.setQueueOpen);
  const queueOpen = usePlayerStore((state) => state.queueOpen);
  const isFavorite = useLibraryStore((state) => (track ? state.favoriteIds.has(track.id) : false));
  const toggleFavorite = useLibraryStore((state) => state.toggleFavorite);

  if (!track) return null;
  const percent = duration > 0 ? Math.min(100, (progress / duration) * 100) : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
        className="fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-40 px-2 md:bottom-3 md:px-3"
      >
        {/* Mobile bar */}
        <div className="glass-strong overflow-hidden rounded-2xl shadow-[0_18px_50px_-20px_rgb(0_0_0/0.9)] md:hidden">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-white/10">
            <div className="h-full bg-primary transition-[width] duration-300" style={{ width: `${percent}%` }} />
          </div>
          <div className="flex items-center gap-3 px-2.5 py-2">
            <button
              type="button"
              onClick={openFullScreen}
              className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
              aria-label={t("nav.openPlayer")}
            >
              <Artwork track={track} className="size-10 shrink-0" rounded="rounded-lg" />
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-semibold">{track.title}</span>
                <span className="block truncate text-[11.5px] text-muted-foreground">{track.artist}</span>
              </span>
            </button>
            <PlayerControls size="sm" />
          </div>
        </div>

        {/* Desktop bar */}
        <div className="glass-strong relative hidden overflow-hidden rounded-2xl shadow-[0_24px_60px_-24px_rgb(0_0_0/0.95)] md:block">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)] items-center gap-4 px-4 py-3">
            {/* Track */}
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={openFullScreen}
                className="group relative shrink-0"
                aria-label={t("nav.openPlayer")}
              >
                <Artwork track={track} className="size-[52px]" rounded="rounded-xl" />
                <span className="absolute inset-0 grid place-items-center rounded-xl bg-black/55 opacity-0 transition-opacity group-hover:opacity-100">
                  <Maximize2 className="size-4 text-white" />
                </span>
              </button>
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={openFullScreen}
                  className="block max-w-full truncate text-left text-[13.5px] font-semibold hover:underline"
                >
                  {track.title}
                </button>
                <p className="truncate text-[12px] text-muted-foreground">{track.artist}</p>
              </div>
              <button
                type="button"
                aria-label={isFavorite ? t("player.removeFromFavorites") : t("player.addToFavorites")}
                aria-pressed={isFavorite}
                onClick={async () => {
                  const added = await toggleFavorite(track);
                  toast.success(added ? t("toast.favoriteAdded") : t("toast.favoriteRemoved"), { id: `fav-${track.id}` });
                }}
                className={cn(
                  "ml-1 hidden shrink-0 rounded-full p-1.5 transition-colors hover:bg-white/10 lg:block",
                  isFavorite ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Heart className={cn("size-[18px]", isFavorite && "fill-current")} />
              </button>
            </div>

            {/* Transport + progress */}
            <div className="flex flex-col items-center gap-1">
              <PlayerControls size="sm" className="gap-3" />
              <div className="flex w-full items-center gap-2.5">
                <span className="w-9 shrink-0 text-right text-[10.5px] tabular-nums text-muted-foreground">
                  {formatTime(progress)}
                </span>
                <ProgressBar showTimes={false} className="flex-1" />
                <span className="w-9 shrink-0 text-[10.5px] tabular-nums text-muted-foreground">
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Extras */}
            <div className="flex items-center justify-end gap-1">
              <button
                type="button"
                onClick={() => setQueueOpen(!queueOpen)}
                aria-label={t("player.queue")}
                aria-pressed={queueOpen}
                className={cn(
                  "rounded-full p-2 transition-colors hover:bg-white/8",
                  queueOpen ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <ListMusic className="size-[18px]" />
              </button>
              <button
                type="button"
                onClick={openFullScreen}
                aria-label={t("nav.openPlayer")}
                className="hidden rounded-full p-2 text-muted-foreground transition-colors hover:bg-white/8 hover:text-foreground xl:block"
              >
                <ChevronUp className="size-[18px]" />
              </button>
              <VolumeControl />
            </div>
          </div>
          <div
            className={cn(
              "absolute left-0 top-0 h-full w-1 bg-primary/70 transition-opacity",
              status === "playing" ? "opacity-100" : "opacity-40",
            )}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
