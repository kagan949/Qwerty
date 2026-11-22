"use client";

import Link from "next/link";
import { CoverImage } from "@/components/music/artwork";
import { cn } from "@/lib/utils";
import type { Artist } from "@/types";

export function ArtistCard({ artist, className }: { artist: Artist; className?: string }) {
  const href = artist.id.startsWith("jamendo-artist:")
    ? `/artist/${encodeURIComponent(artist.id)}`
    : `/search?q=${encodeURIComponent(artist.name)}`;
  return (
    <Link
      href={href}
      className={cn("group flex flex-col items-center rounded-2xl p-2 text-center transition-colors hover:bg-white/5", className)}
    >
      <CoverImage
        src={artist.image}
        seed={artist.name}
        rounded="rounded-full"
        className="aspect-square w-full shadow-[0_18px_40px_-24px_rgb(0_0_0/0.9)] ring-1 ring-white/8 transition-transform duration-300 group-hover:scale-[1.03]"
        alt={artist.name}
      />
      <p className="mt-3 w-full truncate text-[13.5px] font-semibold">{artist.name}</p>
      <p className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">Artist</p>
    </Link>
  );
}
