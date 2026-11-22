"use client";

import { useCallback, useState } from "react";
import { usePlayerStore } from "@/store/player-store";
import { usePlayer } from "@/components/providers/player-provider";
import { Slider } from "@/components/ui/slider";
import { formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";

interface ProgressBarProps {
  showTimes?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Scrubbable progress. Drag state is local so the thumb follows the pointer
 * while the store keeps ticking in the background; the engine seeks on release.
 */
export function ProgressBar({ showTimes = true, size = "md", className }: ProgressBarProps) {
  const { t } = useI18n();
  const { seek } = usePlayer();
  const progress = usePlayerStore((state) => state.progress);
  const duration = usePlayerStore((state) => state.duration);
  const [dragValue, setDragValue] = useState<number | null>(null);
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const safeDuration = Math.max(duration || 0, 0.001);
  // Clamp while rendering: a track change mid-drag must never leave the thumb
  // beyond the new track's length.
  const clampedDrag = dragValue === null ? null : Math.min(dragValue, safeDuration);
  const displayed = clampedDrag ?? Math.min(progress, safeDuration);

  const handleCommit = useCallback(
    (values: number[]) => {
      const value = values[0] ?? 0;
      seek(value);
      setDragValue(null);
    },
    [seek],
  );

  return (
    <div className={cn("w-full", className)}>
      <div
        className="group relative flex items-center gap-3"
        onPointerMove={(event) => {
          // Map the pointer to a time so the tooltip can preview where a tap
          // would land (touch devices get the same feedback while dragging).
          if (!duration) return;
          const rect = event.currentTarget.getBoundingClientRect();
          if (rect.width <= 0) return;
          const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
          setHoverValue(ratio * duration);
        }}
        onPointerLeave={() => setHoverValue(null)}
      >
        <Slider
          aria-label={t("player.seek")}
          min={0}
          max={safeDuration}
          step={0.1}
          value={[displayed]}
          onValueChange={(values) => setDragValue(values[0] ?? 0)}
          onValueCommit={handleCommit}
          className={size === "lg" ? "py-2" : "py-1"}
          disabled={!duration}
        />
        {hoverValue !== null && duration > 0 && (
          <span
            className="pointer-events-none absolute -top-7 rounded-md bg-black/85 px-1.5 py-0.5 text-[10px] tabular-nums text-white opacity-0 transition-opacity group-hover:opacity-100"
            style={{ left: `calc(${(hoverValue / safeDuration) * 100}% - 18px)` }}
          >
            {formatTime(hoverValue)}
          </span>
        )}
      </div>
      {showTimes && (
        <div className="flex items-center justify-between text-[11px] tabular-nums text-muted-foreground">
          <span>{formatTime(displayed)}</span>
          <span>{duration ? `-${formatTime(Math.max(duration - displayed, 0))}` : "--:--"}</span>
        </div>
      )}
    </div>
  );
}
