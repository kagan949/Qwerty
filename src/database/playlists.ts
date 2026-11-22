import { getDb, toPlaylist, type PlaylistRecord } from "@/database/db";
import type { Playlist, Track } from "@/types";
import { uid } from "@/lib/utils";

export async function listPlaylists(): Promise<Playlist[]> {
  const rows = await getDb().playlists.orderBy("updatedAt").reverse().toArray();
  return rows.map(toPlaylist);
}

export async function getPlaylist(id: string): Promise<Playlist | undefined> {
  const row = await getDb().playlists.get(id);
  return row ? toPlaylist(row) : undefined;
}

export async function createPlaylist(name: string, description?: string, tracks: Track[] = []): Promise<Playlist> {
  const now = Date.now();
  const record: PlaylistRecord = {
    id: uid("pl"),
    name: name.trim() || "Untitled playlist",
    description,
    tracks,
    createdAt: now,
    updatedAt: now,
  };
  await getDb().playlists.put(record);
  return toPlaylist(record);
}

export async function updatePlaylist(
  id: string,
  patch: Partial<Pick<PlaylistRecord, "name" | "description" | "tracks" | "cover" | "coverUrl">>,
): Promise<void> {
  await getDb().playlists.update(id, { ...patch, updatedAt: Date.now() });
}

export async function deletePlaylist(id: string): Promise<void> {
  await getDb().playlists.delete(id);
}

export async function addTracksToPlaylist(id: string, tracks: Track[]): Promise<number> {
  const database = getDb();
  const record = await database.playlists.get(id);
  if (!record) throw new Error("Playlist not found");
  const existing = new Set(record.tracks.map((t) => t.id));
  const fresh = tracks.filter((t) => !existing.has(t.id));
  if (fresh.length === 0) return 0;
  await database.playlists.update(id, {
    tracks: [...record.tracks, ...fresh],
    updatedAt: Date.now(),
  });
  return fresh.length;
}

export async function removeTrackFromPlaylist(id: string, trackId: string): Promise<void> {
  const database = getDb();
  const record = await database.playlists.get(id);
  if (!record) return;
  await database.playlists.update(id, {
    tracks: record.tracks.filter((t) => t.id !== trackId),
    updatedAt: Date.now(),
  });
}

export async function reorderPlaylistTrack(id: string, from: number, to: number): Promise<void> {
  const database = getDb();
  const record = await database.playlists.get(id);
  if (!record) return;
  const next = [...record.tracks];
  if (from < 0 || to < 0 || from >= next.length || to >= next.length) return;
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  await database.playlists.update(id, { tracks: next, updatedAt: Date.now() });
}

export async function isTrackInAnyPlaylist(trackId: string): Promise<string[]> {
  const playlists = await listPlaylists();
  return playlists.filter((p) => p.tracks.some((t) => t.id === trackId)).map((p) => p.id);
}
