"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { History, Play, Trash2 } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { usePlayer } from "@/components/providers/player-provider";
import { TrackRow } from "@/components/music/track-row";
import { EmptyState } from "@/components/library/empty-state";
import { Button } from "@/components/ui/button";
import { TrackRowSkeleton } from "@/components/ui/skeleton";
import { clearRecentPlays, listRecentPlays } from "@/database/history";
import { useLibraryStore } from "@/store/library-store";
import { formatTime } from "@/lib/utils";
import { useClockMinute } from "@/hooks/use-clock";
import { toast } from "@/lib/toast";
import type { RecentPlay } from "@/types";

export default function RecentPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { playTrackList } = usePlayer();
  const [entries, setEntries] = useState<RecentPlay[] | null>(null);
  const refreshRecent = useLibraryStore((state) => state.refreshRecent);
  const recentVersion = useLibraryStore((state) => state.recent.length);
  // Re-renders once a minute so "3 min ago" labels stay truthful.
  const nowTs = useClockMinute();

  useEffect(() => {
    void listRecentPlays(40).then(setEntries).catch(() => setEntries([]));
  }, [recentVersion]);

  return (
    <div className="px-4 pt-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <History className="size-3.5 text-primary" /> {t("nav.library")}
          </div>
          <h1 className="mt-2 font-display text-[26px] font-extrabold tracking-[-0.03em] sm:text-[32px]">
            {t("nav.recent")}
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">{t("home.recentlyPlayedEmpty")}</p>
        </div>
        <div className="flex gap-2">
          {entries && entries.length > 0 && (
            <>
              <Button variant="secondary" size="sm" onClick={() => void playTrackList(entries.map((entry) => entry.track), 0, "recent")}>
                <Play className="size-3.5 fill-current" /> {t("library.playAll")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await clearRecentPlays();
                  setEntries([]);
                  await refreshRecent();
                  toast.success(t("settings.cleared"));
                }}
              >
                <Trash2 className="size-3.5" /> {t("common.clearAll")}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 pb-6">
        {entries === null ? (
          <TrackRowSkeleton count={8} />
        ) : entries.length === 0 ? (
          <EmptyState
            icon={History}
            title={t("home.recentlyPlayedEmpty")}
            description={t("home.forYouSubtitle")}
            action={{ label: t("nav.search"), onClick: () => router.push("/search") }}
          />
        ) : (
          <div className="space-y-0.5">
            {entries.map((entry, index) => (
              <div key={`${entry.trackId}-${entry.playedAt}`} className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <TrackRow
                    track={entry.track}
                    index={index}
                    onPlay={() => void playTrackList(entries.map((item) => item.track), index, "recent")}
                    showSource
                  />
                </div>
                <span className="hidden shrink-0 text-[10.5px] text-muted-foreground sm:block">
                  {nowTs === null ? "" : formatTime(Math.floor((nowTs - entry.playedAt) / 1000))}{" "}
                  {t("player.historyPlayed").toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="pb-4 text-[11px] text-muted-foreground/70">
        {t("settings.privacyHint")}{" "}
        <Link href="/settings" className="text-primary hover:underline">
          {t("settings.clearHistory")}
        </Link>
      </p>
    </div>
  );
}
