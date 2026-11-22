"use client";

import Link from "next/link";
import { CoverImage } from "@/components/music/artwork";
import { useLocalPlaylistCover } from "@/hooks/use-playlist-cover";
import { ListMusic } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import type { Playlist } from "@/types";

export function PlaylistCard({ playlist, className }: { playlist: Playlist; className?: string }) {
  const { t } = useI18n();
  const cover = useLocalPlaylistCover(playlist);
  return (
    <Link
      href={`/playlists/${playlist.id}`}
      className={cn("group flex flex-col rounded-2xl p-2 transition-colors hover:bg-white/5", className)}
    >
      <div className="relative">
        <CoverImage
          src={cover}
          seed={`${playlist.name}-${playlist.id}`}
          className="aspect-square w-full shadow-[0_18px_40px_-24px_rgb(0_0_0/0.9)]"
          alt={playlist.name}
        />
        <div className="absolute bottom-2 right-2 grid size-9 place-items-center rounded-full bg-primary text-white opacity-0 shadow-lg transition-all group-hover:opacity-100">
          <ListMusic className="size-4" />
        </div>
      </div>
      <p className="mt-3 truncate text-[13.5px] font-semibold">{playlist.name}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {playlist.tracks.length} {t("common.songs")}
      </p>
    </Link>
  );
}
