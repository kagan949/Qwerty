"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Download, Share, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUiStore } from "@/store/ui-store";
import { useI18n } from "@/i18n/provider";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

/** `appinstalled` / display-mode changes are the only updates this needs. */
const installListeners = new Set<() => void>();
function subscribeInstallState(listener: () => void) {
  installListeners.add(listener);
  window.addEventListener("appinstalled", listener);
  return () => {
    installListeners.delete(listener);
    window.removeEventListener("appinstalled", listener);
  };
}
const SERVER_ENV = { ios: false, standalone: false };
let cachedEnv: { ios: boolean; standalone: boolean } | null = null;
function getEnvSnapshot() {
  if (!cachedEnv) {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    cachedEnv = { ios: /iphone|ipad|ipod/i.test(navigator.userAgent), standalone };
  }
  return cachedEnv;
}
function getServerEnvSnapshot() {
  return SERVER_ENV;
}

/**
 * iOS and "already installed" detection, read as an external store so the
 * server renders a neutral shell and hydration never mismatches.
 */
function useDeviceEnvironment() {
  return useSyncExternalStore(subscribeInstallState, getEnvSnapshot, getServerEnvSnapshot);
}

export function InstallPrompt() {
  const { t } = useI18n();
  const visible = useUiStore((state) => state.installPromptVisible);
  const setVisible = useUiStore((state) => state.setInstallPromptVisible);
  const [canNativeInstall, setCanNativeInstall] = useState(false);
  const { ios: isIos, standalone: installed } = useDeviceEnvironment();

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      deferredPrompt = event as BeforeInstallPromptEvent;
      setCanNativeInstall(true);
    };
    const onInstalled = () => {
      setVisible(false);
      deferredPrompt = null;
      setCanNativeInstall(false);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [setVisible]);

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") setVisible(false);
    deferredPrompt = null;
    setCanNativeInstall(false);
  };

  if (installed) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-1/2 z-[75] w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 md:bottom-28"
        >
          <div className="glass-strong relative rounded-2xl p-4 shadow-2xl">
            <button
              type="button"
              onClick={() => setVisible(false)}
              aria-label={t("common.close")}
              className="absolute right-2.5 top-2.5 rounded-full p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
            <div className="flex items-start gap-3 pr-6">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                <Download className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="font-display text-sm font-semibold">{t("pwa.installTitle")}</p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">{t("pwa.installHint")}</p>
              </div>
            </div>
            {isIos && !canNativeInstall ? (
              <p className="mt-3 flex items-start gap-2 rounded-xl bg-white/5 p-3 text-[11.5px] leading-relaxed text-muted-foreground">
                <Share className="mt-0.5 size-3.5 shrink-0" />
                {t("pwa.iosHint")}
              </p>
            ) : (
              <div className="mt-3 flex gap-2">
                <Button variant="gradient" size="sm" className="flex-1" onClick={install} disabled={!canNativeInstall}>
                  {t("pwa.installButton")}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setVisible(false)}>
                  {t("pwa.later")}
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
