"use client";

import { useEffect } from "react";
import { usePlayerStore } from "@/store/player-store";
import { getAudioEngine } from "@/lib/audio-engine";

/**
 * Global shortcuts. Space toggles playback, arrows seek, up/down adjust volume,
 * M mutes, Q toggles the queue, F the full-screen player. Ignored while typing.
 */
export function useKeyboardShortcuts() {
  useEffect(() => {
    const engine = getAudioEngine();

    const isTyping = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName.toLowerCase();
      return (
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        target.isContentEditable ||
        target.closest("[role='textbox']") !== null
      );
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTyping(event.target)) return;
      const state = usePlayerStore.getState();
      if (!state.queue.length) return;

      switch (event.key) {
        case " ": {
          event.preventDefault();
          window.dispatchEvent(new CustomEvent("vybe:toggle-play"));
          break;
        }
        case "ArrowRight": {
          event.preventDefault();
          const target = Math.min(state.progress + 10, state.duration || Number.POSITIVE_INFINITY);
          engine.seek(target);
          state.setProgress(target);
          break;
        }
        case "ArrowLeft": {
          event.preventDefault();
          const target = Math.max(state.progress - 10, 0);
          engine.seek(target);
          state.setProgress(target);
          break;
        }
        case "ArrowUp": {
          event.preventDefault();
          state.setVolume(Math.min(1, state.volume + 0.05));
          break;
        }
        case "ArrowDown": {
          event.preventDefault();
          state.setVolume(Math.max(0, state.volume - 0.05));
          break;
        }
        case "m":
        case "M": {
          state.setMuted(!state.muted);
          break;
        }
        case "q":
        case "Q": {
          state.setQueueOpen(!state.queueOpen);
          break;
        }
        case "f":
        case "F": {
          state.setFullScreen(!state.fullScreen);
          break;
        }
        case "n":
        case "N": {
          window.dispatchEvent(new CustomEvent("vybe:next"));
          break;
        }
        case "p":
        case "P": {
          window.dispatchEvent(new CustomEvent("vybe:previous"));
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
