"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Play, Shuffle } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { useLibraryStore } from "@/store/library-store";
import { usePlayer } from "@/components/providers/player-provider";
import { usePlayerStore } from "@/store/player-store";
import { TrackTable } from "@/components/library/track-table";
import { EmptyState } from "@/components/library/empty-state";
import { Button } from "@/components/ui/button";
import { TrackRowSkeleton } from "@/components/ui/skeleton";

export default function FavoritesPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { playCollection, playTrackList } = usePlayer();
  const favorites = useLibraryStore((state) => state.favorites);
  const hydrated = useLibraryStore((state) => state.hydrated);
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle);

  return (
    <div className="px-4 pt-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="grid size-28 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(140deg,#f43f5e,#8b5cf6)] shadow-[0_24px_60px_-30px_rgb(244_63_94/0.8)] sm:size-32">
          <Heart className="size-12 fill-white text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {t("nav.library")}
          </p>
          <h1 className="mt-1 font-display text-[30px] font-extrabold tracking-[-0.035em] sm:text-[40px]">
            {t("library.favoritesTitle")}
          </h1>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            {favorites.length} {t("common.songs")}
          </p>
        </div>
      </div>

      {favorites.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="gradient" onClick={() => void playCollection(favorites, "favorites")}>
            <Play className="size-4 fill-current" /> {t("library.playAll")}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              toggleShuffle();
              void playTrackList([...favorites].sort(() => Math.random() - 0.5), 0, "favorites");
            }}
          >
            <Shuffle className="size-4" /> {t("library.shufflePlay")}
          </Button>
        </div>
      )}

      <div className="mt-6 pb-4">
        {!hydrated ? (
          <TrackRowSkeleton count={8} />
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
      </div>
      <p className="pb-4 text-[11px] text-muted-foreground/70">
        {t("settings.privacyHint")}{" "}
        <Link href="/settings" className="text-primary hover:underline">
          {t("nav.settings")}
        </Link>
      </p>
    </div>
  );
}
