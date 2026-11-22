import { Howl } from "howler";
import type { Track } from "@/types";

export interface EngineCallbacks {
  onTime?: (current: number, duration: number) => void;
  onLoad?: (duration: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnd?: () => void;
  onError?: (message: string) => void;
  onBuffer?: (buffering: boolean) => void;
}

interface LoadOptions {
  autoplay?: boolean;
  startAt?: number;
  volume?: number;
  muted?: boolean;
  rate?: number;
}

/**
 * VYBE audio engine.
 *
 * Howler.js is the transport (format fallbacks, mobile unlock, simple volume
 * ramps). Alongside it we attach a Web Audio AnalyserNode to the underlying
 * HTMLAudioElement so the full-screen visualizer renders *real* spectrum data.
 * If the browser refuses an analyser (locked context, unsupported element) the
 * visualizer falls back to a progress-driven animation — never fake data.
 */
export class AudioEngine {
  private howl: Howl | null = null;
  private listeners: EngineCallbacks = {};
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private analyserAttempted = false;
  private animationFrame: number | null = null;
  private targetVolume = 1;
  private muted = false;
  private rate = 1;
  private currentTrack: Track | null = null;
  private durationSeconds = 0;

  setCallbacks(callbacks: EngineCallbacks) {
    this.listeners = { ...this.listeners, ...callbacks };
  }

  get track(): Track | null {
    return this.currentTrack;
  }

  get analyserNode(): AnalyserNode | null {
    return this.analyser;
  }

  get duration(): number {
    return this.durationSeconds;
  }

  get context(): AudioContext | null {
    return this.audioContext;
  }

  private attachAnalyser() {
    if (this.analyser || this.analyserAttempted) return;
    this.analyserAttempted = true;
    try {
      const sounds = (this.howl as unknown as { _sounds?: { _node?: HTMLAudioElement }[] })?._sounds;
      const node = sounds?.[0]?._node;
      if (!node) return;
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      const context = this.audioContext ?? new Ctor();
      this.audioContext = context;
      if (context.state === "suspended") void context.resume();
      const source = context.createMediaElementSource(node);
      const analyser = context.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.82;
      source.connect(analyser);
      analyser.connect(context.destination);
      this.analyser = analyser;
    } catch {
      // Keep playing through the plain media element.
      this.analyser = null;
    }
  }

  private startTicker() {
    this.stopTicker();
    const tick = () => {
      if (!this.howl) return;
      if (this.howl.playing()) {
        const seek = this.howl.seek();
        const time = typeof seek === "number" ? seek : 0;
        const duration = this.howl.duration() || this.durationSeconds;
        if (duration && !this.durationSeconds) this.durationSeconds = duration;
        this.listeners.onTime?.(time, duration || this.durationSeconds);
      }
      this.animationFrame = requestAnimationFrame(tick);
    };
    this.animationFrame = requestAnimationFrame(tick);
  }

  private stopTicker() {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  load(track: Track, src: string, options: LoadOptions = {}) {
    this.stopTicker();
    this.unload();
    this.currentTrack = track;
    this.durationSeconds = track.duration || 0;
    this.analyser = null;
    this.analyserAttempted = false;
    this.targetVolume = options.volume ?? this.targetVolume;
    this.muted = options.muted ?? this.muted;
    this.rate = options.rate ?? this.rate;

    this.howl = new Howl({
      src: [src],
      html5: true,
      format: [guessFormat(track)],
      preload: true,
      autoplay: Boolean(options.autoplay),
      volume: this.muted ? 0 : this.targetVolume,
      rate: this.rate,
      xhr: { withCredentials: false },
      onload: () => {
        const duration = this.howl?.duration() ?? 0;
        if (duration && Number.isFinite(duration)) this.durationSeconds = duration;
        this.listeners.onLoad?.(this.durationSeconds);
        this.listeners.onBuffer?.(false);
        if (options.startAt && options.startAt > 0 && options.startAt < this.durationSeconds - 1) {
          this.howl?.seek(options.startAt);
        }
        if (options.autoplay) this.listeners.onPlay?.();
        this.attachAnalyser();
        this.startTicker();
      },
      onplay: () => {
        this.startTicker();
        this.listeners.onPlay?.();
        this.listeners.onBuffer?.(false);
        this.attachAnalyser();
      },
      onpause: () => this.listeners.onPause?.(),
      onstop: () => this.listeners.onPause?.(),
      onend: () => {
        this.stopTicker();
        this.listeners.onEnd?.();
      },
      onloaderror: () => {
        this.listeners.onBuffer?.(false);
        this.listeners.onError?.("load_error");
      },
      onplayerror: () => {
        // Mobile browsers reject autoplay until a gesture; try once more.
        this.howl?.once("unlock", () => this.howl?.play());
        this.listeners.onBuffer?.(false);
        this.listeners.onError?.("play_blocked");
      },
      onseek: () => {
        const seek = this.howl?.seek();
        if (typeof seek === "number") {
          this.listeners.onTime?.(seek, this.howl?.duration() || this.durationSeconds);
        }
      },
    });
    if (options.autoplay) this.howl.play();
  }

  play() {
    if (!this.howl) return;
    this.listeners.onBuffer?.(true);
    this.howl.play();
    if (this.audioContext?.state === "suspended") void this.audioContext.resume();
  }

  pause() {
    this.howl?.pause();
    this.listeners.onPause?.();
  }

  seek(seconds: number) {
    if (!this.howl) return;
    this.howl.seek(seconds);
    this.listeners.onTime?.(seconds, this.howl.duration() || this.durationSeconds);
  }

  setVolume(value: number, fadeMs = 0) {
    this.targetVolume = Math.min(Math.max(value, 0), 1);
    if (!this.howl) return;
    if (this.muted) {
      this.howl.volume(0);
      return;
    }
    if (fadeMs > 0) {
      this.howl.fade(this.howl.volume() as number, this.targetVolume, fadeMs);
    } else {
      this.howl.volume(this.targetVolume);
    }
  }

  fadeTo(value: number, ms: number) {
    if (!this.howl) return;
    this.howl.fade(this.howl.volume() as number, Math.min(Math.max(value, 0), 1), ms);
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (!this.howl) return;
    this.howl.volume(muted ? 0 : this.targetVolume);
  }

  setRate(rate: number) {
    this.rate = rate;
    if (this.howl) this.howl.rate(rate);
  }

  unload() {
    this.stopTicker();
    if (this.howl) {
      this.howl.stop();
      this.howl.unload();
      this.howl = null;
    }
    this.targetVolume = 1;
  }

  suspendContext() {
    if (this.audioContext?.state === "running") void this.audioContext.suspend();
  }

  resumeContext() {
    if (this.audioContext?.state === "suspended") void this.audioContext.resume();
  }
}

function guessFormat(track: Track): string {
  if (track.isLocal && track.streamUrl.includes(".")) {
    const ext = track.streamUrl.split(".").pop()?.split("?")[0];
    if (ext) return ext;
  }
  const url = track.streamUrl.toLowerCase();
  if (url.includes(".ogg")) return "ogg";
  if (url.includes(".flac")) return "flac";
  if (url.includes(".wav")) return "wav";
  if (url.includes(".m4a") || url.includes(".mp4")) return "m4a";
  if (url.includes(".opus")) return "opus";
  return "mp3";
}

let engine: AudioEngine | null = null;

export function getAudioEngine(): AudioEngine {
  if (!engine) engine = new AudioEngine();
  return engine;
}
