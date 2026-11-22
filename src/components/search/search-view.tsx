"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Clock, ListMusic, SearchX, Sparkles, TrendingUp, X } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { useDebouncedValue } from "@/hooks/use-debounce";
import { useCatalogSearch } from "@/hooks/use-search";
import { useLocalSearch } from "@/hooks/use-local-search";
import { GlobalSearchInput } from "@/components/search/global-search-input";
import { SectionHeader } from "@/components/layout/section-header";
import { TrackRow } from "@/components/music/track-row";
import { TrackCard } from "@/components/music/track-card";
import { AlbumCard } from "@/components/music/album-card";
import { ArtistCard } from "@/components/music/artist-card";
import { PlaylistCard } from "@/components/music/playlist-card";
import { usePlayer } from "@/components/providers/player-provider";
import { useLibraryStore } from "@/store/library-store";
import { addSearchHistory, clearSearchHistory, listSearchHistory, removeSearchHistoryEntry } from "@/database/history";
import { Button } from "@/components/ui/button";
import { Skeleton, TrackRowSkeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { SEARCH_DEBOUNCE_MS } from "@/lib/constants";
import type { Album, Artist, Playlist, SearchHistoryEntry } from "@/types";

const FILTERS = ["all", "tracks", "artists", "albums", "playlists"] as const;
type Filter = (typeof FILTERS)[number];

const TRENDING = ["electronic", "chillout", "jazz", "piano", "lofi", "ambient", "rock", "acoustic"];

export function SearchView() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [input, setInput] = useState(initialQuery);
  /** Set only by explicit submits/clears; typing flows through `debounced`. */
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery.trim());
  const [filter, setFilter] = useState<Filter>("all");
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const { playCollection, playTrackList } = usePlayer();
  const playlists = useLibraryStore((state) => state.playlists);
  /** False until the user's first keystroke, so the URL query wins initially. */
  const [inputTouched, setInputTouched] = useState(false);

  const debounced = useDebouncedValue(input, SEARCH_DEBOUNCE_MS);
  const local = useLocalSearch(input, 5);

  // The effective query is derived, not mirrored in state: whatever the user
  // last typed (debounced) wins, otherwise the submitted/URL query applies.
  // This is what makes results update without an effect round-trip.
  const committedQuery = debounced.trim();
  const activeQuery = inputTouched && committedQuery.length >= 2 ? committedQuery : submittedQuery;

  const remote = useCatalogSearch(activeQuery, activeQuery.trim().length >= 2);

  useEffect(() => {
    void listSearchHistory().then((entries) => {
      setHistory(entries);
      setHistoryLoaded(true);
    }).catch(() => setHistoryLoaded(true));
  }, []);

  // Keep the URL in sync so results are shareable / back-button friendly.
  useEffect(() => {
    const trimmed = activeQuery.trim();
    const current = searchParams.get("q") ?? "";
    if (trimmed && trimmed !== current) {
      router.replace(`/search?q=${encodeURIComponent(trimmed)}`, { scroll: false });
    }
  }, [activeQuery, router, searchParams]);

  // Persist typed queries to history once the debounce settles.
  useEffect(() => {
    if (!inputTouched || committedQuery.length < 2) return;
    void addSearchHistory(committedQuery).then(() => listSearchHistory().then(setHistory)).catch(() => {});
  }, [committedQuery, inputTouched]);

  const handleSubmit = useCallback((value: string) => {
    setSubmittedQuery(value);
    setInput(value);
    void addSearchHistory(value).then(() => listSearchHistory().then(setHistory)).catch(() => {});
  }, []);

  const results = remote.data;
  const loading = remote.isFetching;
  const searching = activeQuery.length >= 2;
  const localPlaylists = useMemo(
    () =>
      activeQuery.length > 0
        ? playlists.filter((playlist) => playlist.name.toLowerCase().includes(activeQuery.toLowerCase()))
        : [],
    [activeQuery, playlists],
  );

  const tracks = results?.tracks ?? [];
  const albums = results?.albums ?? [];
  const artists = results?.artists ?? [];
  const sourcesDown = results ? results.sources.every((source) => !source.ok) : false;
  const totalRemote = tracks.length + albums.length + artists.length;
  const empty = searching && !loading && totalRemote === 0 && local.tracks.length === 0 && localPlaylists.length === 0;

  const showTracks = filter === "all" || filter === "tracks";
  const showArtists = (filter === "all" || filter === "artists") && artists.length > 0;
  const showAlbums = (filter === "all" || filter === "albums") && albums.length > 0;
  const showPlaylists = (filter === "all" || filter === "playlists") && localPlaylists.length > 0;

  return (
    <div className="relative px-4 pt-5 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[300px] overflow-hidden">
        <div className="aurora opacity-70" />
      </div>

      <div className="relative">
        <h1 className="font-display text-[26px] font-extrabold tracking-[-0.03em] sm:text-[32px]">{t("search.title")}</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">{t("search.subtitle")}</p>

        <div className="mt-4 max-w-2xl">
          <GlobalSearchInput
            size="xl"
            value={input}
            onChange={(value) => {
              setInputTouched(true);
              setInput(value);
              if (!value.trim()) setSubmittedQuery("");
            }}
            onSubmit={handleSubmit}
            loading={loading}
            autoFocus={!initialQuery}
          />
        </div>

        {/* Filters */}
        <div className="scrollbar-none mt-4 flex items-center gap-1.5 overflow-x-auto pb-1">
          {FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors",
                filter === item
                  ? "border-primary/40 bg-primary/15 text-foreground"
                  : "border-white/10 text-muted-foreground hover:bg-white/6 hover:text-foreground",
              )}
            >
              {t(`search.${item}`)}
            </button>
          ))}
          {results?.sources?.map((source) => (
            <span
              key={source.id}
              className="ml-auto hidden shrink-0 items-center gap-1.5 rounded-full border border-white/8 px-2.5 py-1 text-[10.5px] text-muted-foreground sm:flex"
              title={source.error ?? `${source.latencyMs ?? 0} ms`}
            >
              <span className={cn("size-1.5 rounded-full", source.ok ? "bg-emerald-400" : "bg-amber-400")} />
              {source.name}
            </span>
          ))}
        </div>

        {/* Idle state: history + trending + suggestions */}
        {!searching && (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section>
              <SectionHeader
                title={t("search.recent")}
                actionLabel={history.length > 0 ? t("search.clearHistory") : undefined}
                href={undefined}
              >
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={async () => {
                      await clearSearchHistory();
                      setHistory([]);
                    }}
                    className="text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t("search.clearHistory")}
                  </button>
                )}
              </SectionHeader>
              <div className="mt-3 space-y-1">
                {!historyLoaded ? (
                  <TrackRowSkeleton count={3} />
                ) : history.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-white/10 px-4 py-5 text-[12.5px] text-muted-foreground">
                    {t("search.noHistory")}
                  </p>
                ) : (
                  history.map((entry) => (
                    <div key={entry.query} className="group flex items-center gap-2 rounded-xl px-1 transition-colors hover:bg-white/5">
                      <button
                        type="button"
                        onClick={() => handleSubmit(entry.query)}
                        className="flex min-w-0 flex-1 items-center gap-3 px-2 py-2 text-left"
                      >
                        <Clock className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate text-[13px]">{entry.query}</span>
                      </button>
                      <button
                        type="button"
                        aria-label={t("common.remove")}
                        onClick={async () => {
                          await removeSearchHistoryEntry(entry.query);
                          setHistory((prev) => prev.filter((item) => item.query !== entry.query));
                        }}
                        className="rounded-full p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-white/10 group-hover:opacity-100"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section>
              <SectionHeader title={t("search.trending")} />
              <div className="mt-3 flex flex-wrap gap-2">
                {TRENDING.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => handleSubmit(term)}
                    className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-3.5 py-2 text-[12.5px] transition-colors hover:border-primary/40 hover:bg-primary/10"
                  >
                    <TrendingUp className="size-3.5 text-primary" />
                    {term}
                    <ArrowRight className="size-3 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                  </button>
                ))}
              </div>
              <div className="mt-6 rounded-2xl border border-white/8 bg-card/40 p-4">
                <p className="flex items-center gap-1.5 text-[12px] font-semibold">
                  <Sparkles className="size-3.5 text-primary" /> {t("search.typeToSearch")}
                </p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">{t("search.typeToSearchHint")}</p>
              </div>
            </section>
          </div>
        )}

        {/* Loading */}
        {searching && loading && totalRemote === 0 && (
          <div className="mt-6 max-w-3xl space-y-4">
            <Skeleton className="h-5 w-32" />
            <TrackRowSkeleton count={5} />
          </div>
        )}

        {sourcesDown && searching && !loading && (
          <div className="mt-5 rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-[12.5px] text-amber-200">
            {t("search.searchError")}
          </div>
        )}

        {/* Empty */}
        {empty && (
          <div className="mt-10 flex flex-col items-center rounded-3xl border border-dashed border-white/10 px-6 py-12 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-white/6 text-muted-foreground">
              <SearchX className="size-6" />
            </span>
            <p className="mt-3 font-display text-base font-semibold">
              {t("search.empty")} «{activeQuery}»
            </p>
            <p className="mt-1 max-w-sm text-[12.5px] leading-relaxed text-muted-foreground">{t("search.emptyHint")}</p>
            <p className="mt-1 max-w-sm text-[12px] text-muted-foreground/80">{t("search.emptyLocalHint")}</p>
          </div>
        )}

        {/* Local results */}
        {searching && local.tracks.length > 0 && showTracks && (
          <section className="mt-6">
            <SectionHeader
              title={t("search.localSection")}
              subtitle={`${local.total} ${t("search.resultsCount")}`}
            />
            <div className="mt-2 space-y-0.5">
              {local.tracks.map((track, index) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={index}
                  onPlay={(item) => void playTrackList(local.tracks, local.tracks.indexOf(item), "search-local")}
                  showSource
                />
              ))}
            </div>
          </section>
        )}

        {/* Remote results */}
        {searching && totalRemote > 0 && (
          <div className="mt-6 space-y-8">
            {showTracks && tracks.length > 0 && (
              <section>
                <SectionHeader title={t("search.tracks")} subtitle={`${tracks.length} ${t("search.resultsCount")}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden sm:inline-flex"
                    onClick={() => void playCollection(tracks, "search")}
                  >
                    {t("library.playAll")}
                  </Button>
                </SectionHeader>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                  {tracks.slice(0, 12).map((track, index) => (
                    <TrackCard key={`${track.id}-${index}`} track={track} onPlay={(item) => void playCollection([item, ...tracks.filter((tt) => tt.id !== item.id)], "search")} />
                  ))}
                </div>
                {tracks.slice(12).length > 0 && (
                  <div className="mt-3 space-y-0.5">
                    {tracks.slice(12).map((track, index) => (
                      <TrackRow
                        key={`${track.id}-row-${index}`}
                        track={track}
                        index={index + 12}
                        onPlay={(item) => void playTrackList(tracks, tracks.indexOf(item), "search")}
                        showSource
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {showArtists && (
              <section>
                <SectionHeader title={t("search.artists")} subtitle={`${artists.length} ${t("search.resultsCount")}`} />
                <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                  {artists.map((artist: Artist) => (
                    <ArtistCard key={artist.id} artist={artist} />
                  ))}
                </div>
              </section>
            )}

            {showAlbums && (
              <section>
                <SectionHeader title={t("search.albums")} subtitle={`${albums.length} ${t("search.resultsCount")}`} />
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
                  {albums.map((album: Album) => (
                    <AlbumCard key={album.id} album={album} />
                  ))}
                </div>
              </section>
            )}

            {showPlaylists && (
              <section>
                <SectionHeader title={t("search.playlists")} />
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
                  {localPlaylists.map((playlist: Playlist) => (
                    <PlaylistCard key={playlist.id} playlist={playlist} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {searching && totalRemote > 0 && (
          <p className="mt-8 flex items-center justify-center gap-2 pb-4 text-[11px] text-muted-foreground/70">
            <ListMusic className="size-3" />
            {t("explore.licensedNote")}
          </p>
        )}

        <div className="h-6" />
      </div>
    </div>
  );
}
