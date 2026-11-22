import { getDb } from "@/database/db";
import type { Track } from "@/types";

export async function addFavorite(track: Track): Promise<void> {
  await getDb().favorites.put({ id: track.id, addedAt: Date.now(), track });
}

export async function removeFavorite(trackId: string): Promise<void> {
  await getDb().favorites.delete(trackId);
}

export async function toggleFavorite(track: Track): Promise<boolean> {
  const database = getDb();
  const existing = await database.favorites.get(track.id);
  if (existing) {
    await database.favorites.delete(track.id);
    return false;
  }
  await database.favorites.put({ id: track.id, addedAt: Date.now(), track });
  return true;
}

export async function listFavorites(): Promise<Track[]> {
  const rows = await getDb().favorites.orderBy("addedAt").reverse().toArray();
  return rows.map((row) => row.track);
}

export async function favoriteIds(): Promise<Set<string>> {
  const ids = await getDb().favorites.toCollection().primaryKeys();
  return new Set(ids as string[]);
}
