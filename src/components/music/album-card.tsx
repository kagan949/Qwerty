"use client";

import Link from "next/link";
import { CoverImage } from "@/components/music/artwork";
import { cn } from "@/lib/utils";
import type { Album } from "@/types";

export function AlbumCard({ album, className }: { album: Album; className?: string }) {
  const params = new URLSearchParams({ id: album.id, title: album.title, artist: album.artist });
  return (
    <Link
      href={`/album/${encodeURIComponent(album.id)}?${params.toString()}`}
      className={cn("group flex flex-col rounded-2xl p-2 transition-colors hover:bg-white/5", className)}
    >
      <CoverImage
        src={album.artwork}
        seed={`${album.artist}-${album.title}`}
        className="aspect-square w-full shadow-[0_18px_40px_-24px_rgb(0_0_0/0.9)] transition-transform duration-300 group-hover:scale-[1.02]"
        alt={album.title}
      />
      <p className="mt-3 truncate text-[13.5px] font-semibold">{album.title}</p>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">{album.artist}</p>
    </Link>
  );
}
