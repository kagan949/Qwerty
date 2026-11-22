"use client";

import { createContext, useContext, useEffect } from "react";
import { usePlayerController } from "@/hooks/use-player";

type Controller = ReturnType<typeof usePlayerController>;
const PlayerContext = createContext<Controller | null>(null);

/**
 * Mounts the single audio controller and shares its actions. Keeping this in a
 * provider guarantees only one <audio> element (Howler) exists app-wide, so
 * navigation never interrupts playback.
 */
export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const controller = usePlayerController();
  useTransportEvents(controller);
  return <PlayerContext.Provider value={controller}>{children}</PlayerContext.Provider>;
}

/**
 * Transport commands as DOM events.
 *
 * Keyboard shortcuts, the Media Session handlers fallback, the mini-player and
 * any hardware/OS integration (including the optional Android shell) can drive
 * playback without importing React state:
 *
 *   window.dispatchEvent(new CustomEvent("vybe:toggle-play"))
 *   vybe:next / vybe:previous / vybe:seek (detail.seconds) / vybe:volume (detail.volume)
 *   vybe:toggle-shuffle / vybe:toggle-repeat
 */
function useTransportEvents(controller: Controller) {
  useEffect(() => {
    const onToggle = () => void controller.toggle();
    const onPlay = () => void controller.play();
    const onPause = () => controller.pause();
    const onNext = () => void controller.next();
    const onPrevious = () => void controller.previous();
    const onSeek = (event: Event) => {
      const seconds = (event as CustomEvent<{ seconds?: number }>).detail?.seconds;
      if (typeof seconds === "number") controller.seek(seconds);
    };
    const onVolume = (event: Event) => {
      const volume = (event as CustomEvent<{ volume?: number }>).detail?.volume;
      if (typeof volume === "number") controller.setVolume(Math.min(1, Math.max(0, volume)));
    };

    const bindings: [string, EventListener][] = [
      ["vybe:toggle-play", onToggle],
      ["vybe:play", onPlay],
      ["vybe:pause", onPause],
      ["vybe:next", onNext],
      ["vybe:previous", onPrevious],
      ["vybe:seek", onSeek],
      ["vybe:volume", onVolume],
    ];

    for (const [name, handler] of bindings) window.addEventListener(name, handler);
    return () => {
      for (const [name, handler] of bindings) window.removeEventListener(name, handler);
    };
  }, [controller]);
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("usePlayer must be used within <PlayerProvider>");
  return context;
}
