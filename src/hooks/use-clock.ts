"use client";

import { useSyncExternalStore } from "react";

/**
 * Current wall-clock time, read through an external-store snapshot.
 *
 * Reading `Date.now()` inside a component body is impure (React 19's lint rule
 * flags it, and it desynchronises SSR from hydration). Subscribing to a ticking
 * external source instead is the sanctioned pattern: the snapshot is stable
 * within each tick and the server snapshot is `null`, so nothing is rendered
 * until the client mounts.
 */
function makeClock(granularityMs: number) {
  const subscribe = (onChange: () => void) => {
    const id = setInterval(onChange, granularityMs);
    return () => clearInterval(id);
  };
  const getSnapshot = () => Math.floor(Date.now() / granularityMs) * granularityMs;
  const getServerSnapshot = () => null;
  return function useClock(): number | null {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  };
}

/** Updates once per second — countdowns and "played 2 hours ago" labels. */
export const useClockSecond = makeClock(1000);
/** Updates once per minute — greetings and dates. */
export const useClockMinute = makeClock(60_000);
