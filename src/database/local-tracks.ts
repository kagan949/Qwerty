import { getDb, type LocalTrackRecord } from "@/database/db";
import type { Track } from "@/types";
import { encodeSrc } from "@/lib/utils";

export function localRecordToTrack(record: LocalTrackRecord): Track {
  return {
    id: `local:${record.id}`,
    localId: record.id,
    source: "local",
    isLocal: true,
    title: record.title,
    artist: record.artist || "Unknown artist",
    album: record.album,
    genre: record.genre,
    year: record.year,
    duration: record.duration,
    artwork: record.cover ? `/api/local-art/${record.id}` : undefined,
    streamUrl: `/api/local-audio/${record.id}`,
    addedAt: record.addedAt,
  };
}

export async function listLocalTracks(): Promise<Track[]> {
  const rows = await getDb().localTracks.orderBy("addedAt").reverse().toArray();
  return rows.map(localRecordToTrack);
}

export async function getLocalRecord(id: string): Promise<LocalTrackRecord | undefined> {
  return getDb().localTracks.get(id);
}

export async function updateLocalTrack(
  id: string,
  patch: Partial<Pick<LocalTrackRecord, "title" | "artist" | "album" | "genre" | "year" | "cover">>,
): Promise<void> {
  await getDb().localTracks.update(id, { ...patch, updatedAt: Date.now() });
}

export async function deleteLocalTrack(id: string): Promise<void> {
  const database = getDb();
  await database.transaction("rw", database.localTracks, database.favorites, async () => {
    await database.localTracks.delete(id);
    await database.favorites.delete(`local:${id}`);
  });
}

export function localAudioSrc(id: string): string {
  return `/api/local-audio/${encodeSrc(id)}`;
}

export function localArtSrc(id: string): string {
  return `/api/local-art/${encodeSrc(id)}`;
}
