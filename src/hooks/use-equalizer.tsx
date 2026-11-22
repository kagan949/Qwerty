"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/store/settings-store";
import { getAudioEngine } from "@/lib/audio-engine";

/**
 * Applies the three-band equalizer to the shared AudioContext when available.
 * Biquad filters are created once per context and persisted across tracks.
 */
export function useEqualizer() {
  const equalizer = useSettingsStore((state) => state.equalizer);

  useEffect(() => {
    const engine = getAudioEngine();
    const apply = () => {
      const context = engine.context;
      const analyser = engine.analyserNode;
      if (!context || !analyser) return false;
      const existing = (context as unknown as { __vybeEq?: { bass: BiquadFilterNode; mid: BiquadFilterNode; treble: BiquadFilterNode } }).__vybeEq;
      if (existing) {
        existing.bass.gain.value = equalizer.enabled ? equalizer.bass : 0;
        existing.mid.gain.value = equalizer.enabled ? equalizer.mid : 0;
        existing.treble.gain.value = equalizer.enabled ? equalizer.treble : 0;
        return true;
      }
      try {
        const bass = context.createBiquadFilter();
        bass.type = "lowshelf";
        bass.frequency.value = 200;
        bass.gain.value = equalizer.enabled ? equalizer.bass : 0;
        const mid = context.createBiquadFilter();
        mid.type = "peaking";
        mid.frequency.value = 1000;
        mid.Q.value = 0.9;
        mid.gain.value = equalizer.enabled ? equalizer.mid : 0;
        const treble = context.createBiquadFilter();
        treble.type = "highshelf";
        treble.frequency.value = 5000;
        treble.gain.value = equalizer.enabled ? equalizer.treble : 0;
        // Insert the chain between the source and the analyser output.
        analyser.connect(bass);
        bass.connect(mid);
        mid.connect(treble);
        treble.connect(context.destination);
        (context as unknown as { __vybeEq?: unknown }).__vybeEq = { bass, mid, treble };
      } catch {
        // EQ is a progressive enhancement.
      }
      return true;
    };
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (apply() || attempts > 20) clearInterval(timer);
    }, 500);
    return () => clearInterval(timer);
  }, [equalizer]);
}
