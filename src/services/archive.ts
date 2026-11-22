import type { Album, Track } from "@/types";
import { fetchJson } from "@/lib/http";

/**
 * Internet Archive — Advanced Search + Metadata APIs.
 * Docs:
 *  - https://archive.org/advancedsearch.php
 *  - https://archive.org/developers/md-read
 *
 * We restrict every query to the `audio` mediatype and to collections that are
 * clearly public (netlabels, audio_music, 78rpm) and surface each item's
 * license fields when present. Nothing is scraped or proxied illegally: IA's
 * public API and CDN explicitly allow third-party streaming.
 */
const IA_HOST = "https://archive.org";

const AUDIO_EXTENSIONS = [".mp3", ".ogg", ".m4a", ".flac", ".wav", ".opus"];

/** Collections with reliably public / openly licensed audio. */
const SAFE_COLLECTIONS = [
  "audio_music",
  "netlabels",
  "78rpm",
  "opensource_audio",
  "audio_foreign",
  "etree",
];

interface IaSearchDoc {
  identifier: string;
  title?: string | string[];
  creator?: string | string[] | { name?: string }[];
  year?: string;
  date?: string;
  subject?: string | string[];
  licenseurl?: string;
  collection?: string | string[];
  downloads?: number;
  item_size?: number;
  mediatype?: string;
}

interface IaSearchResponse {
  response: {
    numFound: number;
    start: number;
    docs: IaSearchDoc[];
  };
}

interface IaMetadataFile {
  name: string;
  source?: string;
  format?: string;
  length?: string;
  title?: string;
  artist?: string;
  album?: string;
  track?: string;
  size?: string;
}

interface IaMetadataResponse {
  metadata?: {
    identifier: string;
    title?: string | string[];
    creator?: string | string[];
    licenseurl?: string;
    date?: string;
    year?: string;
    subject?: string | string[];
    collection?: string | string[];
  };
  files?: IaMetadataFile[];
  server?: string;
  dir?: string;
}

function asString(value: string | string[] | { name?: string }[] | undefined): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    if (value.length === 0) return "";
    const first = value[0];
    return typeof first === "string" ? first : (first?.name ?? "");
  }
  return "";
}

function collectionFilter(): string {
  return `(${SAFE_COLLECTIONS.map((c) => `collection:${c}`).join(" OR ")})`;
}

function isPublicDoc(doc: IaSearchDoc): boolean {
  if (doc.mediatype && doc.mediatype !== "audio") return false;
  const collections = Array.isArray(doc.collection) ? doc.collection : doc.collection ? [doc.collection] : [];
  return collections.some((c) => SAFE_COLLECTIONS.includes(c));
}

export function archiveArtwork(identifier: string): string {
  return `/api/artwork?src=${encodeURIComponent(`${IA_HOST}/services/img/${identifier}`)}`;
}

function fileUrl(identifier: string, fileName: string): string {
  // The proxies re-validate the host; encoding each path segment protects
  // against path traversal through crafted file names.
  const encoded = fileName
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${IA_HOST}/download/${encodeURIComponent(identifier)}/${encoded}`;
}

function parseLength(value: string | undefined): number {
  if (!value) return 0;
  const parsed = Number(value);
  if (Number.isFinite(parsed)) return Math.round(parsed);
  // Some items carry mm:ss
  const match = value.match(/^(\d+):(\d{2})$/);
  if (match) return Number(match[1]) * 60 + Number(match[2]);
  return 0;
}

function audioFiles(files: IaMetadataFile[] | undefined): IaMetadataFile[] {
  if (!files) return [];
  const seen = new Set<string>();
  return files
    .filter((file) => {
      const lower = file.name.toLowerCase();
      if (!AUDIO_EXTENSIONS.some((ext) => lower.endsWith(ext))) return false;
      // Skip derivatives when originals exist in a common format
      if (file.source === "derivative" && files.some((f) => f.name === lower.replace(/\.(ogg|opus)$/, ".mp3"))) return false;
      if (seen.has(file.name)) return false;
      seen.add(file.name);
      return true;
    })
    .slice(0, 60);
}

function trackFromFile(meta: IaMetadataResponse, file: IaMetadataFile, index: number): Track {
  const identifier = meta.metadata?.identifier ?? "";
  const title =
    file.title?.trim() ||
    file.name
      .replace(/\.[^.]+$/, "")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim() ||
    `Track ${index + 1}`;
  const rawUrl = fileUrl(identifier, file.name);
  const licenseUrl = meta.metadata?.licenseurl;
  return {
    id: `archive:${identifier}/${file.name}`,
    source: "archive",
    title,
    artist: file.artist?.trim() || asString(meta.metadata?.creator) || "Internet Archive",
    album: file.album?.trim() || asString(meta.metadata?.title) || undefined,
    albumId: `archive-item:${identifier}`,
    artwork: archiveArtwork(identifier),
    duration: parseLength(file.length),
    streamUrl: `/api/audio?src=${encodeURIComponent(rawUrl)}`,
    genre: asString(meta.metadata?.subject).split(/[;,]/)[0]?.trim() || undefined,
    year: Number(meta.metadata?.year ?? meta.metadata?.date?.slice(0, 4)) || undefined,
    license: licenseUrl ? "Open license" : "Public collection",
    licenseUrl: licenseUrl || `https://archive.org/details/${identifier}`,
    sourceUrl: `https://archive.org/details/${identifier}`,
    bitrate: 128,
  };
}

export async function searchArchive(query: string, limit = 20) {
  const q = `(${query}) AND mediatype:audio AND ${collectionFilter()}`;
  const params = new URLSearchParams({
    q,
    fl: "identifier,title,creator,year,date,subject,licenseurl,collection,downloads,mediatype",
    rows: String(limit),
    page: "1",
    output: "json",
    sort: "downloads desc",
  });
  const url = `${IA_HOST}/advancedsearch.php?${params.toString()}`;
  const data = await fetchJson<IaSearchResponse>(url, { revalidate: 600 });
  const docs = (data.response?.docs ?? []).filter(isPublicDoc);

  const tracks = await Promise.all(
    docs.slice(0, 8).map(async (doc) => {
      const first = await archiveItemFirstTracks(doc.identifier, 1);
      return first;
    }),
  );
  const albums: Album[] = docs.map((doc) => ({
    id: `archive-item:${doc.identifier}`,
    title: asString(doc.title) || doc.identifier,
    artist: asString(doc.creator) || "Internet Archive",
    artwork: archiveArtwork(doc.identifier),
    year: Number(doc.year ?? doc.date?.slice(0, 4)) || undefined,
    source: "archive",
  }));

  return { tracks: tracks.flat(), albums };
}

export async function archiveItemFirstTracks(identifier: string, limit = 3): Promise<Track[]> {
  const meta = await fetchJson<IaMetadataResponse>(`${IA_HOST}/metadata/${encodeURIComponent(identifier)}`, {
    revalidate: 3600,
    timeoutMs: 7000,
  });
  if (!meta.metadata) return [];
  return audioFiles(meta.files).slice(0, limit).map((file, index) => trackFromFile(meta, file, index));
}

export async function archiveItemTracks(identifier: string): Promise<Track[]> {
  const meta = await fetchJson<IaMetadataResponse>(`${IA_HOST}/metadata/${encodeURIComponent(identifier)}`, {
    revalidate: 3600,
    timeoutMs: 9000,
  });
  if (!meta.metadata) return [];
  return audioFiles(meta.files).map((file, index) => trackFromFile(meta, file, index));
}

export async function archivePopular(limit = 12): Promise<Album[]> {
  const params = new URLSearchParams({
    q: `mediatype:audio AND ${collectionFilter()}`,
    fl: "identifier,title,creator,year,downloads,collection,mediatype",
    rows: String(limit),
    page: "1",
    output: "json",
    sort: "downloads desc",
  });
  const data = await fetchJson<IaSearchResponse>(`${IA_HOST}/advancedsearch.php?${params.toString()}`, {
    revalidate: 1800,
  });
  return (data.response?.docs ?? [])
    .filter(isPublicDoc)
    .map((doc) => ({
      id: `archive-item:${doc.identifier}`,
      title: asString(doc.title) || doc.identifier,
      artist: asString(doc.creator) || "Internet Archive",
      artwork: archiveArtwork(doc.identifier),
      year: Number(doc.year ?? doc.date?.slice(0, 4)) || undefined,
      source: "archive" as const,
    }));
}

export async function archiveRecentlyAdded(limit = 12): Promise<Track[]> {
  const params = new URLSearchParams({
    q: `mediatype:audio AND ${collectionFilter()} AND date:[2020-01-01 TO 2030-12-31]`,
    fl: "identifier,title,creator,year,date,collection,mediatype",
    rows: String(limit),
    page: "1",
    output: "json",
    sort: "addeddate desc",
  });
  const data = await fetchJson<IaSearchResponse>(`${IA_HOST}/advancedsearch.php?${params.toString()}`, {
    revalidate: 1800,
  });
  const docs = (data.response?.docs ?? []).filter(isPublicDoc).slice(0, 8);
  const batches = await Promise.all(docs.map((doc) => archiveItemFirstTracks(doc.identifier, 2).catch(() => [])));
  return batches.flat();
}

/** Curated, long-lived public-domain collections that are safe to feature. */
export const ARCHIVE_FEATURED_COLLECTIONS = [
  { identifier: "78rpm", title: "78 RPMs & Cylinders", creator: "Internet Archive" },
  { identifier: "netlabels", title: "Netlabels", creator: "Independent labels" },
  { identifier: "opensource_audio", title: "Open Source Audio", creator: "Community" },
  { identifier: "audio_music", title: "Community Music", creator: "Internet Archive" },
];

export async function archiveCollectionItems(identifier: string, limit = 6) {
  const tracks = await archiveItemTracks(identifier).catch(() => []);
  return tracks.slice(0, limit);
}

export function isAllowedArchiveHost(url: string): boolean {
  try {
    const { hostname, protocol } = new URL(url);
    if (protocol !== "https:") return false;
    return (
      hostname === "archive.org" ||
      hostname.endsWith(".archive.org") ||
      hostname === "ia801508.us.archive.org"
    );
  } catch {
    return false;
  }
}
