"use client";

import { useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useI18n } from "@/i18n/provider";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/store/ui-store";
import { getAudioEngine } from "@/lib/audio-engine";

/**
 * Owns PWA behaviours that don't belong to a single component:
 *  - service-worker update prompts
 *  - "add to home screen" nudge (once per session, only when installable)
 *  - pausing the audio context when the tab is hidden for a long time
 */
export function PwaLifecycle() {
  const { t } = useI18n();
  const setInstallVisible = useUiStore((state) => state.setInstallPromptVisible);
  const [updateWorker, setUpdateWorker] = useState<ServiceWorker | null>(null);
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    const evaluate = async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return;
      if (registration.waiting && navigator.serviceWorker.controller) {
        setUpdateWorker(registration.waiting);
        setShowUpdate(true);
      }
    };
    void evaluate();
    const interval = setInterval(() => void evaluate(), 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;
    if (sessionStorage.getItem("vybe:install-nudge") === "1") return;
    const timeout = setTimeout(() => {
      sessionStorage.setItem("vybe:install-nudge", "1");
      setInstallVisible(true);
    }, 45_000);
    return () => clearTimeout(timeout);
  }, [setInstallVisible]);

  useEffect(() => {
    const engine = getAudioEngine();
    let hiddenAt = 0;
    const onVisibility = () => {
      if (document.hidden) {
        hiddenAt = Date.now();
      } else if (hiddenAt && Date.now() - hiddenAt > 5 * 60 * 1000) {
        // Long suspension: recreate the audio graph on the next play.
        engine.suspendContext();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const applyUpdate = () => {
    if (!updateWorker) {
      window.location.reload();
      return;
    }
    sessionStorage.setItem("vybe:sw-reload", "1");
    updateWorker.postMessage({ type: "SKIP_WAITING" });
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      () => window.location.reload(),
      { once: true },
    );
  };

  return (
    <AnimatePresence>
      {showUpdate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          className="fixed left-1/2 top-[max(1rem,env(safe-area-inset-top))] z-[110] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2"
        >
          <div className="glass-strong flex items-center gap-3 rounded-2xl p-3 shadow-2xl">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
              <RefreshCw className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-semibold">{t("pwa.updateTitle")}</p>
              <p className="truncate text-[11px] text-muted-foreground">{t("pwa.updateHint")}</p>
            </div>
            <Button size="sm" variant="gradient" onClick={applyUpdate}>
              {t("pwa.updateButton")}
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label={t("common.close")}
              onClick={() => setShowUpdate(false)}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
