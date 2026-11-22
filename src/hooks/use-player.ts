"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { usePlayerStore } from "@/store/player-store";
import { useSettingsStore } from "@/store/settings-store";
import { getAudioEngine } from "@/lib/audio-engine";
import { resolvePlayableUrl, resolveArtworkUrl } from "@/lib/audio-source";
import { recordPlay } from "@/database/history";
import { useLibraryStore } from "@/store/library-store";
import { toast } from "@/lib/toast";
import type { Track } from "@/types";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Single owner of audio side effects. Mounted once by <PlayerProvider>.
 * All UI (mini player, full-screen player, keyboard shortcuts, Media Session)
 * talks to the same Zustand store and calls these actions.
 */
export function usePlayerController() {
  const engine = getAudioEngine();
  const loadedTrackId = useRef<string | null>(null);
  const playStartedAt = useRef<{ trackId: string; wallClock: number } | null>(null);
  const crossfadeArmed = useRef(false);
  const handledTrackRef = useRef<string | null>(null);

  const currentTrack = usePlayerStore((state) => state.queue[state.index] ?? null);
  const queue = usePlayerStore((state) => state.queue);
  const repeat = usePlayerStore((state) => state.repeat);
  const crossfadeSeconds = useSettingsStore((state) => state.crossfadeSeconds);
  const gapless = useSettingsStore((state) => state.gapless);
  const refreshRecent = useLibraryStore((state) => state.refreshRecent);

  const persistPlay = useCallback(async (track: Track, seconds: number) => {
    if (!track) return;
    try {
      await recordPlay(track, seconds);
      await refreshRecent();
    } catch {
      // History is best-effort; playback must never be blocked by it.
    }
  }, [refreshRecent]);

  const loadTrack = useCallback(
    async (track: Track, options: { autoplay?: boolean; startAt?: number } = {}) => {
      const state = usePlayerStore.getState();
      const autoplay = options.autoplay ?? true;
      state.setStatus("loading");
      state.setBuffering(true);
      state.setError(null);
      try {
        const src = await resolvePlayableUrl(track);
        loadedTrackId.current = track.id;
        const artwork = (await resolveArtworkUrl(track)) || undefined;
        updateMediaSessionMetadata(track, artwork);
        engine.load(track, src, {
          autoplay,
          startAt: options.startAt,
          volume: state.volume,
          muted: state.muted,
          rate: state.rate,
        });
        if (autoplay) {
          playStartedAt.current = { trackId: track.id, wallClock: Date.now() };
        }
      } catch (error) {
        const code = error instanceof Error ? error.message : "unknown";
        state.setError(code);
        state.setStatus("error");
        state.setBuffering(false);
        toast.error(
          code === "local_file_missing"
            ? "The uploaded file is no longer on this device"
            : "Couldn't play this track — try the next one",
          { id: `play-error-${track.id}` },
        );
      }
    },
    [engine],
  );

  const play = useCallback(async () => {
    const state = usePlayerStore.getState();
    const track = state.queue[state.index] ?? null;
    if (!track) return;
    if (loadedTrackId.current === track.id) {
      engine.play();
      playStartedAt.current = { trackId: track.id, wallClock: Date.now() };
      state.setStatus("playing");
      return;
    }
    const startAt = state.progress > 1 ? state.progress : undefined;
    await loadTrack(track, { autoplay: true, startAt });
    usePlayerStore.getState().setStatus("playing");
  }, [engine, loadTrack]);

  const pause = useCallback(() => {
    const state = usePlayerStore.getState();
    engine.pause();
    state.setStatus("paused");
    const started = playStartedAt.current;
    if (started) {
      const listened = (Date.now() - started.wallClock) / 1000;
      const track = state.queue.find((item) => item.id === started.trackId);
      if (track && listened > 5) void persistPlay(track, listened);
      playStartedAt.current = null;
    }
  }, [engine, persistPlay]);

  const toggle = useCallback(async () => {
    if (!usePlayerStore.getState().queue.length) return;
    if (usePlayerStore.getState().status === "playing") pause();
    else await play();
  }, [pause, play]);

  const goToIndex = useCallback(
    async (targetIndex: number) => {
      const state = usePlayerStore.getState();
      const track = state.queue[targetIndex];
      if (!track) return;
      state.setIndex(targetIndex);
      await loadTrack(track, { autoplay: true });
      usePlayerStore.getState().setStatus("playing");
    },
    [loadTrack],
  );

  const next = useCallback(async () => {
    const state = usePlayerStore.getState();
    if (!state.queue.length) return;
    const isLast = state.index >= state.queue.length - 1;
    if (isLast) {
      if (state.repeat === "all") {
        await goToIndex(0);
        return;
      }
      engine.pause();
      state.setStatus("paused");
      state.setProgress(0);
      return;
    }
    await goToIndex(state.index + 1);
  }, [engine, goToIndex]);

  const previous = useCallback(async () => {
    const state = usePlayerStore.getState();
    if (!state.queue.length) return;
    if (state.progress > 3) {
      engine.seek(0);
      state.setProgress(0);
      return;
    }
    const target = state.index > 0 ? state.index - 1 : state.repeat === "all" ? state.queue.length - 1 : 0;
    await goToIndex(target);
  }, [engine, goToIndex]);

  const seek = useCallback(
    (seconds: number) => {
      engine.seek(seconds);
      usePlayerStore.getState().setProgress(seconds);
    },
    [engine],
  );

  const playTrackList = useCallback(
    async (tracks: Track[], startIndex = 0, contextId: string | null = null) => {
      if (!tracks.length) return;
      usePlayerStore.getState().setQueue(tracks, startIndex, contextId);
      await goToIndex(startIndex);
    },
    [goToIndex],
  );

  const playCollection = useCallback(
    async (tracks: Track[], contextId?: string) => {
      const { shuffleDefault } = useSettingsStore.getState();
      if (shuffleDefault && tracks.length > 1) {
        const rest = tracks.slice(1);
        for (let i = rest.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [rest[i], rest[j]] = [rest[j], rest[i]];
        }
        const [first, ...others] = tracks;
        const shuffledList = [first, ...rest];
        usePlayerStore.getState().setQueue(shuffledList, 0, contextId ?? null);
        usePlayerStore.setState({ shuffle: true, originalQueue: tracks });
        await goToIndex(0);
        void others;
      } else {
        await playTrackList(tracks, 0, contextId ?? null);
      }
    },
    [goToIndex, playTrackList],
  );

  const addToQueue = useCallback((track: Track) => {
    usePlayerStore.getState().addToQueue(track);
    toast.success("Added to queue", { id: `queue-${track.id}` });
  }, []);

  const openFullScreen = useCallback(() => {
    if (!usePlayerStore.getState().queue.length) return;
    usePlayerStore.getState().setFullScreen(true);
  }, []);

  const closeFullScreen = useCallback(() => usePlayerStore.getState().setFullScreen(false), []);

  /** Called by the engine on natural track end and by crossfade. */
  const handleTrackEnded = useCallback(async () => {
    const state = usePlayerStore.getState();
    const track = state.queue[state.index];
    if (track && playStartedAt.current?.trackId === track.id) {
      void persistPlay(track, state.duration || track.duration);
    }
    playStartedAt.current = null;

    if (state.sleepTimer.endOfTrack) {
      state.setSleepTimer({ endsAt: null, endOfTrack: false });
      engine.pause();
      state.setStatus("paused");
      return;
    }
    if (state.repeat === "one") {
      engine.seek(0);
      engine.play();
      return;
    }
    const isLast = state.index >= state.queue.length - 1;
    if (isLast) {
      if (state.repeat === "all") {
        await goToIndex(0);
        return;
      }
      engine.pause();
      state.setStatus("paused");
      state.setProgress(0);
      return;
    }
    await goToIndex(state.index + 1);
  }, [engine, goToIndex, persistPlay]);

  // Keep the latest handler reachable from engine callbacks without re-binding.
  // Syncing happens in a layout effect because the engine calls these from
  // outside React's render cycle.
  const endedRef = useRef(handleTrackEnded);
  const crossfadeRef = useRef(crossfadeSeconds);
  useIsomorphicLayoutEffect(() => {
    endedRef.current = handleTrackEnded;
    crossfadeRef.current = crossfadeSeconds;
  }, [handleTrackEnded, crossfadeSeconds]);

  // --------------------------------------------------------------- engine wiring
  useEffect(() => {
    engine.setCallbacks({
      onTime: (current) => {
        const state = usePlayerStore.getState();
        state.setProgress(current);
        const duration = state.duration || 0;
        const fade = crossfadeRef.current;
        if (fade > 0 && duration > fade + 2 && current >= duration - fade) {
          if (!crossfadeArmed.current) {
            crossfadeArmed.current = true;
            engine.fadeTo(0.0001, fade * 1000);
            void endedRef.current().then(() => {
              const latest = usePlayerStore.getState();
              engine.setVolume(latest.muted ? 0 : latest.volume);
              crossfadeArmed.current = false;
            });
          }
        }
      },
      onLoad: (duration) => usePlayerStore.getState().setDuration(duration),
      onPlay: () => usePlayerStore.getState().setStatus("playing"),
      onPause: () => {
        const state = usePlayerStore.getState();
        if (state.status !== "error" && state.status !== "idle") state.setStatus("paused");
      },
      onEnd: () => {
        void endedRef.current();
      },
      onError: (message) => {
        const state = usePlayerStore.getState();
        if (message === "play_blocked") {
          state.setStatus("paused");
          return;
        }
        state.setError(message);
        state.setStatus("error");
        state.setBuffering(false);
      },
      onBuffer: (buffering) => usePlayerStore.getState().setBuffering(buffering),
    });
  }, [engine]);

  // ------------------------------------------------------ volume / mute / rate
  const volume = usePlayerStore((state) => state.volume);
  const muted = usePlayerStore((state) => state.muted);
  const rate = usePlayerStore((state) => state.rate);

  useEffect(() => {
    engine.setVolume(volume, 50);
  }, [engine, volume]);
  useEffect(() => {
    engine.setMuted(muted);
  }, [engine, muted]);
  useEffect(() => {
    engine.setRate(rate);
  }, [engine, rate]);

  // --------------------------------------------- load restored/queued tracks
  useEffect(() => {
    if (!currentTrack) return;
    if (loadedTrackId.current === currentTrack.id) return;
    if (handledTrackRef.current === currentTrack.id) return;
    handledTrackRef.current = currentTrack.id;
    const state = usePlayerStore.getState();
    const shouldAutoplay = state.status === "playing";
    void loadTrack(currentTrack, {
      autoplay: shouldAutoplay,
      startAt: state.progress > 1 ? state.progress : undefined,
    });
  }, [currentTrack, loadTrack]);

  // ------------------------------------------------------------ sleep timer
  const sleepEndsAt = usePlayerStore((state) => state.sleepTimer.endsAt);
  useEffect(() => {
    if (!sleepEndsAt) return;
    const remaining = sleepEndsAt - Date.now();
    if (remaining <= 0) {
      engine.pause();
      usePlayerStore.getState().setSleepTimer({ endsAt: null, endOfTrack: false });
      return;
    }
    const timeout = setTimeout(() => {
      engine.pause();
      usePlayerStore.getState().setStatus("paused");
      usePlayerStore.getState().setSleepTimer({ endsAt: null, endOfTrack: false });
    }, remaining);
    return () => clearTimeout(timeout);
  }, [engine, sleepEndsAt]);

  // --------------------------------------------------------- media session
  const status = usePlayerStore((state) => state.status);
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.setActionHandler("play", () => void play());
      navigator.mediaSession.setActionHandler("pause", pause);
      navigator.mediaSession.setActionHandler("previoustrack", () => void previous());
      navigator.mediaSession.setActionHandler("nexttrack", () => void next());
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (typeof details.seekTime === "number") seek(details.seekTime);
      });
      navigator.mediaSession.setActionHandler("seekbackward", () =>
        seek(Math.max(0, usePlayerStore.getState().progress - 10)),
      );
      navigator.mediaSession.setActionHandler("seekforward", () =>
        seek(usePlayerStore.getState().progress + 10),
      );
      navigator.mediaSession.playbackState = status === "playing" ? "playing" : "paused";
    } catch {
      // Older browsers expose a partial Media Session API — ignore gracefully.
    }
  }, [next, pause, play, previous, seek, status]);

  // Metadata must update whenever the track changes, independent of the above.
  useEffect(() => {
    if (!currentTrack) return;
    let cancelled = false;
    void (async () => {
      const artwork = await resolveArtworkUrl(currentTrack);
      if (!cancelled) updateMediaSessionMetadata(currentTrack, artwork);
    })();
    return () => {
      cancelled = true;
    };
  }, [currentTrack]);

  // --------------------------------------------------- position state updates
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const duration = usePlayerStore.getState().duration;
    if (!duration || !Number.isFinite(duration)) return;
    try {
      navigator.mediaSession.setPositionState?.({
        duration,
        position: Math.min(usePlayerStore.getState().progress, duration),
        playbackRate: rate,
      });
    } catch {
      // ignore
    }
  }, [status, rate]);

  void queue;
  void repeat;
  void gapless;

  return useMemo(
    () => ({
      play,
      pause,
      toggle,
      next,
      previous,
      seek,
      playTrackList,
      playCollection,
      addToQueue,
      openFullScreen,
      closeFullScreen,
      /** Atomically set the absolute volume (0–1); store clamps and syncs mute. */
      setVolume: (value: number) => usePlayerStore.getState().setVolume(value),
    }),
    [addToQueue, closeFullScreen, next, openFullScreen, pause, play, playCollection, playTrackList, previous, seek, toggle],
  );
}

function updateMediaSessionMetadata(track: Track, artwork: string | undefined) {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator) || typeof MediaMetadata === "undefined") {
    return;
  }
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: track.album ?? "VYBE",
      artwork: artwork ? [{ src: artwork, sizes: "512x512" }] : [],
    });
  } catch {
    // ignore
  }
}
