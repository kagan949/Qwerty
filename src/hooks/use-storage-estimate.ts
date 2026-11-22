"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

export interface StorageEstimate {
  usage: number;
  quota: number;
  percent: number;
  supported: boolean;
  persisted: boolean;
}

const EMPTY: StorageEstimate = {
  usage: 0,
  quota: 0,
  percent: 0,
  supported: false,
  persisted: false,
};

/**
 * Storage quota, cached in a module-level store so several meters can mount
 * without each firing its own `navigator.storage.estimate()` call.
 *
 * The browser has no event for quota changes, so `refresh()` (and the
 * `refreshKey` argument) is how callers invalidate it — typically after an
 * upload or a delete.
 */
let snapshot: StorageEstimate = EMPTY;
let inFlight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot() {
  return EMPTY;
}

async function readEstimate() {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) return;
  try {
    const { usage = 0, quota = 0 } = await navigator.storage.estimate();
    const persisted = navigator.storage.persisted ? await navigator.storage.persisted() : false;
    snapshot = {
      usage,
      quota,
      percent: quota > 0 ? Math.min(100, (usage / quota) * 100) : 0,
      supported: true,
      persisted,
    };
  } catch {
    snapshot = { ...snapshot, supported: false };
  }
  emit();
}

/** Re-read the quota now (module-level, safe to call from anywhere). */
export async function refreshStorageEstimate() {
  if (inFlight) return inFlight;
  inFlight = readEstimate().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

// Warm the cache on first client import; the promise is intentionally floating.
if (typeof window !== "undefined") {
  void refreshStorageEstimate();
}

export function useStorageEstimate(refreshKey?: unknown) {
  const estimate = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // A changing key (e.g. library length) re-reads the quota. Nothing is set
  // synchronously — the store emits once the browser answers.
  useEffect(() => {
    void refreshStorageEstimate();
  }, [refreshKey]);

  const requestPersistence = useCallback(async () => {
    if (!navigator.storage?.persist) return false;
    try {
      const persisted = await navigator.storage.persist();
      await refreshStorageEstimate();
      return persisted;
    } catch {
      return false;
    }
  }, []);

  return { estimate, refresh: refreshStorageEstimate, requestPersistence };
}
