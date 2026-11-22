"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, GripVertical, Trash2, X } from "lucide-react";
import { usePlayerStore } from "@/store/player-store";
import { usePlayer } from "@/components/providers/player-provider";
import { useI18n } from "@/i18n/provider";
import { Artwork } from "@/components/music/artwork";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn, formatTime } from "@/lib/utils";
import { toast } from "@/lib/toast";

export function QueueDrawer() {
  const { t } = useI18n();
  const open = usePlayerStore((state) => state.queueOpen);
  const setOpen = usePlayerStore((state) => state.setQueueOpen);
  const queue = usePlayerStore((state) => state.queue);
  const index = usePlayerStore((state) => state.index);
  const removeFromQueue = usePlayerStore((state) => state.removeFromQueue);
  const moveQueueItem = usePlayerStore((state) => state.moveQueueItem);
  const clearQueue = usePlayerStore((state) => state.clearQueue);
  const { playTrackList } = usePlayer();
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="bottom" className="mx-auto max-w-2xl md:inset-x-auto md:bottom-3 md:right-3 md:left-auto md:max-h-[70vh] md:w-[420px] md:rounded-3xl md:border">
        <SheetTitle className="font-display text-base font-semibold">{t("player.queue")}</SheetTitle>
        <div className="mt-3 flex items-center justify-between text-[11.5px] text-muted-foreground">
          <span>
            {queue.length} {t("common.tracks")}
          </span>
          {queue.length > 0 && (
            <button
              type="button"
              className="flex items-center gap-1 rounded-full px-2 py-1 transition-colors hover:bg-white/8 hover:text-foreground"
              onClick={() => {
                clearQueue();
                toast.success(t("toast.queueCleared"));
                setOpen(false);
              }}
            >
              <Trash2 className="size-3.5" /> {t("player.clearQueue")}
            </button>
          )}
        </div>

        <div className="scrollbar-slim mt-2 max-h-[52vh] space-y-0.5 overflow-y-auto pb-2">
          {queue.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center">
              <p className="text-[13px] font-medium">{t("player.emptyQueue")}</p>
              <p className="mt-1 text-[11.5px] text-muted-foreground">{t("player.emptyQueueHint")}</p>
            </div>
          ) : (
            queue.map((track, i) => (
              <div
                key={`${track.id}-${i}`}
                draggable
                onDragStart={() => setDragIndex(i)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (dragIndex !== null && dragIndex !== i) {
                    moveQueueItem(dragIndex, i);
                    setDragIndex(null);
                  }
                }}
                className={cn(
                  "group flex items-center gap-2 rounded-xl px-1.5 py-1.5 transition-colors hover:bg-white/6",
                  i === index && "bg-primary/10",
                )}
              >
                <GripVertical className="size-3.5 shrink-0 cursor-grab text-muted-foreground/40" aria-hidden />
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                  onClick={() => void playTrackList(queue, i)}
                >
                  <Artwork track={track} className="size-9 shrink-0" rounded="rounded-md" />
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate text-[12.5px] font-medium", i === index && "text-primary")}>
                      {track.title}
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground">{track.artist}</span>
                  </span>
                </button>
                <span className="w-8 text-right text-[10.5px] tabular-nums text-muted-foreground">
                  {formatTime(track.duration)}
                </span>
                <div className="flex items-center opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("player.moveUp")}
                    disabled={i === 0}
                    onClick={() => moveQueueItem(i, i - 1)}
                  >
                    <ChevronUp className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("player.moveDown")}
                    disabled={i === queue.length - 1}
                    onClick={() => moveQueueItem(i, i + 1)}
                  >
                    <ChevronDown className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("common.remove")}
                    onClick={() => removeFromQueue(i)}
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
