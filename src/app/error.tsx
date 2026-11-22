"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[VYBE] route error:", error.message, error.digest ?? "");
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-red-500/10 text-red-400">
        <AlertTriangle className="size-6" />
      </span>
      <h1 className="mt-4 font-display text-xl font-bold tracking-tight">Something went wrong</h1>
      <p className="mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-muted-foreground">
        The player crashed. Reload the page to restore playback — your library is safe.
      </p>
      <div className="mt-4 flex gap-2">
        <Button variant="gradient" onClick={reset}>
          <RotateCcw className="size-4" /> Try again
        </Button>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Home
        </Button>
      </div>
    </div>
  );
}
