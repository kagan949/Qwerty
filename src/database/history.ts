import { getDb } from "@/database/db";
import type { PlayEvent, RecentPlay, SearchHistoryEntry, Track } from "@/types";
import { RECENT_PLAYS_LIMIT, SEARCH_HISTORY_LIMIT } from "@/lib/constants";

export async function recordPlay(track: Track, listenedSeconds: number): Promise<void> {
  const database = getDb();
  const now = Date.now();
  await database.transaction("rw", database.recentPlays, database.playEvents, async () => {
    await database.recentPlays.put({
      id: `recent:${track.id}`,
      trackId: track.id,
      track,
      playedAt: now,
    } as RecentPlay & { id: string });
    await database.playEvents.add({
      trackId: track.id,
      title: track.title,
      artist: track.artist,
      source: track.source,
      playedAt: now,
      listenedSeconds: Math.max(1, Math.round(listenedSeconds)),
    });
    const count = await database.recentPlays.count();
    if (count > RECENT_PLAYS_LIMIT) {
      const stale = await database.recentPlays.orderBy("playedAt").reverse().offset(RECENT_PLAYS_LIMIT).toArray();
      await database.recentPlays.bulkDelete(stale.map((row) => row.id));
    }
  });
}

export async function listRecentPlays(limit = 12): Promise<RecentPlay[]> {
  const rows = await getDb().recentPlays.orderBy("playedAt").reverse().limit(limit).toArray();
  return rows.map(({ id, ...rest }) => { void id; return rest; });
}

export async function listPlayEvents(sinceMs: number): Promise<PlayEvent[]> {
  return getDb().playEvents.where("playedAt").aboveOrEqual(sinceMs).toArray();
}

export async function clearRecentPlays(): Promise<void> {
  await getDb().recentPlays.clear();
}

export async function clearPlayEvents(): Promise<void> {
  await getDb().playEvents.clear();
}

export async function addSearchHistory(query: string): Promise<void> {
  const trimmed = query.trim().slice(0, 120);
  if (!trimmed) return;
  const database = getDb();
  const all = await database.searchHistory.orderBy("createdAt").reverse().toArray();
  const duplicate = all.find((row) => row.query.toLowerCase() === trimmed.toLowerCase());
  if (duplicate) await database.searchHistory.delete(duplicate.id);
  await database.searchHistory.put({ id: `q:${trimmed.toLowerCase()}`, query: trimmed, createdAt: Date.now() });
  const rows = await database.searchHistory.orderBy("createdAt").reverse().toArray();
  if (rows.length > SEARCH_HISTORY_LIMIT) {
    await database.searchHistory.bulkDelete(rows.slice(SEARCH_HISTORY_LIMIT).map((row) => row.id));
  }
}

export async function listSearchHistory(): Promise<SearchHistoryEntry[]> {
  const rows = await getDb().searchHistory.orderBy("createdAt").reverse().toArray();
  return rows.map(({ query, createdAt }) => ({ query, createdAt }));
}

export async function clearSearchHistory(): Promise<void> {
  await getDb().searchHistory.clear();
}

export async function removeSearchHistoryEntry(query: string): Promise<void> {
  await getDb().searchHistory.delete(`q:${query.toLowerCase()}`);
}
