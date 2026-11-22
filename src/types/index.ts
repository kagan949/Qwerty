/**
 * Core domain types shared across the app.
 */

export type TrackSource = "jamendo" | "archive" | "curated" | "local";

export interface Track {
  /** Stable, namespaced id, e.g. `jamendo:123`, `archive:item/file.mp3`, `local:uuid` */
  id: string;
  source: TrackSource;
  title: string;
  artist: string;
  album?: string;
  artistId?: string;
  albumId?: string;
  /** Display artwork (already proxied for remote sources). */
  artwork?: string;
  /** Duration in seconds. 0 when unknown. */
  duration: number;
  /**
   * Value handed to the audio engine.
   * - remote: `/api/audio?src=...`
   * - local: `local:<localTrackId>` (resolved to an object URL at play time)
   */
  streamUrl: string;
  genre?: string;
  year?: number;
  license?: string;
  licenseUrl?: string;
  /** Human readable attribution page. */
  sourceUrl?: string;
  isLocal?: boolean;
  localId?: string;
  addedAt?: number;
  /** Offline copy available through the Service Worker Cache API. */
  offline?: boolean;
  bitrate?: number;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artwork?: string;
  year?: number;
  trackCount?: number;
  source: TrackSource;
}

export interface Artist {
  id: string;
  name: string;
  image?: string;
  trackCount?: number;
  source: TrackSource;
}

export interface PlaylistTrackRef {
  /** Full snapshot so curated/remote playlists survive offline metadata reads. */
  track: Track;
  addedAt: number;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  coverBlob?: Blob;
  tracks: Track[];
  createdAt: number;
  updatedAt: number;
  curated?: boolean;
  mixId?: string;
}

export interface CuratedMix {
  id: string;
  name: string;
  description: string;
  artwork: string;
  accent: string;
  source: "jamendo" | "archive";
  trackCount?: number;
}

export interface Genre {
  slug: string;
  label: string;
  accent: string;
  source: "jamendo" | "archive";
  icon?: string;
}

export interface SearchResults {
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
  sources: SourceStatus[];
}

export type SourceId = "jamendo" | "archive";

export interface SourceStatus {
  id: SourceId;
  name: string;
  ok: boolean;
  latencyMs?: number;
  error?: string;
  license: string;
  homepage: string;
}

export interface HomeSection {
  id: string;
  title: string;
  subtitle?: string;
  kind: "tracks" | "albums" | "artists" | "mixes";
  items: Track[] | Album[] | Artist[] | CuratedMix[];
}

export interface HomePayload {
  sections: HomeSection[];
  sources: SourceStatus[];
  generatedAt: number;
}

export interface ExplorePayload {
  mixes: CuratedMix[];
  genres: Genre[];
  collections: Album[];
  sources: SourceStatus[];
}

export interface RecentPlay {
  trackId: string;
  track: Track;
  playedAt: number;
}

export interface PlayEvent {
  id?: number;
  trackId: string;
  title: string;
  artist: string;
  source: TrackSource;
  playedAt: number;
  listenedSeconds: number;
}

export interface SearchHistoryEntry {
  query: string;
  createdAt: number;
}

export type RepeatMode = "off" | "all" | "one";
export type ThemeMode = "dark" | "light";
export type Quality = "auto" | "high" | "medium" | "low";

export interface SleepTimerState {
  /** Epoch ms when playback should stop, or null when disabled. */
  endsAt: number | null;
  /** Stop after the current track instead of a countdown. */
  endOfTrack: boolean;
}
