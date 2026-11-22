"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Camera, GripVertical, MoreHorizontal, Pencil, Play, Plus, Shuffle, Trash2, X } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { useLibraryStore } from "@/store/library-store";
import { usePlayer } from "@/components/providers/player-provider";
import { usePlayerStore } from "@/store/player-store";
import { useUiStore } from "@/store/ui-store";
import { TrackRow } from "@/components/music/track-row";
import { CoverImage } from "@/components/music/artwork";
import { useLocalPlaylistCover } from "@/hooks/use-playlist-cover";
import { TrackRowSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  deletePlaylist,
  removeTrackFromPlaylist,
  reorderPlaylistTrack,
  updatePlaylist,
} from "@/database/playlists";
import { formatDurationLong } from "@/lib/utils";
import { toast } from "@/lib/toast";
import type { Track } from "@/types";

export function PlaylistDetail({ playlistId }: { playlistId: string }) {
  const { t, intlLocale } = useI18n();
  const router = useRouter();
  const { playCollection, playTrackList } = usePlayer();
  const playlists = useLibraryStore((state) => state.playlists);
  const hydrated = useLibraryStore((state) => state.hydrated);
  const refreshPlaylists = useLibraryStore((state) => state.refreshPlaylists);
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle);
  const setAddToPlaylist = useUiStore((state) => state.openAddToPlaylist);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const playlist = playlists.find((item) => item.id === playlistId);
  const cover = useLocalPlaylistCover(playlist ?? { id: playlistId, coverUrl: undefined });

  // Seed the rename form from the playlist every time the dialog opens, rather
  // than mirroring the store continuously (which fought the user's typing).
  const openEdit = useCallback(() => {
    if (!playlist) return;
    setName(playlist.name);
    setDescription(playlist.description ?? "");
    setEditOpen(true);
  }, [playlist]);

  useEffect(() => {
    if (playlist) document.title = `${playlist.name} · VYBE`;
  }, [playlist]);

  const totalDuration = useMemo(
    () => (playlist?.tracks ?? []).reduce((sum, track) => sum + (track.duration || 0), 0),
    [playlist?.tracks],
  );

  if (!hydrated) {
    return (
      <div className="px-4 pt-6 sm:px-6 lg:px-8">
        <TrackRowSkeleton count={8} />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex flex-col items-center px-4 py-20 text-center">
        <p className="font-display text-lg font-semibold">{t("errors.notFound")}</p>
        <p className="mt-1 text-[12.5px] text-muted-foreground">{t("errors.notFoundHint")}</p>
        <Button className="mt-4" variant="secondary" onClick={() => router.push("/playlists")}>
          {t("nav.playlists")}
        </Button>
      </div>
    );
  }

  const handleCover = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      toast.error(t("playlist.coverTooLarge"));
      return;
    }
    await updatePlaylist(playlist.id, { cover: file, coverUrl: undefined });
    await refreshPlaylists();
    toast.success(t("playlist.coverUpdated"));
  };

  const handleRemoveTrack = async (track: Track) => {
    await removeTrackFromPlaylist(playlist.id, track.id);
    await refreshPlaylists();
    toast.success(t("playlist.trackRemoved"));
  };

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[380px] overflow-hidden opacity-50">
        <div className="absolute inset-0 blur-[110px]">
          <CoverImage src={cover} seed={playlist.id} className="size-full" rounded="rounded-none" alt="" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/70 to-background" />
      </div>

      <div className="relative px-4 pt-4 sm:px-6 lg:px-8">
        <Button variant="ghost" size="icon-sm" onClick={() => router.push("/playlists")} aria-label={t("common.cancel")}>
          <ArrowLeft className="size-4" />
        </Button>

        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end"
        >
          <div className="group relative size-[168px] shrink-0 sm:size-[196px]">
            <CoverImage
              src={cover}
              seed={playlist.id}
              className="size-full shadow-[0_30px_80px_-40px_rgb(0_0_0/0.95)]"
              rounded="rounded-2xl"
              alt={playlist.name}
            />
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="absolute inset-0 grid place-items-center rounded-2xl bg-black/55 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              aria-label={t("playlist.changeCover")}
            >
              <Camera className="size-6 text-white" />
            </button>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => void handleCover(event.target.files?.[0])}
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {t("playlist.yourPlaylist")}
            </p>
            <h1 className="mt-1 font-display text-[28px] font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-[40px]">
              {playlist.name}
            </h1>
            {playlist.description && (
              <p className="mt-2 max-w-2xl text-[12.5px] leading-relaxed text-muted-foreground">{playlist.description}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
              <span>
                {playlist.tracks.length} {t("common.songs")}
              </span>
              {totalDuration > 0 && (
                <>
                  <span className="size-1 rounded-full bg-muted-foreground/50" />
                  <span>{formatDurationLong(totalDuration, intlLocale.slice(0, 2))}</span>
                </>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                variant="gradient"
                size="lg"
                disabled={playlist.tracks.length === 0}
                onClick={() => void playCollection(playlist.tracks, `playlist:${playlist.id}`)}
              >
                <Play className="size-4 fill-current" /> {t("playlist.playPlaylist")}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                disabled={playlist.tracks.length === 0}
                onClick={() => {
                  toggleShuffle();
                  void playTrackList([...playlist.tracks].sort(() => Math.random() - 0.5), 0, `playlist:${playlist.id}`);
                }}
              >
                <Shuffle className="size-4" /> {t("library.shufflePlay")}
              </Button>
              <Button variant="ghost" size="lg" onClick={() => setAddToPlaylist(null)} disabled>
                <Plus className="size-4" /> {t("playlist.addTracks")}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-lg" aria-label={t("common.more")}>
                    <MoreHorizontal className="size-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={openEdit}>
                    <Pencil /> {t("common.edit")}
                  </DropdownMenuItem>
                  {playlist.coverBlob && (
                    <DropdownMenuItem
                      onClick={async () => {
                        await updatePlaylist(playlist.id, { cover: undefined });
                        await refreshPlaylists();
                        toast.success(t("playlist.coverUpdated"));
                      }}
                    >
                      <X /> {t("playlist.removeCover")}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    destructive
                    onClick={async () => {
                      if (!window.confirm(t("playlist.deleteConfirm"))) return;
                      await deletePlaylist(playlist.id);
                      await refreshPlaylists();
                      toast.success(t("playlist.deleteSuccess"));
                      router.push("/playlists");
                    }}
                  >
                    <Trash2 /> {t("common.delete")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </motion.header>

        <div className="mt-8 pb-6">
          {playlist.tracks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
              <p className="font-display text-[15px] font-semibold">{t("playlist.emptyTitle")}</p>
              <p className="mx-auto mt-1 max-w-sm text-[12px] text-muted-foreground">{t("playlist.emptyHint")}</p>
              <Button className="mt-3" size="sm" variant="secondary" onClick={() => router.push("/search")}>
                {t("nav.search")}
              </Button>
            </div>
          ) : (
            <div className="space-y-0.5">
              <p className="mb-2 hidden items-center gap-1 text-[10.5px] uppercase tracking-wider text-muted-foreground sm:flex">
                <GripVertical className="size-3" /> {t("playlist.dragToReorder")}
              </p>
              {playlist.tracks.map((track, index) => (
                <div
                  key={track.id}
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={async () => {
                    if (dragIndex === null || dragIndex === index) return;
                    await reorderPlaylistTrack(playlist.id, dragIndex, index);
                    await refreshPlaylists();
                    setDragIndex(null);
                  }}
                  className="group/row flex items-center gap-1 rounded-xl transition-colors"
                >
                  <GripVertical className="size-3.5 shrink-0 cursor-grab text-muted-foreground/30 opacity-0 transition-opacity group-hover/row:opacity-100" />
                  <div className="min-w-0 flex-1">
                    <TrackRow
                      track={track}
                      index={index}
                      onPlay={() => void playTrackList(playlist.tracks, index, `playlist:${playlist.id}`)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleRemoveTrack(track)}
                    aria-label={t("playlist.removeTrack")}
                    className="mr-1 rounded-full p-2 text-muted-foreground opacity-0 transition-all hover:bg-red-500/12 hover:text-red-400 group-hover/row:opacity-100"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("playlist.editTitle")}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              if (!name.trim()) {
                toast.error(t("playlist.nameRequired"));
                return;
              }
              await updatePlaylist(playlist.id, { name: name.trim(), description: description.trim() || undefined });
              await refreshPlaylists();
              toast.success(t("playlist.editSuccess"));
              setEditOpen(false);
            }}
            className="mt-4 space-y-3"
          >
            <label className="block">
              <span className="mb-1 block text-[11.5px] font-medium text-muted-foreground">{t("playlist.name")}</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-[13px] outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/25"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11.5px] font-medium text-muted-foreground">{t("playlist.description")}</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-[13px] outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/25"
              />
            </label>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEditOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" variant="gradient">
                {t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
