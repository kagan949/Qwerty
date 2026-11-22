"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Gauge,
  Heart,
  Info,
  ListMusic,
  Moon,
  MoreHorizontal,
  Share2,
  Sparkles,
} from "lucide-react";
import { usePlayerStore } from "@/store/player-store";
import { usePlayer } from "@/components/providers/player-provider";
import { useLibraryStore } from "@/store/library-store";
import { useSettingsStore } from "@/store/settings-store";
import { useUiStore } from "@/store/ui-store";
import { useI18n } from "@/i18n/provider";
import { useClockSecond } from "@/hooks/use-clock";
import { Artwork } from "@/components/music/artwork";
import { PlayerControls } from "@/components/player/player-controls";
import { ProgressBar } from "@/components/player/progress-bar";
import { VolumeControl } from "@/components/player/volume-control";
import { Visualizer } from "@/components/player/visualizer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PLAYBACK_RATES, SLEEP_TIMER_MINUTES } from "@/lib/constants";
import { cn, formatTime } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { useEqualizer } from "@/hooks/use-equalizer";

export function FullScreenPlayer() {
  useEqualizer();
  const { t } = useI18n();
  const { closeFullScreen } = usePlayer();
  const open = usePlayerStore((state) => state.fullScreen);
  const track = usePlayerStore((state) => state.queue[state.index] ?? null);
  const queue = usePlayerStore((state) => state.queue);
  const setQueueOpen = usePlayerStore((state) => state.setQueueOpen);
  const rate = usePlayerStore((state) => state.rate);
  const setRate = usePlayerStore((state) => state.setRate);
  const sleepTimer = usePlayerStore((state) => state.sleepTimer);
  const setSleepTimer = usePlayerStore((state) => state.setSleepTimer);
  const showVisualizer = useSettingsStore((state) => state.showVisualizer);
  const isFavorite = useLibraryStore((state) => (track ? state.favoriteIds.has(track.id) : false));
  const toggleFavorite = useLibraryStore((state) => state.toggleFavorite);
  const openContextMenu = useUiStore((state) => state.openContextMenu);
  const [infoOpen, setInfoOpen] = useState(false);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && usePlayerStore.getState().fullScreen) closeFullScreen();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [closeFullScreen]);

  // Derived from the shared clock: no interval or state of our own, and it
  // keeps counting while the sleep timer runs in the background.
  const nowTs = useClockSecond();
  const sleepRemaining = sleepTimer.endsAt && nowTs ? Math.max(0, sleepTimer.endsAt - nowTs) : null;
  const sleepCountdown =
    sleepRemaining === null
      ? null
      : `${Math.floor(sleepRemaining / 60000)}:${String(Math.floor((sleepRemaining % 60000) / 1000)).padStart(2, "0")}`;

  const upNext = queue.slice(usePlayerStore.getState().index + 1, usePlayerStore.getState().index + 6);

  return (
    <AnimatePresence>
      {open && track && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ type: "spring", stiffness: 280, damping: 30 }}
          className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-background"
          role="dialog"
          aria-modal="true"
          aria-label={t("player.nowPlaying")}
        >
          {/* Ambient backdrop derived from artwork */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 opacity-40 blur-3xl" aria-hidden>
              <Artwork track={track} className="size-full" rounded="rounded-none" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/90 to-background" />
          </div>

          <header className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8">
            <Button variant="ghost" size="icon" onClick={closeFullScreen} aria-label={t("player.closePlayer")}>
              <ChevronDown className="size-5" />
            </Button>
            <div className="text-center">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {t("player.nowPlaying")}
              </p>
              <p className="mt-0.5 text-[11.5px] text-muted-foreground/80">{track.album ?? "VYBE"}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={t("common.more") ?? "More"}>
                  <MoreHorizontal className="size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setInfoOpen((value) => !value)}>
                  <Info /> {t("player.trackInfo")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    openContextMenu(track, window.innerWidth / 2, window.innerHeight / 2);
                  }}
                >
                  <ListMusic /> {t("library.addToPlaylist")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    const shareData = {
                      title: track.title,
                      text: `${track.title} — ${track.artist} on VYBE`,
                      url: track.sourceUrl ?? window.location.href,
                    };
                    try {
                      if (navigator.share) await navigator.share(shareData);
                      else {
                        await navigator.clipboard.writeText(shareData.url);
                        toast.success(t("toast.copiedLink"));
                      }
                    } catch {
                      // user cancelled
                    }
                  }}
                >
                  <Share2 /> {t("common.export")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>{t("player.speed")}</DropdownMenuLabel>
                {PLAYBACK_RATES.map((value) => (
                  <DropdownMenuItem key={value} onClick={() => setRate(value)}>
                    <Gauge className={cn(rate === value && "text-primary")} />
                    {value}×
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2 scrollbar-none sm:px-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:items-center">
            {/* Artwork + meta */}
            <div className="flex flex-col items-center gap-4">
              <motion.div
                layout
                className="relative w-full max-w-[min(76vw,340px)] lg:max-w-[380px]"
                animate={{ scale: usePlayerStore.getState().status === "playing" ? 1 : 0.97 }}
                transition={{ type: "spring", stiffness: 200, damping: 24 }}
              >
                <Artwork
                  track={track}
                  rounded="rounded-3xl"
                  className="aspect-square w-full shadow-[0_40px_120px_-40px_rgb(124_58_237/0.65)]"
                  priority
                />
                {showVisualizer && (
                  <div className="pointer-events-none absolute inset-x-4 bottom-4 opacity-90">
                    <Visualizer height={64} bars={40} className="rounded-xl" />
                  </div>
                )}
              </motion.div>
              <div className="w-full max-w-lg text-center">
                <div className="flex items-center justify-center gap-2">
                  <Badge variant={track.source === "local" ? "local" : track.source === "jamendo" ? "jamendo" : track.source === "archive" ? "archive" : "curated"}>
                    {t(`sources.${track.source === "local" ? "local" : track.source === "jamendo" ? "jamendo" : track.source === "archive" ? "archive" : "curated"}`)}
                  </Badge>
                  {track.license && <span className="text-[10.5px] text-muted-foreground">{track.license}</span>}
                </div>
                <h1 className="mt-2 font-display text-2xl font-bold leading-tight tracking-tight sm:text-3xl">{track.title}</h1>
                <p className="mt-1 text-[13.5px] text-muted-foreground">{track.artist}</p>
              </div>
            </div>

            {/* Controls column */}
            <div className="flex w-full flex-col gap-4">
              <ProgressBar showTimes size="lg" />
              <div className="flex items-center justify-center">
                <PlayerControls size="lg" />
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={async () => {
                    const added = await toggleFavorite(track);
                    toast.success(added ? t("toast.favoriteAdded") : t("toast.favoriteRemoved"), { id: `fav-${track.id}` });
                  }}
                  aria-label={isFavorite ? t("player.removeFromFavorites") : t("player.addToFavorites")}
                  aria-pressed={isFavorite}
                  className={cn(
                    "grid size-10 place-items-center rounded-full transition-colors hover:bg-white/8",
                    isFavorite ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Heart className={cn("size-5", isFavorite && "fill-current")} />
                </button>
                <div className="flex items-center gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label={t("player.sleepTimer")} className={cn(sleepTimer.endsAt && "text-primary")}>
                        <Moon className="size-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center">
                      <DropdownMenuLabel>{t("player.sleepTimer")}</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => setSleepTimer({ endsAt: null, endOfTrack: false })}>
                        {t("player.sleepOff")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSleepTimer({ endsAt: null, endOfTrack: true })}>
                        {t("player.sleepEndOfTrack")}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {SLEEP_TIMER_MINUTES.map((minutes) => (
                        <DropdownMenuItem
                          key={minutes}
                          onClick={() => {
                            setSleepTimer({ endsAt: Date.now() + minutes * 60000, endOfTrack: false });
                            toast.success(t("player.sleepActive"));
                          }}
                        >
                          {minutes} {t("player.sleepMinutes")}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="ghost" size="icon" onClick={() => setQueueOpen(true)} aria-label={t("player.queue")}>
                    <ListMusic className="size-5" />
                  </Button>
                  <VolumeControl size="lg" />
                </div>
              </div>

              {sleepCountdown && (
                <p className="text-center text-[11.5px] text-primary/90">
                  {t("player.sleepSetsIn")} {sleepCountdown}
                </p>
              )}

              {/* Up next */}
              {upNext.length > 0 && (
                <div className="rounded-2xl border border-white/8 bg-white/3 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      <Sparkles className="size-3" /> {t("player.upNext")}
                    </p>
                    <button
                      type="button"
                      className="text-[11.5px] text-muted-foreground transition-colors hover:text-foreground"
                      onClick={() => setQueueOpen(true)}
                    >
                      {t("common.viewAll")}
                    </button>
                  </div>
                  <ul className="space-y-1">
                    {upNext.map((item, index) => (
                      <li key={`${item.id}-${index}`} className="flex items-center gap-2.5 rounded-lg px-1 py-1">
                        <Artwork track={item} className="size-8" rounded="rounded-md" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-medium">{item.title}</p>
                          <p className="truncate text-[10.5px] text-muted-foreground">{item.artist}</p>
                        </div>
                        <span className="text-[10.5px] tabular-nums text-muted-foreground">{formatTime(item.duration)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <AnimatePresence>
                {infoOpen && (
                  <motion.dl
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-2 gap-x-4 gap-y-2 overflow-hidden rounded-2xl border border-white/8 bg-white/3 p-3 text-[11.5px]"
                  >
                    <dt className="text-muted-foreground">{t("player.sourceLabel")}</dt>
                    <dd>{t(`sources.${track.source}`)}</dd>
                    <dt className="text-muted-foreground">{t("player.licenseLabel")}</dt>
                    <dd className="truncate">
                      {track.licenseUrl ? (
                        <a href={track.licenseUrl} target="_blank" rel="noreferrer noopener" className="text-primary hover:underline">
                          {track.license ?? "—"}
                        </a>
                      ) : (
                        track.license ?? "—"
                      )}
                    </dd>
                    <dt className="text-muted-foreground">{t("common.album")}</dt>
                    <dd className="truncate">{track.album ?? "—"}</dd>
                    <dt className="text-muted-foreground">{t("common.duration")}</dt>
                    <dd>{formatTime(track.duration)}</dd>
                  </motion.dl>
                )}
              </AnimatePresence>

              <p className="mt-auto hidden text-center text-[10px] text-muted-foreground/60 lg:block">
                Space {t("common.play")}/{t("common.pause")} · Esc {t("common.close")}
              </p>
            </div>
          </div>
          <span className="sr-only" aria-live="polite">
            {track.title} — {track.artist}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
