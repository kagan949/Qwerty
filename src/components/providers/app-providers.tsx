"use client";

import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { QueryProvider } from "@/components/providers/query-provider";
import { I18nProvider } from "@/i18n/provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PlayerProvider } from "@/components/providers/player-provider";
import { useSettingsStore } from "@/store/settings-store";
import { useUiStore } from "@/store/ui-store";
import { useLibraryStore } from "@/store/library-store";
import { useI18n } from "@/i18n/provider";
import { useServiceWorker } from "@/hooks/use-service-worker";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { PwaLifecycle } from "@/components/providers/pwa-lifecycle";
import { GlobalModals } from "@/components/layout/global-modals";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <I18nProvider>
        <ThemeProvider>
          <TooltipProvider delayDuration={350} skipDelayDuration={200}>
            <PlayerProvider>
              <AppRuntime />
              {children}
              <GlobalModals />
              <ThemedToaster />
            </PlayerProvider>
          </TooltipProvider>
        </ThemeProvider>
      </I18nProvider>
    </QueryProvider>
  );
}

/** Side-effect-only component: SW registration, online state, hydration. */
function AppRuntime() {
  const refreshAll = useLibraryStore((state) => state.refreshAll);
  const setOnline = useUiStore((state) => state.setOnline);
  const setNotifications = useSettingsStore((state) => state.notifications);

  useServiceWorker();
  useKeyboardShortcuts();

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    setOnline(navigator.onLine);
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setOnline]);

  void setNotifications;

  return <PwaLifecycle />;
}

function ThemedToaster() {
  const { locale } = useI18n();
  const notifications = useSettingsStore((state) => state.notifications);
  const theme = useSettingsStore((state) => state.theme);
  return (
    <Toaster
      key={`${locale}-${theme}`}
      position="top-center"
      gutter={8}
      toastOptions={{
        duration: notifications ? 2600 : 1600,
        className: "vybe-toast",
      }}
      containerClassName="vybe-toaster"
    />
  );
}
