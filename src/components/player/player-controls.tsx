"use client";

import { Loader2, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward } from "lucide-react";
import { usePlayerStore } from "@/store/player-store";
import { usePlayer } from "@/components/providers/player-provider";
import { useI18n } from "@/i18n/provider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface PlayerControlsProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

/** Transport controls shared by mini player, full-screen player and mobile bar. */
export function PlayerControls({ size = "md", className }: PlayerControlsProps) {
  const { toggle, next, previous } = usePlayer();
  const { t } = useI18n();
  const status = usePlayerStore((state) => state.status);
  const shuffle = usePlayerStore((state) => state.shuffle);
  const repeat = usePlayerStore((state) => state.repeat);
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle);
  const cycleRepeat = usePlayerStore((state) => state.cycleRepeat);
  const hasQueue = usePlayerStore((state) => state.queue.length > 0);

  const isPlaying = status === "playing";
  const isLoading = status === "loading";
  const iconButton = size === "lg" ? "size-11" : size === "sm" ? "size-8" : "size-9";
  const primarySize = size === "lg" ? "size-16" : size === "sm" ? "size-10" : "size-12";
  const primaryIcon = size === "lg" ? "size-7" : size === "sm" ? "size-4.5" : "size-5";

  return (
    <div className={cn("flex items-center", size === "lg" ? "gap-4 sm:gap-6" : "gap-1.5 sm:gap-2", className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={toggleShuffle}
            aria-label={t("common.shuffle")}
            aria-pressed={shuffle}
            className={cn(
              "relative grid place-items-center rounded-full transition-colors",
              iconButton,
              "hover:bg-white/8",
              shuffle ? "text-primary" : "text-muted-foreground hover:text-foreground",
              size === "sm" && "hidden sm:grid",
            )}
          >
            <Shuffle className={size === "lg" ? "size-5" : "size-4"} />
            {shuffle && <span className="absolute -bottom-0.5 size-1 rounded-full bg-primary" />}
          </button>
        </TooltipTrigger>
        <TooltipContent>{t("common.shuffle")}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => void previous()}
            disabled={!hasQueue}
            aria-label={t("common.previous")}
            className={cn("grid place-items-center rounded-full text-foreground/85 transition-colors hover:bg-white/8 hover:text-foreground disabled:opacity-40", iconButton)}
          >
            <SkipBack className={cn(size === "lg" ? "size-6" : "size-[18px]", "fill-current")} />
          </button>
        </TooltipTrigger>
        <TooltipContent>{t("common.previous")}</TooltipContent>
      </Tooltip>

      <button
        type="button"
        onClick={() => void toggle()}
        disabled={!hasQueue}
        aria-label={isPlaying ? t("common.pause") : t("common.play")}
        className={cn(
          "grid place-items-center rounded-full bg-white text-black transition-all",
          "hover:scale-[1.05] active:scale-95 disabled:opacity-40 disabled:hover:scale-100",
          "shadow-[0_10px_28px_-12px_rgb(255_255_255/0.55)]",
          primarySize,
        )}
      >
        {isLoading ? (
          <Loader2 className={cn(primaryIcon, "animate-spin")} />
        ) : isPlaying ? (
          <Pause className={cn(primaryIcon, "fill-current")} />
        ) : (
          <Play className={cn(primaryIcon, "translate-x-[1px] fill-current")} />
        )}
      </button>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => void next()}
            disabled={!hasQueue}
            aria-label={t("common.next")}
            className={cn("grid place-items-center rounded-full text-foreground/85 transition-colors hover:bg-white/8 hover:text-foreground disabled:opacity-40", iconButton)}
          >
            <SkipForward className={cn(size === "lg" ? "size-6" : "size-[18px]", "fill-current")} />
          </button>
        </TooltipTrigger>
        <TooltipContent>{t("common.next")}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={cycleRepeat}
            aria-label={repeat === "one" ? t("common.repeatOne") : repeat === "all" ? t("common.repeatAll") : t("common.repeat")}
            aria-pressed={repeat !== "off"}
            className={cn(
              "relative grid place-items-center rounded-full transition-colors hover:bg-white/8",
              iconButton,
              repeat !== "off" ? "text-primary" : "text-muted-foreground hover:text-foreground",
              size === "sm" && "hidden sm:grid",
            )}
          >
            {repeat === "one" ? <Repeat1 className={size === "lg" ? "size-5" : "size-4"} /> : <Repeat className={size === "lg" ? "size-5" : "size-4"} />}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          {repeat === "one" ? t("common.repeatOne") : repeat === "all" ? t("common.repeatAll") : t("common.repeat")}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
