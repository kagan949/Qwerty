"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Compass, Heart, Play, Plus, Radio, Settings2, Sparkles, Upload } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { useHomeData } from "@/hooks/use-home-data";
import { useLibraryStore } from "@/store/library-store";
import { usePlayer } from "@/components/providers/player-provider";
import { useUiStore } from "@/store/ui-store";
import { greetingKeyForHour } from "@/lib/home-time";
import { GlobalSearchInput } from "@/components/search/global-search-input";
import { SectionHeader } from "@/components/layout/section-header";
import { TrackCard } from "@/components/music/track-card";
import { AlbumCard } from "@/components/music/album-card";
import { ArtistCard } from "@/components/music/artist-card";
import { MixCard } from "@/components/music/mix-card";
import { TrackRow } from "@/components/music/track-row";
import { Artwork } from "@/components/music/artwork";
import { SectionSkeleton, TrackRowSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatDurationLong } from "@/lib/utils";
import type { Album, Artist, CuratedMix, HomeSection, Track } from "@/types";
import { ListeningStats } from "@/components/home/listening-stats";
import { useClockMinute } from "@/hooks/use-clock";

export function HomeView() {
  const { t, intlLocale } = useI18n();
  const { data, isLoading, isError } = useHomeData();
  // Null until mount, so the server-rendered greeting never mismatches the
  // client's local time zone.
  const timestamp = useClockMinute();
  const now = timestamp === null ? null : new Date(timestamp);
  const greeting = t(now === null ? "home.greetingEvening" : greetingKeyForHour(now.getHours()));
  const dateLabel =
    now === null
      ? ""
      : new Intl.DateTimeFormat(intlLocale, { weekday: "long", day: "numeric", month: "long" }).format(now);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[460px] overflow-hidden">
        <div className="aurora" />
        <div className="grid-backdrop absolute inset-0" />
      </div>

      <div className="relative px-4 pt-6 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{dateLabel}</p>
            <h1 className="mt-1 font-display text-[26px] font-extrabold tracking-[-0.03em] sm:text-[32px]">
              {greeting}
              <span className="text-primary">.</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 lg:hidden">
            <Link href="/search" aria-label={t("nav.search")}>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Sparkles className="size-4" />
              </Button>
            </Link>
            <Link href="/settings" aria-label={t("nav.settings")}>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Settings2 className="size-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Hero + search */}
        <section className="mt-5 overflow-hidden rounded-3xl border border-white/8 bg-[radial-gradient(120%_140%_at_0%_0%,rgba(139,92,246,0.22),transparent_55%),radial-gradient(100%_120%_at_100%_0%,rgba(34,211,238,0.16),transparent_50%)] p-5 sm:p-7 lg:p-9">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/6 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-foreground/80">
                <Radio className="size-3 text-primary" /> {t("home.heroBadge")}
              </span>
              <h2 className="mt-3 font-display text-[30px] font-extrabold leading-[1.06] tracking-[-0.035em] sm:text-[42px] lg:text-[46px]">
                {t("home.heroTitle")}
                <br />
                <span className="text-gradient">{t("home.heroTitleAccent")}</span>
              </h2>
              <p className="mt-3 max-w-lg text-[13.5px] leading-relaxed text-muted-foreground sm:text-[14.5px]">
                {t("home.heroSubtitle")}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-2.5">
                <Button variant="gradient" size="lg" asChild>
                  <Link href="/explore">
                    <Play className="size-4 fill-current" /> {t("home.heroCta")}
                  </Link>
                </Button>
                <Button variant="secondary" size="lg" asChild>
                  <Link href="/search">
                    <Compass className="size-4" /> {t("home.heroSecondary")}
                  </Link>
                </Button>
              </div>
            </div>

            <div className="w-full max-w-md lg:w-[380px]">
              <GlobalSearchInput size="xl" placeholder={t("home.searchPlaceholder")} />
              <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground/80">
                {data?.sources?.map((source) => (
                  <span key={source.id} className="inline-flex items-center gap-1.5">
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        source.ok ? "bg-emerald-400 shadow-[0_0_8px_2px_rgb(52_211_153/0.4)]" : "bg-amber-400",
                      )}
                    />
                    {t(`sources.${source.id}`)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {isError && (
          <div className="mt-4 rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-[12.5px] text-amber-200">
            {t("errors.sourceUnavailableHint")}
          </div>
        )}

        {/* Quick access: recently played + user playlists */}
        <QuickAccess />

        {/* Global sections */}
        <div className="mt-8 space-y-9">
          {isLoading ? (
            <>
              <SectionSkeleton />
              <SectionSkeleton />
              <SectionSkeleton />
            </>
          ) : (
            data?.sections.map((section) => <HomeSectionBlock key={section.id} section={section} />)
          )}
        </div>

        <div className="mt-10">
          <ListeningStats />
        </div>

        <YourMusicStrip />

        <SourcesFooter />
      </div>
    </div>
  );
}

function HomeSectionBlock({ section }: { section: HomeSection }) {
  const { t } = useI18n();
  const { playCollection } = usePlayer();
  const titleKey = `home.${sectionTitleKey(section.id)}` as string;
  const subtitleKey = `home.${sectionSubtitleKey(section.id)}` as string;
  const title = t(titleKey) || section.title;
  const subtitle = t(subtitleKey) || section.subtitle;

  if (section.kind === "tracks") {
    const tracks = section.items as Track[];
    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <SectionHeader
          title={title}
          subtitle={subtitle}
          href={`/search?q=${encodeURIComponent(section.title)}`}
          actionLabel={t("common.viewAll")}
        >
          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex"
            onClick={() => void playCollection(tracks, section.id)}
          >
            <Play className="size-3.5 fill-current" /> {t("library.playAll")}
          </Button>
        </SectionHeader>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {tracks.slice(0, 12).map((track, index) => (
            <TrackCard key={`${track.id}-${index}`} track={track} onPlay={(item) => void playCollection([item], section.id)} priority={index < 6} />
          ))}
        </div>
      </motion.section>
    );
  }

  if (section.kind === "albums") {
    const albums = section.items as Album[];
    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <SectionHeader title={title} subtitle={subtitle} href="/explore" actionLabel={t("common.viewAll")} />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {albums.slice(0, 12).map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      </motion.section>
    );
  }

  if (section.kind === "artists") {
    const artists = section.items as Artist[];
    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <SectionHeader title={title} subtitle={subtitle} />
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {artists.slice(0, 8).map((artist) => (
            <ArtistCard key={artist.id} artist={artist} />
          ))}
        </div>
      </motion.section>
    );
  }

  const mixes = section.items as CuratedMix[];
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <SectionHeader title={title} subtitle={subtitle} href="/explore" actionLabel={t("common.viewAll")} />
      <div className="scrollbar-none -mx-1 mt-4 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
        {mixes.map((mix) => (
          <div key={mix.id} className="snap-start">
            <MixCard mix={mix} />
          </div>
        ))}
      </div>
    </motion.section>
  );
}

function sectionTitleKey(id: string) {
  switch (id) {
    case "for-you":
      return "forYou";
    case "popular-mixes":
      return "popularMixes";
    case "new-releases":
      return "newReleases";
    case "favorite-artists":
      return "favoriteArtists";
    case "archive-discoveries":
      return "recentlyPlayed";
    default:
      return "forYou";
  }
}
function sectionSubtitleKey(id: string) {
  switch (id) {
    case "for-you":
      return "forYouSubtitle";
    case "popular-mixes":
      return "popularMixesSubtitle";
    case "new-releases":
      return "newReleasesSubtitle";
    case "favorite-artists":
      return "explore.genresSubtitle";
    default:
      return "forYouSubtitle";
  }
}

function QuickAccess() {
  const { t } = useI18n();
  const { playTrackList } = usePlayer();
  const recent = useLibraryStore((state) => state.recent);
  const playlists = useLibraryStore((state) => state.playlists);
  const localTracks = useLibraryStore((state) => state.localTracks);
  const setCreateOpen = useUiStore((state) => state.setCreatePlaylistOpen);
  const hydrated = useLibraryStore((state) => state.hydrated);

  const items = [
    ...recent.slice(0, 4).map((entry) => ({
      key: `recent-${entry.trackId}`,
      title: entry.track.title,
      subtitle: entry.track.artist,
      track: entry.track,
      href: null as string | null,
    })),
    ...playlists.slice(0, 3).map((playlist) => ({
      key: `pl-${playlist.id}`,
      title: playlist.name,
      subtitle: `${playlist.tracks.length} ${t("common.songs")}`,
      track: null,
      href: `/playlists/${playlist.id}`,
    })),
    ...(localTracks.length > 0
      ? [
          {
            key: "uploads",
            title: t("home.yourMusic"),
            subtitle: `${localTracks.length} ${t("common.songs")}`,
            track: null,
            href: "/library?tab=uploads",
          },
        ]
      : []),
  ];

  return (
    <section className="mt-7">
      <SectionHeader title={t("home.quickAccess")} />
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {!hydrated ? (
          <>
            <div className="h-[64px] skeleton-shimmer rounded-2xl" />
            <div className="h-[64px] skeleton-shimmer rounded-2xl" />
            <div className="hidden h-[64px] skeleton-shimmer rounded-2xl lg:block" />
          </>
        ) : items.length === 0 ? (
          <div className="col-span-full flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-white/10 px-4 py-4">
            <p className="text-[12.5px] text-muted-foreground">{t("home.recentlyPlayedEmpty")}</p>
          </div>
        ) : (
          items.slice(0, 6).map((item) => {
            const content = (
              <>
                <span className="relative size-[52px] shrink-0 overflow-hidden rounded-lg bg-white/8">
                  {item.track ? (
                    <Artwork track={item.track} className="size-full" rounded="rounded-lg" />
                  ) : (
                    <span className="grid size-full place-items-center text-muted-foreground">
                      <Heart className="size-4" />
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-[13px] font-semibold">{item.title}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{item.subtitle}</span>
                </span>
                <span className="grid size-9 place-items-center rounded-full bg-foreground/8 text-foreground/80 transition-all group-hover:bg-primary group-hover:text-white">
                  <Play className="size-3.5 translate-x-px fill-current" />
                </span>
              </>
            );

            if (item.track) {
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => void playTrackList([item.track as Track], 0, "quick-access")}
                  className="group flex items-center gap-3 rounded-2xl border border-white/6 bg-white/4 p-2 pr-3 transition-colors hover:bg-white/8"
                >
                  {content}
                </button>
              );
            }
            return (
              <Link
                key={item.key}
                href={item.href ?? "/library"}
                className="group flex items-center gap-3 rounded-2xl border border-white/6 bg-white/4 p-2 pr-3 transition-colors hover:bg-white/8"
              >
                {content}
              </Link>
            );
          })
        )}
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-3 rounded-2xl border border-dashed border-white/12 p-2 pr-3 text-left transition-colors hover:border-primary/40 hover:bg-white/4"
        >
          <span className="grid size-[52px] shrink-0 place-items-center rounded-lg bg-primary/12 text-primary">
            <Plus className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-semibold">{t("playlist.create")}</span>
            <span className="block truncate text-[11px] text-muted-foreground">{t("playlist.descriptionPlaceholderShort")}</span>
          </span>
        </button>
      </div>
    </section>
  );
}

function YourMusicStrip() {
  const { t } = useI18n();
  const localTracks = useLibraryStore((state) => state.localTracks);
  const { playTrackList } = usePlayer();
  const totalDuration = localTracks.reduce((sum, track) => sum + (track.duration || 0), 0);

  return (
    <section className="mt-10 overflow-hidden rounded-3xl border border-white/8 bg-[linear-gradient(120deg,rgba(34,211,238,0.10),rgba(139,92,246,0.14))] p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-primary">
            <Upload className="size-5" />
          </span>
          <div>
            <h2 className="font-display text-[18px] font-bold tracking-tight">{t("home.yourMusic")}</h2>
            <p className="mt-1 max-w-md text-[12.5px] leading-relaxed text-muted-foreground">
              {localTracks.length > 0
                ? `${localTracks.length} ${t("common.songs")} · ${formatDurationLong(totalDuration)}`
                : t("home.yourMusicSubtitle")}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" asChild>
            <Link href="/upload">
              <Upload className="size-4" /> {t("home.uploadCta")}
            </Link>
          </Button>
          {localTracks.length > 0 && (
            <Button variant="gradient" onClick={() => void playTrackList(localTracks, 0, "local")}>
              <Play className="size-4 fill-current" /> {t("library.playAll")}
            </Button>
          )}
          <Button variant="ghost" asChild>
            <Link href="/library">
              {t("nav.library")} <ArrowUpRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      {localTracks.length > 0 ? (
        <div className="mt-4 space-y-1">
          {localTracks.slice(0, 4).map((track, index) => (
            <TrackRow key={track.id} track={track} index={index} onPlay={(item) => void playTrackList([item], 0, "local")} />
          ))}
        </div>
      ) : (
        <div className="mt-4">
          <TrackRowSkeleton count={2} />
        </div>
      )}
    </section>
  );
}

function SourcesFooter() {
  const { t } = useI18n();
  const { data } = useHomeData();
  return (
    <footer className="mt-10 rounded-3xl border border-white/6 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[12.5px] font-semibold">{t("home.sourcesTitle")}</p>
          <p className="mt-0.5 text-[11.5px] text-muted-foreground">{t("home.sourcesSubtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {data?.sources?.map((source) => (
            <a
              key={source.id}
              href={source.homepage}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-[11.5px] transition-colors hover:bg-white/6"
            >
              <span className={cn("size-1.5 rounded-full", source.ok ? "bg-emerald-400" : "bg-amber-400")} />
              {source.name}
              <Badge variant="outline">{source.license}</Badge>
            </a>
          ))}
        </div>
      </div>
      <p className="mt-4 border-t border-white/6 pt-4 text-[11px] leading-relaxed text-muted-foreground/80">
        {t("explore.licensedNote")}
      </p>
    </footer>
  );
}
