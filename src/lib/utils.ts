import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number | undefined | null): string {
  if (!seconds || !Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** "3 hr 24 min" style using locale-aware units via Intl. */
export function formatDurationLong(seconds: number, locale = "en"): string {
  if (!seconds || seconds < 0) return "—";
  const totalMinutes = Math.round(seconds / 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h} ${locale === "ru" ? "ч" : "h"}`);
  if (m > 0 || h === 0) parts.push(`${m} ${locale === "ru" ? "мин" : "min"}`);
  return parts.join(" ");
}

export function formatBytes(bytes: number | undefined | null): string {
  if (!bytes || bytes <= 0) return "0 MB";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value >= 10 || i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function uid(prefix = ""): string {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return prefix ? `${prefix}:${id}` : id;
}

export function absoluteUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "";
  if (!base) return path;
  return `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export function sanitizeText(value: string | undefined | null, max = 300): string {
  if (!value) return "";
  // Strip control chars and clamp length. React escapes output, so this is
  // defense-in-depth for strings that end up inside attributes.
  return value.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, max);
}

export function encodeSrc(url: string): string {
  return encodeURIComponent(url);
}

/** Deterministic gradient pair for an entity, used when no artwork exists. */
export function gradientFor(seed: string): [string, string] {
  const palettes: [string, string][] = [
    ["#7c3aed", "#06b6d4"],
    ["#a855f7", "#ec4899"],
    ["#3b82f6", "#8b5cf6"],
    ["#06b6d4", "#22d3ee"],
    ["#8b5cf6", "#f59e0b"],
    ["#6366f1", "#a855f7"],
    ["#0ea5e9", "#7c3aed"],
    ["#f43f5e", "#8b5cf6"],
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return palettes[hash % palettes.length];
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function isBrowser() {
  return typeof window !== "undefined";
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Shuffle without mutating the source. */
export function shuffled<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function normalizeForSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function isDownloadedAssetUrl(value: string | undefined): boolean {
  return Boolean(value && value.startsWith("/api/"));
}

export function safeInt(value: string | null, fallback: number, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return clamp(parsed, min, max);
}

export function pluralize(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}
