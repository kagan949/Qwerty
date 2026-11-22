"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HardDrive, Heart, ListMusic, Music2, Play, Upload } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { useLibraryStore } from "@/store/library-store";
import { usePlayer } from "@/components/providers/player-provider";
import { TrackTable } from "@/components/library/track-table";
import { EmptyState } from "@/components/library/empty-state";
import { StorageMeter } from "@/components/library/storage-meter";
import { PlaylistCard } from "@/components/music/playlist-card";
import { TrackCard } from "@/components/music/track-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { TrackRowSkeleton, CardGridSkeleton } from "@/components/ui/skeleton";
import { deleteLocalTrack } from "@/database/local-tracks";
import { toast } from "@/lib/toast";
import { cn, formatDurationLong } from "@/lib/utils";
import Link from "next/link";
import type { Track } from "@/types";

export function LibraryView() {
  const { t, intlLocale } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "overview";
  const { playCollection, playTrackList } = usePlayer();
  const localTracks = useLibraryStore((state) => state.localTracks);
  const favorites = useLibraryStore((state) => state.favorites);
  const playlists = useLibraryStore((state) => state.playlists);
  const recent = useLibraryStore((state) => state.recent);
  const hydrated = useLibraryStore((state) => state.hydrated);
  const refreshLocal = useLibraryStore((state) => state.refreshLocal);
  const [storageRefreshed, setStorageRefreshed] = useState(0);

  const totalDuration = useMemo(
    () => localTracks.reduce((sum, track) => sum + (track.duration || 0), 0),
    [localTracks],
  );

  const handleDelete = async (track: Track) => {
    if (!track.localId) return;
    if (!window.confirm(t("library.deleteTrackConfirm"))) return;
    try {
      await deleteLocalTrack(track.localId);
      await refreshLocal();
      setStorageRefreshed((value) => value + 1);
      toast.success(t("toast.trackDeleted"));
    } catch {
      toast.error(t("toast.deleteFailed"));
    }
  };

  return (
    <div className="px-4 pt-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[26px] font-extrabold tracking-[-0.03em] sm:text-[32px]">{t("library.title")}</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">{t("library.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" asChild>
            <Link href="/upload">
              <Upload className="size-3.5" /> {t("home.uploadCta")}
            </Link>
          </Button>
          {localTracks.length > 0 && (
            <Button size="sm" variant="gradient" onClick={() => void playCollection(localTracks, "local")}>
              <Play className="size-3.5 fill-current" /> {t("library.playAll")}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Music2} label={t("library.uploadsTitle")} value={String(localTracks.length)} href="/library?tab=uploads" />
        <StatCard icon={Heart} label={t("library.favoritesTitle")} value={String(favorites.length)} href="/favorites" />
        <StatCard icon={ListMusic} label={t("library.playlistsTitle")} value={String(playlists.length)} href="/playlists" />
        <StatCard
          icon={HardDrive}
          label={t("home.listeningTime")}
          value={formatDurationLong(totalDuration, intlLocale.slice(0, 2))}
          href="/library?tab=uploads"
        />
      </div>

      <Tabs value={tab} onValueChange={(value) => router.replace(`/library?tab=${value}`, { scroll: false })} className="mt-6">
        <TabsList>
          <TabsTrigger value="overview">{t("library.tabs.overview")}</TabsTrigger>
          <TabsTrigger value="uploads">{t("library.tabs.uploads")}</TabsTrigger>
          <TabsTrigger value="favorites">{t("library.tabs.favorites")}</TabsTrigger>
          <TabsTrigger value="playlists">{t("library.tabs.playlists")}</TabsTrigger>
          <TabsTrigger value="recent">{t("library.tabs.recent")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {!hydrated ? (
            <CardGridSkeleton count={4} />
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {t("home.recentlyPlayed")}
                  </h2>
                  <Link href="/recent" className="text-[11.5px] text-muted-foreground hover:text-foreground">
                    {t("common.viewAll")}
                  </Link>
                </div>
                {recent.length === 0 ? (
                  <EmptyState compact icon={Music2} title={t("home.recentlyPlayedEmpty")} />
                ) : (
                  <div className="space-y-1">
                    {recent.slice(0, 5).map((entry) => (
                      <TrackCard key={entry.trackId} track={entry.track} onPlay={(item) => void playTrackList([item], 0, "library-recent")} />
                    ))}
                  </div>
                )}
              </section>
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {t("library.playlistsTitle")}
                  </h2>
                  <Link href="/playlists" className="text-[11.5px] text-muted-foreground hover:text-foreground">
                    {t("common.viewAll")}
                  </Link>
                </div>
                {playlists.length === 0 ? (
                  <EmptyState
                    compact
                    icon={ListMusic}
                    title={t("library.playlistsEmpty")}
                    description={t("library.playlistsEmptyHint")}
                    action={{ label: t("playlist.create"), onClick: () => router.push("/playlists?create=1") }}
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {playlists.slice(0, 6).map((playlist) => (
                      <PlaylistCard key={playlist.id} playlist={playlist} />
                    ))}
                  </div>
                )}
              </section>
              <section className="lg:col-span-2">
                <StorageMeter refreshKey={storageRefreshed} />
              </section>
            </div>
          )}
        </TabsContent>

        <TabsContent value="uploads">
          {!hydrated ? (
            <TrackRowSkeleton count={6} />
          ) : (
            <TrackTable
              tracks={localTracks}
              contextId="local"
              onDelete={handleDelete}
              showSource
              emptyState={
                <EmptyState
                  icon={Upload}
                  title={t("library.uploadsEmpty")}
                  description={t("library.uploadsEmptyHint")}
                  action={{ label: t("home.uploadCta"), onClick: () => router.push("/upload") }}
                />
              }
            />
          )}
        </TabsContent>

        <TabsContent value="favorites">
          {!hydrated ? (
            <TrackRowSkeleton count={6} />
          ) : (
            <TrackTable
              tracks={favorites}
              contextId="favorites"
              defaultSort="added"
              emptyState={
                <EmptyState
                  icon={Heart}
                  title={t("library.favoritesEmpty")}
                  description={t("library.favoritesEmptyHint")}
                  action={{ label: t("nav.search"), onClick: () => router.push("/search") }}
                />
              }
            />
          )}
        </TabsContent>

        <TabsContent value="playlists">
          {playlists.length === 0 ? (
            <EmptyState
              icon={ListMusic}
              title={t("library.playlistsEmpty")}
              description={t("library.playlistsEmptyHint")}
              action={{ label: t("playlist.create"), onClick: () => router.push("/playlists?create=1") }}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
              {playlists.map((playlist) => (
                <PlaylistCard key={playlist.id} playlist={playlist} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recent">
          {recent.length === 0 ? (
            <EmptyState icon={Music2} title={t("home.recentlyPlayedEmpty")} description={t("library.queueEmptyHint")} />
          ) : (
            <TrackTable tracks={recent.map((entry) => entry.track)} contextId="library-recent" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Music2;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-white/8 bg-card/40 p-3.5",
        "transition-colors hover:border-white/16 hover:bg-card/70",
      )}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[11px] uppercase tracking-[0.1em] text-muted-foreground">{label}</span>
        <span className="block font-display text-lg font-bold tabular-nums">{value}</span>
      </span>
    </Link>
  );
}
