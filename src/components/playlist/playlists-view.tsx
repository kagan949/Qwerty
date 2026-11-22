"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ListMusic, Plus } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { useLibraryStore } from "@/store/library-store";
import { useUiStore } from "@/store/ui-store";
import { PlaylistCard } from "@/components/music/playlist-card";
import { EmptyState } from "@/components/library/empty-state";
import { Button } from "@/components/ui/button";
import { CardGridSkeleton } from "@/components/ui/skeleton";

export function PlaylistsView() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const playlists = useLibraryStore((state) => state.playlists);
  const hydrated = useLibraryStore((state) => state.hydrated);
  const setCreateOpen = useUiStore((state) => state.setCreatePlaylistOpen);

  useEffect(() => {
    if (searchParams.get("create") === "1") {
      setCreateOpen(true);
      router.replace("/playlists", { scroll: false });
    }
  }, [router, searchParams, setCreateOpen]);

  return (
    <div className="px-4 pt-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[26px] font-extrabold tracking-[-0.03em] sm:text-[32px]">
            {t("nav.playlists")}
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">{t("library.playlistsEmptyHint")}</p>
        </div>
        <Button variant="gradient" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" /> {t("playlist.create")}
        </Button>
      </div>

      <div className="mt-6 pb-4">
        {!hydrated ? (
          <CardGridSkeleton count={6} />
        ) : playlists.length === 0 ? (
          <EmptyState
            icon={ListMusic}
            title={t("library.playlistsEmpty")}
            description={t("library.playlistsEmptyHint")}
            action={{ label: t("playlist.create"), onClick: () => setCreateOpen(true) }}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {playlists.map((playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
