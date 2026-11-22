"use client";

import { usePathname } from "next/navigation";
import { Sidebar, MobileSidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { TopBar } from "@/components/layout/top-bar";
import { MiniPlayer } from "@/components/player/mini-player";
import { FullScreenPlayer } from "@/components/player/full-screen-player";
import { QueueDrawer } from "@/components/player/queue-drawer";
import { TrackContextMenu } from "@/components/music/track-context-menu";
import { OfflineBanner } from "@/components/layout/offline-banner";
import { InstallPrompt } from "@/components/layout/install-prompt";
import { usePlayerStore } from "@/store/player-store";
import { cn } from "@/lib/utils";

const FULL_SCREEN_ROUTES = ["/player"];
// Home has its own hero and the full-screen player owns the viewport.
const TOP_BAR_HIDDEN = ["/", "/player"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hasQueue = usePlayerStore((state) => state.queue.length > 0);
  const isFullScreenRoute = FULL_SCREEN_ROUTES.includes(pathname);
  const showTopBar = !TOP_BAR_HIDDEN.includes(pathname);

  return (
    <div className="relative flex min-h-dvh flex-col">
      <OfflineBanner />

      <div className="flex flex-1">
        <Sidebar />
        <main
          className={cn(
            "relative flex min-w-0 flex-1 flex-col",
            "pb-[calc(9.5rem+env(safe-area-inset-bottom))] md:pb-[calc(7.5rem+env(safe-area-inset-bottom))]",
            !hasQueue && "pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-6",
          )}
        >
          {showTopBar && <TopBar title={undefined} />}
          {children}
        </main>
      </div>

      {!isFullScreenRoute && <MiniPlayer />}
      <MobileNav />
      <MobileSidebar />
      <FullScreenPlayer />
      <QueueDrawer />
      <TrackContextMenu />
      <InstallPrompt />
    </div>
  );
}
