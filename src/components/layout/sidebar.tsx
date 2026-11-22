"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Download, Plus, X } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { PRIMARY_NAV, SECONDARY_NAV } from "@/components/layout/nav-items";
import { useI18n } from "@/i18n/provider";
import { useUiStore } from "@/store/ui-store";
import { useLibraryStore } from "@/store/library-store";
import { useLocalPlaylistCover } from "@/hooks/use-playlist-cover";
import { CoverImage } from "@/components/music/artwork";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Playlist } from "@/types";

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const playlists = useLibraryStore((state) => state.playlists);
  const openCreate = useUiStore((state) => state.setCreatePlaylistOpen);

  return (
    <aside className="sticky top-0 hidden h-dvh w-[268px] shrink-0 flex-col gap-3 p-3 lg:flex xl:w-[288px]">
      <div className="flex h-14 items-center px-3">
        <Brand />
      </div>

      <nav className="rounded-2xl border border-white/6 bg-surface p-2" aria-label="Primary">
        {PRIMARY_NAV.map((item) => (
          <SidebarLink key={item.href} href={item.href} label={t(item.labelKey)} icon={item.icon} active={isActive(pathname, item.href)} />
        ))}
      </nav>

      <nav className="rounded-2xl border border-white/6 bg-surface p-2" aria-label="Library">
        <p className="px-3 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
          {t("nav.library")}
        </p>
        {SECONDARY_NAV.map((item) => (
          <SidebarLink key={item.href} href={item.href} label={t(item.labelKey)} icon={item.icon} active={isActive(pathname, item.href)} />
        ))}
      </nav>

      <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-white/6 bg-surface p-2">
        <div className="flex items-center justify-between px-2 pb-1 pt-1.5">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
            {t("nav.playlists")}
          </span>
          <button
            type="button"
            onClick={() => openCreate(true)}
            aria-label={t("playlist.create")}
            className="grid size-6 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
          >
            <Plus className="size-3.5" />
          </button>
        </div>
        <div className="scrollbar-slim min-h-0 flex-1 space-y-0.5 overflow-y-auto pt-1">
          {playlists.length === 0 ? (
            <button
              type="button"
              onClick={() => openCreate(true)}
              className="w-full rounded-xl border border-dashed border-white/10 px-3 py-4 text-left text-[12px] leading-relaxed text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <span className="block font-medium text-foreground/90">{t("library.playlistsEmpty")}</span>
              <span className="mt-1 block text-[11.5px]">{t("library.playlistsEmptyHint")}</span>
            </button>
          ) : (
            playlists.slice(0, 12).map((playlist) => (
              <SidebarPlaylist key={playlist.id} playlist={playlist} active={pathname === `/playlists/${playlist.id}`} />
            ))
          )}
        </div>
        <div className="mt-2 border-t border-white/6 pt-2">
          <InstallAppButton />
        </div>
      </div>
    </aside>
  );
}

function SidebarLink({
  href,
  label,
  icon: Icon,
  active,
  group = "desktop",
}: {
  href: string;
  label: string;
  icon: typeof ChevronRight;
  active: boolean;
  /**
   * The desktop sidebar and the mobile drawer are mounted at the same time, so
   * a shared `layoutId` would animate the highlight between them. Scoping the
   * id per instance keeps each animation local.
   */
  group?: "desktop" | "mobile";
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-[13.5px] font-medium transition-colors",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {active && (
        <motion.span
          layoutId={`sidebar-active-${group}`}
          className="absolute inset-0 rounded-xl bg-white/8 ring-1 ring-inset ring-white/8"
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
        />
      )}
      <Icon className={cn("relative size-[17px] shrink-0", active && "text-primary")} />
      <span className="relative truncate">{label}</span>
    </Link>
  );
}

function SidebarPlaylist({ playlist, active }: { playlist: Playlist; active: boolean }) {
  const { t } = useI18n();
  const cover = useLocalPlaylistCover(playlist);
  return (
    <Link
      href={`/playlists/${playlist.id}`}
      className={cn(
        "flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors",
        active ? "bg-white/8" : "hover:bg-white/5",
      )}
    >
      <CoverImage src={cover} seed={playlist.id} rounded="rounded-md" className="size-8 shrink-0" alt="" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12.5px] font-medium">{playlist.name}</span>
        <span className="block truncate text-[11px] text-muted-foreground">
          {playlist.tracks.length} {t("common.tracks").toLowerCase()}
        </span>
      </span>
    </Link>
  );
}

function InstallAppButton() {
  const { t } = useI18n();
  const showInstall = useUiStore((state) => state.setInstallPromptVisible);
  return (
    <button
      type="button"
      onClick={() => showInstall(true)}
      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[12.5px] font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
    >
      <Download className="size-4" />
      {t("nav.installApp")}
    </button>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileSidebar() {
  const open = useUiStore((state) => state.sidebarOpen);
  const setOpen = useUiStore((state) => state.setSidebarOpen);
  const playlists = useLibraryStore((state) => state.playlists);
  const pathname = usePathname();
  const { t } = useI18n();

  useEffect(() => {
    if (open) setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] lg:hidden">
      <button
        type="button"
        aria-label={t("nav.close")}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <motion.aside
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 36 }}
        className="relative flex h-full w-[82vw] max-w-[320px] flex-col gap-3 border-r border-white/8 bg-surface p-3"
      >
        <div className="flex h-12 items-center justify-between px-1">
          <Brand />
          <Button variant="ghost" size="icon-sm" onClick={() => setOpen(false)} aria-label={t("nav.close")}>
            <X className="size-4" />
          </Button>
        </div>
        <nav className="space-y-0.5 rounded-2xl border border-white/6 bg-surface p-2">
          {PRIMARY_NAV.map((item) => (
            <SidebarLink
              key={item.href}
              href={item.href}
              label={t(item.labelKey)}
              icon={item.icon}
              active={isActive(pathname, item.href)}
              group="mobile"
            />
          ))}
          <div className="my-1.5 border-t border-white/6" />
          <p className="px-3 pb-1 pt-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
            {t("nav.library")}
          </p>
          {SECONDARY_NAV.map((item) => (
            <SidebarLink
              key={item.href}
              href={item.href}
              label={t(item.labelKey)}
              icon={item.icon}
              active={isActive(pathname, item.href)}
              group="mobile"
            />
          ))}
        </nav>

        {playlists.length > 0 && (
          <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/6 bg-surface p-2">
            <p className="px-3 pb-1 pt-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
              {t("nav.playlists")}
            </p>
            <div className="scrollbar-slim max-h-full space-y-0.5 overflow-y-auto">
              {playlists.slice(0, 20).map((playlist) => (
                <SidebarPlaylist key={playlist.id} playlist={playlist} active={pathname === `/playlists/${playlist.id}`} />
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto rounded-2xl border border-white/6 bg-surface p-2">
          <InstallAppButton />
        </div>
      </motion.aside>
    </div>
  );
}
