import { getDb } from "@/database/db";
import { STORAGE_KEYS } from "@/lib/constants";

/**
 * Settings live in LocalStorage (synchronous hydration for the UI) and are
 * mirrored into IndexedDB so they are included in backups.
 */
export function readLocalSettings<T>(fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.settings);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) } as T;
  } catch {
    return fallback;
  }
}

export function writeLocalSettings(value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(value));
  } catch {
    // Storage may be unavailable; IndexedDB mirror still applies.
  }
  void (async () => {
    try {
      const database = getDb();
      await database.settings.put({ key: "app-settings", value, updatedAt: Date.now() });
    } catch {
      // ignore
    }
  })();
}

export async function resetStoredSettings() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEYS.settings);
  try {
    await getDb().settings.delete("app-settings");
  } catch {
    // ignore
  }
}
