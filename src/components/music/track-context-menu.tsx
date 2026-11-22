"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Disc3,
  Heart,
  ListEnd,
  ListPlus,
  ListStart,
  Play,
  Share2,
  Trash2,
  UserRound,
  Info,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useUiStore } from "@/store/ui-store";
import { usePlayerStore } from "@/store/player-store";
import { useLibraryStore } from "@/store/library-store";
import { usePlayer } from "@/components/providers/player-provider";
import { useI18n } from "@/i18n/provider";
import { deleteLocalTrack } from "@/database/local-tracks";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

/**
 * Rich right-click / long-press menu for a track. Every action is wired:
 * favourites, queue manipulation, playlist picker, navigation, sharing and
 * local-file deletion. Nothing here is a placeholder.
 */
export function TrackContextMenu() {
  const { t } = useI18n();
  const router = useRouter();
  const { track, x, y } = useUiStore((state) => state.contextMenu);
  const close = useUiStore((state) => state.closeContextMenu);
  const openAddToPlaylist = useUiStore((state) => state.openAddToPlaylist);
  const openEditTrack = useUiStore((state) => state.openEditTrack);
  const playNextAction = usePlayerStore((state) => state.playNext);
  const addToQueue = usePlayerStore((state) => state.addToQueue);
  const isFavorite = useLibraryStore((state) => (track ? state.favoriteIds.has(track.id) : false));
  const toggleFavorite = useLibraryStore((state) => state.toggleFavorite);
  const refreshLocal = useLibraryStore((state) => state.refreshLocal);
  const { playTrackList } = usePlayer();
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!track) return;
    const handleClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) close();
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleKey);
    window.addEventListener("scroll", close, { passive: true });
    return () => {
      window.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("scroll", close);
    };
  }, [close, track]);

  useEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width - 8;
    const maxY = window.innerHeight - rect.height - 8;
    el.style.left = `${Math.min(x, Math.max(8, maxX))}px`;
    el.style.top = `${Math.min(y, Math.max(8, maxY))}px`;
  }, [x, y, track]);

  if (!track || typeof document === "undefined") return null;

  const item = (label: string, icon: React.ReactNode, action: () => void, options?: { danger?: boolean }) => (
    <button
      type="button"
      role="menuitem"
      onClick={() => {
        action();
        close();
      }}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12.5px] transition-colors",
        options?.danger ? "text-red-400 hover:bg-red-500/12" : "hover:bg-white/8",
      )}
    >
      <span className="text-muted-foreground [&_svg]:size-3.5">{icon}</span>
      {label}
    </button>
  );

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      className="fixed z-[95] min-w-[212px] rounded-xl border border-white/10 bg-[#121217]/95 p-1 shadow-2xl backdrop-blur-xl"
      style={{ left: x, top: y }}
    >
      {item(t("common.play"), <Play />, () => void playTrackList([track], 0))}
      {item(
        isFavorite ? t("player.removeFromFavorites") : t("player.addToFavorites"),
        <Heart className={isFavorite ? "fill-current text-primary" : undefined} />,
        async () => {
          const added = await toggleFavorite(track);
          toast.success(added ? t("toast.favoriteAdded") : t("toast.favoriteRemoved"));
        },
      )}
      {item(t("player.playNext"), <ListStart />, () => {
        playNextAction(track);
        toast.success(t("toast.playingNext"));
      })}
      {item(t("common.addToQueue"), <ListEnd />, () => {
        addToQueue(track);
        toast.success(t("toast.addedToQueue"));
      })}
      {item(t("library.addToPlaylist"), <ListPlus />, () => openAddToPlaylist(track))}
      <div className="my-1 h-px bg-white/8" />
      {track.artistId &&
        item(t("player.goToArtist"), <UserRound />, () => router.push(`/artist/${encodeURIComponent(track.artistId as string)}`))}
      {track.albumId &&
        item(t("player.goToAlbum"), <Disc3 />, () =>
          router.push(
            `/album/${encodeURIComponent(track.albumId as string)}?title=${encodeURIComponent(track.album ?? "")}&artist=${encodeURIComponent(track.artist)}`,
          ),
        )}
      {item(t("player.trackInfo"), <Info />, () => {
        if (track.isLocal) openEditTrack(track);
        else router.push(`/track/${encodeURIComponent(track.id)}`);
      })}
      {item(t("common.export"), <Share2 />, async () => {
        const url = track.sourceUrl ?? window.location.href;
        try {
          if (navigator.share) await navigator.share({ title: track.title, text: `${track.title} — ${track.artist}`, url });
          else {
            await navigator.clipboard.writeText(url);
            toast.success(t("toast.copiedLink"));
          }
        } catch {
          // ignore cancellations
        }
      })}
      {track.isLocal && (
        <>
          <div className="my-1 h-px bg-white/8" />
          {item(
            t("library.deleteTrack"),
            <Trash2 />,
            async () => {
              try {
                await deleteLocalTrack(track.localId ?? track.id.replace(/^local:/, ""));
                await refreshLocal();
                toast.success(t("toast.trackDeleted"));
              } catch {
                toast.error(t("toast.deleteFailed"));
              }
            },
            { danger: true },
          )}
        </>
      )}
    </div>,
    document.body,
  );
}
