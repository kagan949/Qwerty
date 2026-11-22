"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { RepeatMode, SleepTimerState, Track } from "@/types";
import { clamp, shuffled } from "@/lib/utils";

export type PlayerStatus = "idle" | "loading" | "playing" | "paused" | "buffering" | "error";

export interface PlayerState {
  queue: Track[];
  originalQueue: Track[];
  index: number;
  /** Position in seconds of the current track (ephemeral, not persisted). */
  progress: number;
  /** Resolved duration of the current track in seconds. */
  duration: number;
  volume: number;
  muted: boolean;
  playing: boolean;
  status: PlayerStatus;
  buffering: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  rate: number;
  sleepTimer: SleepTimerState;
  fullScreen: boolean;
  queueOpen: boolean;
  error: string | null;
  /** Source list id so "autoplay similar" knows what to extend. */
  contextId: string | null;

  currentTrack: () => Track | null;
  setQueue: (tracks: Track[], startIndex?: number, contextId?: string | null) => void;
  addToQueue: (track: Track) => void;
  playNext: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  moveQueueItem: (from: number, to: number) => void;
  clearQueue: () => void;
  setIndex: (index: number) => void;
  setProgress: (seconds: number) => void;
  setDuration: (seconds: number) => void;
  setVolume: (value: number) => void;
  setMuted: (value: boolean) => void;
  setPlaying: (value: boolean) => void;
  setStatus: (status: PlayerStatus) => void;
  setBuffering: (value: boolean) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setRate: (rate: number) => void;
  setSleepTimer: (timer: SleepTimerState) => void;
  setFullScreen: (open: boolean) => void;
  setQueueOpen: (open: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initial = {
  queue: [] as Track[],
  originalQueue: [] as Track[],
  index: 0,
  progress: 0,
  duration: 0,
  volume: 0.8,
  muted: false,
  playing: false,
  status: "idle" as PlayerStatus,
  buffering: false,
  shuffle: false,
  repeat: "off" as RepeatMode,
  rate: 1,
  sleepTimer: { endsAt: null, endOfTrack: false } as SleepTimerState,
  fullScreen: false,
  queueOpen: false,
  error: null as string | null,
  contextId: null as string | null,
};

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      ...initial,
      currentTrack: () => {
        const { queue, index } = get();
        return queue[index] ?? null;
      },
      setQueue: (tracks, startIndex = 0, contextId = null) => {
        if (tracks.length === 0) return;
        const safeIndex = clamp(startIndex, 0, tracks.length - 1);
        set({
          queue: tracks,
          originalQueue: tracks,
          index: safeIndex,
          progress: 0,
          duration: tracks[safeIndex]?.duration ?? 0,
          error: null,
          contextId,
        });
      },
      addToQueue: (track) =>
        set((state) => {
          if (state.queue.some((item) => item.id === track.id)) return state;
          return { queue: [...state.queue, track], originalQueue: [...state.originalQueue, track] };
        }),
      playNext: (track) =>
        set((state) => {
          const filtered = state.queue.filter((item) => item.id !== track.id);
          const next = [...filtered];
          next.splice(state.index + 1, 0, track);
          return { queue: next };
        }),
      removeFromQueue: (index) =>
        set((state) => {
          const queue = state.queue.filter((_, i) => i !== index);
          const newIndex = index < state.index ? state.index - 1 : state.index;
          return {
            queue,
            index: clamp(newIndex, 0, Math.max(queue.length - 1, 0)),
          };
        }),
      moveQueueItem: (from, to) =>
        set((state) => {
          if (from === to) return state;
          const queue = [...state.queue];
          if (from < 0 || to < 0 || from >= queue.length || to >= queue.length) return state;
          const [item] = queue.splice(from, 1);
          queue.splice(to, 0, item);
          let index = state.index;
          if (state.index === from) index = to;
          else if (from < state.index && to >= state.index) index -= 1;
          else if (from > state.index && to <= state.index) index += 1;
          return { queue, index };
        }),
      clearQueue: () => set({ ...initial, volume: get().volume, muted: get().muted, shuffle: get().shuffle, repeat: get().repeat }),
      setIndex: (index) => set({ index, progress: 0, duration: get().queue[index]?.duration ?? 0, error: null }),
      setProgress: (progress) => set({ progress }),
      setDuration: (duration) => set({ duration }),
      setVolume: (volume) => set({ volume: clamp(volume, 0, 1), muted: volume === 0 ? get().muted : false }),
      setMuted: (muted) => set({ muted }),
      setPlaying: (playing) => set({ playing }),
      setStatus: (status) => set({ status, playing: status === "playing" }),
      setBuffering: (buffering) => set({ buffering }),
      toggleShuffle: () =>
        set((state) => {
          const nextShuffle = !state.shuffle;
          if (!state.queue.length) return { shuffle: nextShuffle };
          const current = state.queue[state.index];
          if (nextShuffle) {
            const rest = state.originalQueue.length ? state.originalQueue : state.queue;
            const others = shuffled(rest.filter((track) => track.id !== current?.id));
            const queue = current ? [current, ...others] : others;
            return { shuffle: true, queue, originalQueue: state.originalQueue.length ? state.originalQueue : state.queue, index: 0 };
          }
          const restored = state.originalQueue.length ? state.originalQueue : state.queue;
          const index = current ? restored.findIndex((track) => track.id === current.id) : 0;
          return { shuffle: false, queue: restored, index: index >= 0 ? index : 0 };
        }),
      cycleRepeat: () =>
        set((state) => ({
          repeat: state.repeat === "off" ? "all" : state.repeat === "all" ? "one" : "off",
        })),
      setRate: (rate) => set({ rate }),
      setSleepTimer: (sleepTimer) => set({ sleepTimer }),
      setFullScreen: (fullScreen) => set({ fullScreen }),
      setQueueOpen: (queueOpen) => set({ queueOpen }),
      setError: (error) => set({ error, status: error ? "error" : get().status }),
      reset: () => set({ ...initial }),
    }),
    {
      name: "vybe:player",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        queue: state.queue.slice(0, 200),
        originalQueue: state.originalQueue.slice(0, 200),
        index: state.index,
        volume: state.volume,
        muted: state.muted,
        shuffle: state.shuffle,
        repeat: state.repeat,
        rate: state.rate,
        progress: state.progress,
        duration: state.duration,
        contextId: state.contextId,
      }),
    },
  ),
);
