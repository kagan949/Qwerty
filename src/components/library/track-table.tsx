"use client";

import { useMemo, useState } from "react";
import { ArrowDownUp, Search, Trash2 } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { TrackRow } from "@/components/music/track-row";
import { usePlayer } from "@/components/providers/player-provider";
import { cn } from "@/lib/utils";
import type { Track } from "@/types";

export type SortKey = "title" | "artist" | "added" | "duration";

interface TrackTableProps {
  tracks: Track[];
  contextId: string;
  emptyState?: React.ReactNode;
  searchable?: boolean;
  defaultSort?: SortKey;
  onDelete?: (track: Track) => void;
  showSource?: boolean;
}

/**
 * Sortable, searchable track list used across Library / Favorites / Uploads.
 * Sorting is locale-aware via Intl.Collator so Cyrillic and CJK titles order
 * naturally for their language rather than by code point.
 */
export function TrackTable({
  tracks,
  contextId,
  emptyState,
  searchable = true,
  defaultSort = "added",
  onDelete,
  showSource,
}: TrackTableProps) {
  const { t, intlLocale } = useI18n();
  const { playTrackList } = usePlayer();
  const [sort, setSort] = useState<SortKey>(defaultSort);
  const [ascending, setAscending] = useState(false);
  const [query, setQuery] = useState("");

  const collator = useMemo(() => new Intl.Collator(intlLocale, { sensitivity: "base", numeric: true }), [intlLocale]);

  const visible = useMemo(() => {
    const filtered = query.trim()
      ? tracks.filter((track) =>
          `${track.title} ${track.artist} ${track.album ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()),
        )
      : tracks;
    const sorted = [...filtered].sort((a, b) => {
      switch (sort) {
        case "title":
          return collator.compare(a.title, b.title);
        case "artist":
          return collator.compare(a.artist, b.artist);
        case "duration":
          return (a.duration || 0) - (b.duration || 0);
        case "added":
        default:
          return (a.addedAt ?? 0) - (b.addedAt ?? 0);
      }
    });
    return ascending ? sorted : sorted.reverse();
  }, [ascending, collator, query, sort, tracks]);

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: "added", label: t("library.sortAdded") },
    { key: "title", label: t("library.sortTitle") },
    { key: "artist", label: t("library.sortArtist") },
    { key: "duration", label: t("library.sortDuration") },
  ];

  if (tracks.length === 0) return <>{emptyState}</>;

  return (
    <div>
      {searchable && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("library.searchLibrary")}
              aria-label={t("library.searchLibrary")}
              className="h-9 w-full rounded-full border border-white/10 bg-white/5 pl-9 pr-3 text-[12.5px] outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="scrollbar-none ml-auto flex items-center gap-1 overflow-x-auto">
            {sortOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => {
                  if (sort === option.key) setAscending((value) => !value);
                  else {
                    setSort(option.key);
                    setAscending(option.key !== "added");
                  }
                }}
                className={cn(
                  "flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-[11.5px] transition-colors",
                  sort === option.key ? "bg-white/12 text-foreground" : "text-muted-foreground hover:bg-white/6",
                )}
              >
                {option.label}
                {sort === option.key && <ArrowDownUp className={cn("size-3", !ascending && "rotate-180")} />}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-0.5">
        {visible.map((track, index) => (
          <div key={track.id} className="group/wrap flex items-center gap-1">
            <div className="min-w-0 flex-1">
              <TrackRow
                track={track}
                index={index}
                onPlay={() => void playTrackList(visible, index, contextId)}
                showAlbum
                showSource={showSource}
              />
            </div>
            {onDelete && (
              <button
                type="button"
                aria-label={t("common.delete")}
                onClick={() => onDelete(track)}
                className="mr-1 rounded-full p-2 text-muted-foreground opacity-0 transition-all hover:bg-red-500/15 hover:text-red-400 group-hover/wrap:opacity-100 focus-visible:opacity-100"
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </div>
        ))}
        {visible.length === 0 && (
          <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-[12.5px] text-muted-foreground">
            {t("common.noResults")}
          </p>
        )}
      </div>
    </div>
  );
}
