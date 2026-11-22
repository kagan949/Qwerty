"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePlayerStore } from "@/store/player-store";

/**
 * /player deep link. The full player is mounted globally; this route simply
 * opens it and returns the user to the previous screen when dismissed.
 */
export default function PlayerPage() {
  const router = useRouter();
  useEffect(() => {
    const state = usePlayerStore.getState();
    if (state.queue.length === 0) {
      router.replace("/");
      return;
    }
    state.setFullScreen(true);
    router.replace("/");
  }, [router]);
  return null;
}
