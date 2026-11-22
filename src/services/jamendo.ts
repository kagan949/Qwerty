import type { Track } from "@/types";
import { fetchJson } from "@/lib/http";
import { AUDIO_PROXY_HOSTS } from "@/lib/constants";

/**
 * Jamendo API v3.0 — Creative Commons licensed music.
 * Docs: https://developer.jamendo.com/v3.0
 *
 * The API key is read from the server environment only. Jamendo publishes a
 * public demo `client_id` used by their own examples; we fall back to it so a
 * fresh clone of VYBE has a working catalogue with zero configuration.
 */
const JAMENDO_BASE = "https://api.jamendo.com/v3.0";
const DEFAULT_CLIENT_ID = "56d30c95";

export function jamendoClientId(): string {
  return process.env.JAMENDO_CLIENT_ID?.trim() || DEFAULT_CLIENT_ID;
}

interface JamendoTrack {
  id: string;
  name: string;
  duration: number;
  artist_id: string;
  artist_name: string;
  album_id: string;
  album_name: string;
  album_image?: string;
  image?: string;
  audio: string;
  audiodownload?: string;
  license_ccurl?: string;
  musicinfo?: { tags?: { genres?: string[] } };
  releasedate?: string;
}

interface JamendoAlbum {
  id: string;
  name: string;
  artist_id: string;
  artist_name: string;
  image?: string;
  releasedate?: string;
  trackcount?: number;
}

interface JamendoArtist {
  id: string;
  name: string;
  image?: string;
  website?: string;
  trackcount?: number;
}

interface JamendoResponse<T> {
  headers: { status: string; code: number; error_message?: string; results_count?: number };
  results: T[];
}

export function vinylArtwork(seed: string): string {
  // Jamendo has an official cover placeholder service. Using it keeps 100%
  // of cover art coming from the licensed source rather than a random image.
  return `https://imgjam.com/v3/albums/${encodeURIComponent(seed)}.jpg`;
}

function proxiedAudio(url: string | undefined): string {
  if (!url) return "";
  return `/api/audio?src=${encodeURIComponent(url)}`;
}

function normalizeTrack(item: JamendoTrack): Track {
  const artwork = item.album_image || item.image || vinylArtwork(item.album_id);
  return {
    id: `jamendo:${item.id}`,
    source: "jamendo",
    title: item.name,
    artist: item.artist_name,
    artistId: `jamendo-artist:${item.artist_id}`,
    album: item.album_name,
    albumId: `jamendo-album:${item.album_id}`,
    artwork,
    duration: Number(item.duration) || 0,
    streamUrl: proxiedAudio(item.audio),
    genre: item.musicinfo?.tags?.genres?.[0],
    year: item.releasedate ? Number(item.releasedate.slice(0, 4)) : undefined,
    license: "Creative Commons",
    licenseUrl: item.license_ccurl || "https://creativecommons.org/licenses/",
    sourceUrl: `https://www.jamendo.com/track/${item.id}`,
    bitrate: 128,
  };
}

function normalizeAlbum(item: JamendoAlbum) {
  return {
    id: `jamendo-album:${item.id}`,
    title: item.name,
    artist: item.artist_name,
    artwork: item.image || vinylArtwork(item.id),
    year: item.releasedate ? Number(item.releasedate.slice(0, 4)) : undefined,
    trackCount: item.trackcount,
    source: "jamendo" as const,
  };
}

function normalizeArtist(item: JamendoArtist) {
  return {
    id: `jamendo-artist:${item.id}`,
    name: item.name,
    image: item.image,
    trackCount: item.trackcount,
    source: "jamendo" as const,
  };
}

function buildUrl(path: string, params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams({
    client_id: jamendoClientId(),
    format: "json",
    imagesize: "500",
    audiodlformat: "mp32",
  });
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  return `${JAMENDO_BASE}/${path}/?${search.toString()}`;
}

async function request<T>(path: string, params: Record<string, string | number | undefined>, revalidate = 300) {
  const data = await fetchJson<JamendoResponse<T>>(buildUrl(path, params), { revalidate, timeoutMs: 8000 });
  const status = data.headers?.status;
  if (status && status !== "success") {
    throw new Error(data.headers.error_message || "Jamendo request failed");
  }
  return data.results ?? [];
}

export async function searchJamendo(query: string, limit = 24) {
  const [tracks, albums, artists] = await Promise.all([
    request<JamendoTrack>("tracks", { search: query, limit, order: "popularity_total", include: "musicinfo" }),
    request<JamendoAlbum>("albums", { search: query, limit: Math.min(limit, 12), order: "popularity_total" }),
    request<JamendoArtist>("artists", { search: query, limit: Math.min(limit, 8), order: "popularity_total" }),
  ]);
  return {
    tracks: tracks.map(normalizeTrack),
    albums: albums.map(normalizeAlbum),
    artists: artists.map(normalizeArtist),
  };
}

export async function jamendoTracksByTag(tag: string, limit = 24) {
  const tracks = await request<JamendoTrack>("tracks", {
    tags: tag,
    limit,
    order: "popularity_month",
    include: "musicinfo",
    groupby: "artist",
  });
  return tracks.map(normalizeTrack);
}

export async function jamendoTrending(limit = 24) {
  const tracks = await request<JamendoTrack>("tracks", {
    limit,
    order: "popularity_total",
    include: "musicinfo",
    featured: 1,
  });
  return tracks.map(normalizeTrack);
}

export async function jamendoNewReleases(limit = 24) {
  const tracks = await request<JamendoTrack>("tracks", {
    limit,
    order: "releasedate_desc",
    include: "musicinfo",
  });
  return tracks.map(normalizeTrack);
}

export async function jamendoAlbumTracks(albumId: string, limit = 50) {
  const tracks = await request<JamendoTrack>("albums/tracks", {
    id: albumId,
    limit,
    include: "musicinfo",
  });
  return tracks.map(normalizeTrack);
}

export async function jamendoArtistTracks(artistId: string, limit = 50) {
  const tracks = await request<JamendoTrack>("artists/tracks", {
    id: artistId,
    limit,
    include: "musicinfo",
    order: "popularity_total",
  });
  return tracks.map(normalizeTrack);
}

export async function jamendoTrackById(trackId: string) {
  const tracks = await request<JamendoTrack>("tracks", { id: trackId, include: "musicinfo" });
  return tracks[0] ? normalizeTrack(tracks[0]) : null;
}

export async function jamendoArtists(limit = 12) {
  const artists = await request<JamendoArtist>("artists", { limit, order: "popularity_total" });
  return artists.map(normalizeArtist);
}

export async function jamendoAlbums(limit = 12) {
  const albums = await request<JamendoAlbum>("albums", { limit, order: "popularity_total", imagesize: 500 });
  return albums.map(normalizeAlbum);
}

export function isAllowedJamendoHost(url: string): boolean {
  try {
    const { hostname, protocol } = new URL(url);
    if (protocol !== "https:") return false;
    return AUDIO_PROXY_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}
