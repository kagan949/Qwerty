import Dexie, { type EntityTable } from "dexie";
import type { PlayEvent, Playlist, RecentPlay, SearchHistoryEntry, Track } from "@/types";

/**
 * A user-uploaded track. The audio blob itself lives in the same row so the
 * file survives reloads and is available offline (IndexedDB, not Cache API,
 * because blob URLs are not addressable from a service worker).
 */
export interface LocalTrackRecord {
  id: string; // uuid, no prefix
  title: string;
  artist: string;
  album?: string;
  genre?: string;
  year?: number;
  duration: number;
  /** Raw audio bytes. Persisted — never only a URL. */
  blob: Blob;
  mimeType: string;
  fileName: string;
  fileSize: number;
  /** Embedded cover, extracted from ID3/Vorbis/MP4 metadata when present. */
  cover?: Blob;
  addedAt: number;
  updatedAt: number;
  favorite?: boolean;
  /** "name:size:lastModified" fingerprint used to prevent duplicate imports. */
  fileHash?: string;
}

export interface FavoriteRecord {
  /** track.id */
  id: string;
  addedAt: number;
  track: Track;
}

export interface PlaylistRecord {
  id: string;
  name: string;
  description?: string;
  tracks: Track[];
  cover?: Blob;
  coverUrl?: string;
  createdAt: number;
  updatedAt: number;
}

export interface SettingRecord {
  key: string;
  value: unknown;
  updatedAt: number;
}

/** Cached remote metadata so the app still renders when APIs are down. */
export interface CacheRecord {
  key: string;
  value: unknown;
  updatedAt: number;
  expiresAt: number;
}

export interface OfflineRecord {
  trackId: string;
  url: string;
  size: number;
  downloadedAt: number;
}

export class VybeDatabase extends Dexie {
  localTracks!: EntityTable<LocalTrackRecord, "id">;
  favorites!: EntityTable<FavoriteRecord, "id">;
  playlists!: EntityTable<PlaylistRecord, "id">;
  recentPlays!: EntityTable<RecentPlay & { id: string }, "id">;
  playEvents!: EntityTable<PlayEvent, "id">;
  searchHistory!: EntityTable<SearchHistoryEntry & { id: string }, "id">;
  settings!: EntityTable<SettingRecord, "key">;
  cache!: EntityTable<CacheRecord, "key">;
  offline!: EntityTable<OfflineRecord, "trackId">;

  constructor() {
    super("vybe");
    this.version(1).stores({
      localTracks: "id, addedAt, artist, title",
      favorites: "id, addedAt",
      playlists: "id, name, updatedAt",
      recentPlays: "id, playedAt, trackId",
      playEvents: "++id, playedAt, trackId, source",
      searchHistory: "id, createdAt",
      settings: "key",
      cache: "key, expiresAt",
      offline: "trackId",
    });
  }
}

let instance: VybeDatabase | null = null;

export function getDb(): VybeDatabase {
  if (typeof window === "undefined") {
    throw new Error("VYBE database is only available in the browser");
  }
  if (!instance) instance = new VybeDatabase();
  return instance;
}

export function db(): VybeDatabase {
  return getDb();
}

export function toPlaylist(record: PlaylistRecord): Playlist {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    coverUrl: record.coverUrl,
    coverBlob: record.cover,
    tracks: record.tracks ?? [],
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
