"use client";

import { Volume, Volume1, Volume2, VolumeX } from "lucide-react";
import { usePlayerStore } from "@/store/player-store";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

export function VolumeControl({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const { t } = useI18n();
  const volume = usePlayerStore((state) => state.volume);
  const muted = usePlayerStore((state) => state.muted);
  const setVolume = usePlayerStore((state) => state.setVolume);
  const setMuted = usePlayerStore((state) => state.setMuted);
  const effective = muted ? 0 : volume;
  const Icon = effective === 0 ? VolumeX : effective < 0.35 ? Volume : effective < 0.7 ? Volume1 : Volume2;

  return (
    <div className={cn("group flex items-center gap-2", className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={muted ? t("common.unmute") : t("common.mute")}
            onClick={() => setMuted(!muted)}
            className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-white/8 hover:text-foreground"
          >
            <Icon className={size === "lg" ? "size-5" : "size-4"} />
          </button>
        </TooltipTrigger>
        <TooltipContent>{muted ? t("common.unmute") : t("common.mute")}</TooltipContent>
      </Tooltip>
      <Slider
        aria-label={t("common.volume")}
        value={[muted ? 0 : Math.round(volume * 100)]}
        max={100}
        step={1}
        onValueChange={(values) => {
          const next = (values[0] ?? 0) / 100;
          if (muted && next > 0) setMuted(false);
          setVolume(next);
        }}
        className={cn(size === "lg" ? "w-32" : "w-24", "hidden sm:flex")}
        showThumbOnHover
      />
    </div>
  );
}
