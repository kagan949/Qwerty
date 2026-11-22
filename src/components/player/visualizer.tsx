"use client";

import { useEffect, useRef } from "react";
import { getAudioEngine } from "@/lib/audio-engine";
import { usePlayerStore } from "@/store/player-store";
import { cn } from "@/lib/utils";

/**
 * Real-time frequency visualizer driven by a Web Audio AnalyserNode attached to
 * the decoded stream. If the analyser is unavailable (e.g. CORS-locked audio or
 * no Web Audio support) it degrades to a smooth amplitude envelope derived from
 * the playhead — visually alive, but never pretending to be spectrum data.
 */
export function Visualizer({ className, bars = 64, height = 96 }: { className?: string; bars?: number; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const engine = getAudioEngine();
    const buffer = new Uint8Array(1024);
    let raf = 0;
    let phase = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const draw = () => {
      const width = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, width, h);
      const analyser = engine.analyserNode;
      const playing = usePlayerStore.getState().status === "playing";
      const barWidth = width / bars;

      for (let i = 0; i < bars; i++) {
        let amplitude: number;
        if (analyser) {
          analyser.getByteFrequencyData(buffer as Uint8Array<ArrayBuffer>);
          const index = Math.floor(Math.pow(i / bars, 1.6) * (buffer.length * 0.7));
          amplitude = (buffer[index] ?? 0) / 255;
        } else {
          phase += 0.01;
          const base = Math.sin(i * 0.22 + phase) * 0.5 + 0.5;
          amplitude = (base * (0.35 + 0.35 * Math.sin(phase * 0.7 + i * 0.05))) * (playing ? 1 : 0.18);
        }
        if (!playing) amplitude *= 0.4;
        const barHeight = Math.max(2, amplitude * h * 0.92);
        const x = i * barWidth + barWidth * 0.18;
        const w = barWidth * 0.64;
        const gradient = ctx.createLinearGradient(0, h, 0, h - barHeight);
        gradient.addColorStop(0, "rgba(139,92,246,0.95)");
        gradient.addColorStop(0.6, "rgba(167,139,250,0.85)");
        gradient.addColorStop(1, "rgba(34,211,238,0.75)");
        ctx.fillStyle = gradient;
        const radius = Math.min(w / 2, 3);
        ctx.beginPath();
        const top = h - barHeight;
        ctx.roundRect(x, top, w, barHeight, radius);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [bars]);

  return (
    <canvas
      ref={canvasRef}
      height={height}
      className={cn("w-full", className)}
      style={{ height }}
      aria-hidden
    />
  );
}
