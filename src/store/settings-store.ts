"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Locale } from "@/i18n/config";
import type { Quality, ThemeMode } from "@/types";
import { DEFAULT_LOCALE, isLocale } from "@/i18n/config";
import { DEFAULT_CROSSFADE_SECONDS } from "@/lib/constants";

export interface EqualizerSettings {
  enabled: boolean;
  preset: "flat" | "bass" | "vocal" | "bright" | "custom";
  bass: number;
  mid: number;
  treble: number;
}

export interface SettingsState {
  theme: ThemeMode;
  locale: Locale;
  autoplay: boolean;
  shuffleDefault: boolean;
  crossfadeSeconds: number;
  quality: Quality;
  normalizeVolume: boolean;
  equalizer: EqualizerSettings;
  notifications: boolean;
  showVisualizer: boolean;
  gapless: boolean;
  setTheme: (theme: ThemeMode) => void;
  setLocale: (locale: Locale) => void;
  setAutoplay: (value: boolean) => void;
  setShuffleDefault: (value: boolean) => void;
  setCrossfade: (value: number) => void;
  setQuality: (quality: Quality) => void;
  setNormalizeVolume: (value: boolean) => void;
  setEqualizer: (patch: Partial<EqualizerSettings>) => void;
  setNotifications: (value: boolean) => void;
  setShowVisualizer: (value: boolean) => void;
  setGapless: (value: boolean) => void;
  reset: () => void;
}

const initialEqualizer: EqualizerSettings = {
  enabled: false,
  preset: "flat",
  bass: 0,
  mid: 0,
  treble: 0,
};

export const DEFAULT_SETTINGS = {
  theme: "dark" as ThemeMode,
  locale: DEFAULT_LOCALE,
  autoplay: true,
  shuffleDefault: false,
  crossfadeSeconds: DEFAULT_CROSSFADE_SECONDS,
  quality: "auto" as Quality,
  normalizeVolume: false,
  equalizer: initialEqualizer,
  notifications: true,
  showVisualizer: true,
  gapless: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      setTheme: (theme) => set({ theme }),
      setLocale: (locale) => set({ locale: isLocale(locale) ? locale : DEFAULT_LOCALE }),
      setAutoplay: (autoplay) => set({ autoplay }),
      setShuffleDefault: (shuffleDefault) => set({ shuffleDefault }),
      setCrossfade: (crossfadeSeconds) =>
        set({ crossfadeSeconds: Math.min(Math.max(crossfadeSeconds, 0), 12) }),
      setQuality: (quality) => set({ quality }),
      setNormalizeVolume: (normalizeVolume) => set({ normalizeVolume }),
      setEqualizer: (patch) => set((state) => ({ equalizer: { ...state.equalizer, ...patch } })),
      setNotifications: (notifications) => set({ notifications }),
      setShowVisualizer: (showVisualizer) => set({ showVisualizer }),
      setGapless: (gapless) => set({ gapless }),
      reset: () => set({ ...DEFAULT_SETTINGS }),
    }),
    {
      name: "vybe:settings",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        locale: state.locale,
        autoplay: state.autoplay,
        shuffleDefault: state.shuffleDefault,
        crossfadeSeconds: state.crossfadeSeconds,
        quality: state.quality,
        normalizeVolume: state.normalizeVolume,
        equalizer: state.equalizer,
        notifications: state.notifications,
        showVisualizer: state.showVisualizer,
        gapless: state.gapless,
      }),
    },
  ),
);

export const EQ_PRESETS: Record<EqualizerSettings["preset"], { bass: number; mid: number; treble: number }> = {
  flat: { bass: 0, mid: 0, treble: 0 },
  bass: { bass: 6, mid: 1, treble: -2 },
  vocal: { bass: -1, mid: 4, treble: 1 },
  bright: { bass: -2, mid: 1, treble: 5 },
  custom: { bass: 0, mid: 0, treble: 0 },
};
