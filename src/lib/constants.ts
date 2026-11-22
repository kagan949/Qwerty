import type { Genre } from "@/types";

export const APP_NAME = "VYBE";
export const APP_TAGLINE = "Sound without limits";

export const STORAGE_KEYS = {
  settings: "vybe:settings",
  player: "vybe:player",
  searchHistory: "vybe:search-history",
  ui: "vybe:ui",
  localeSeen: "vybe:locale-initialised",
} as const;

export const MAX_UPLOAD_BYTES = 120 * 1024 * 1024; // 120 MB per file
export const MAX_UPLOAD_FILES = 50;
export const SEARCH_DEBOUNCE_MS = 320;
export const SEARCH_HISTORY_LIMIT = 10;
export const RECENT_PLAYS_LIMIT = 24;
export const SEARCH_LIMIT = 24;

export const SUPPORTED_AUDIO_EXTENSIONS = [
  "mp3",
  "wav",
  "flac",
  "m4a",
  "aac",
  "ogg",
  "oga",
  "opus",
  "m4b",
  "mp4",
] as const;

export const SUPPORTED_AUDIO_MIMES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/flac",
  "audio/x-flac",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
  "audio/aacp",
  "audio/ogg",
  "audio/opus",
  "audio/vorbis",
  "application/ogg",
  "audio/webm",
] as const;

export const GENRES: Genre[] = [
  { slug: "electronic", label: "Electronic", accent: "from-violet-600 via-purple-500 to-fuchsia-500", source: "jamendo" },
  { slug: "chill", label: "Chillout", accent: "from-cyan-500 via-sky-500 to-blue-600", source: "jamendo" },
  { slug: "hiphop", label: "Hip-Hop", accent: "from-amber-500 via-orange-500 to-rose-500", source: "jamendo" },
  { slug: "rock", label: "Rock", accent: "from-rose-600 via-red-500 to-orange-500", source: "jamendo" },
  { slug: "pop", label: "Pop", accent: "from-pink-500 via-fuchsia-500 to-violet-500", source: "jamendo" },
  { slug: "jazz", label: "Jazz", accent: "from-indigo-500 via-blue-500 to-cyan-400", source: "jamendo" },
  { slug: "classical", label: "Classical", accent: "from-emerald-500 via-teal-500 to-cyan-500", source: "jamendo" },
  { slug: "folk", label: "Folk", accent: "from-lime-600 via-emerald-500 to-teal-500", source: "jamendo" },
  { slug: "metal", label: "Metal", accent: "from-slate-600 via-zinc-500 to-stone-500", source: "jamendo" },
  { slug: "reggae", label: "Reggae", accent: "from-green-500 via-emerald-500 to-yellow-500", source: "jamendo" },
  { slug: "soundtrack", label: "Soundtrack", accent: "from-purple-700 via-violet-600 to-indigo-500", source: "jamendo" },
  { slug: "ambient", label: "Ambient", accent: "from-sky-600 via-cyan-500 to-emerald-400", source: "jamendo" },
];

export const JAMENDO_TAG_OVERRIDES: Record<string, string> = {
  hiphop: "hiphop",
  classical: "classical",
  soundtrack: "soundtrack",
};

export const AUDIO_PROXY_HOSTS = [
  "archive.org",
  "ia600000.us.archive.org",
  "jamendo.com",
  "jamendo.net",
  "storage.jamendo.com",
  "prod-1.storage.jamendo.com",
  "prod-2.storage.jamendo.com",
  "prod-3.storage.jamendo.com",
  "prod-4.storage.jamendo.com",
  "mp3l.jamendo.com",
  "mp3d.jamendo.com",
  "imgjam.com",
];

export const DEFAULT_CROSSFADE_SECONDS = 0;
export const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 1.75, 2] as const;
export const SLEEP_TIMER_MINUTES = [15, 30, 45, 60, 90] as const;
