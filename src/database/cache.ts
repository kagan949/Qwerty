import { getDb } from "@/database/db";

const DEFAULT_TTL = 5 * 60 * 1000;

export async function readCache<T>(key: string): Promise<T | null> {
  try {
    const row = await getDb().cache.get(key);
    if (!row) return null;
    if (row.expiresAt < Date.now()) return null;
    return row.value as T;
  } catch {
    return null;
  }
}

export async function readStaleCache<T>(key: string): Promise<T | null> {
  try {
    const row = await getDb().cache.get(key);
    return row ? (row.value as T) : null;
  } catch {
    return null;
  }
}

export async function writeCache(key: string, value: unknown, ttl = DEFAULT_TTL): Promise<void> {
  try {
    const now = Date.now();
    await getDb().cache.put({ key, value, updatedAt: now, expiresAt: now + ttl });
  } catch {
    // Cache is best effort (e.g. private mode / quota).
  }
}

export async function pruneCache(): Promise<void> {
  const now = Date.now();
  await getDb().cache.where("expiresAt").below(now).delete();
}
