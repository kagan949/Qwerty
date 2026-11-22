"use client";

import { ListMusic, Plus } from "lucide-react";
import { useUiStore } from "@/store/ui-store";
import { useLibraryStore } from "@/store/library-store";
import { useI18n } from "@/i18n/provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CoverImage } from "@/components/music/artwork";
import { useLocalPlaylistCover } from "@/hooks/use-playlist-cover";
import { addTracksToPlaylist } from "@/database/playlists";
import { toast } from "@/lib/toast";
import type { Playlist } from "@/types";

export function AddToPlaylistDialog() {
  const { t } = useI18n();
  const track = useUiStore((state) => state.addToPlaylistTrack);
  const setTrack = useUiStore((state) => state.openAddToPlaylist);
  const setCreateOpen = useUiStore((state) => state.setCreatePlaylistOpen);
  const playlists = useLibraryStore((state) => state.playlists);
  const refreshPlaylists = useLibraryStore((state) => state.refreshPlaylists);

  return (
    <Dialog open={Boolean(track)} onOpenChange={(open) => !open && setTrack(null)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("library.addToPlaylist")}</DialogTitle>
          <DialogDescription className="truncate">
            {track ? `${track.title} — ${track.artist}` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="scrollbar-slim mt-4 max-h-[46vh] space-y-1 overflow-y-auto">
          {playlists.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-5 text-center">
              <p className="text-[13px] font-medium">{t("library.noPlaylistsYet")}</p>
              <p className="mt-1 text-[11.5px] text-muted-foreground">{t("library.createPlaylistFirst")}</p>
            </div>
          ) : (
            playlists.map((playlist) => (
              <PlaylistOption
                key={playlist.id}
                playlist={playlist}
                onPick={async () => {
                  if (!track) return;
                  try {
                    const added = await addTracksToPlaylist(playlist.id, [track]);
                    await refreshPlaylists();
                    if (added === 0) toast(t("library.alreadyInPlaylist"));
                    else toast.success(t("library.addedToPlaylist"));
                    setTrack(null);
                  } catch {
                    toast.error(t("toast.saveFailed"));
                  }
                }}
              />
            ))
          )}
        </div>
        <Button
          variant="secondary"
          className="mt-3 w-full justify-start"
          onClick={() => {
            setTrack(null);
            setCreateOpen(true);
          }}
        >
          <Plus className="size-4" /> {t("playlist.create")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function PlaylistOption({ playlist, onPick }: { playlist: Playlist; onPick: () => void }) {
  const cover = useLocalPlaylistCover(playlist);
  return (
    <button
      type="button"
      onClick={onPick}
      className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-white/8"
    >
      {cover ? (
        <CoverImage src={cover} seed={playlist.id} rounded="rounded-lg" className="size-10 shrink-0" alt="" />
      ) : (
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white/8 text-muted-foreground">
          <ListMusic className="size-4" />
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-medium">{playlist.name}</span>
        <span className="block text-[11px] text-muted-foreground">{playlist.tracks.length} tracks</span>
      </span>
    </button>
  );
}
