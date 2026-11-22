"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis } from "recharts";
import { Clock3, Headphones, TrendingUp } from "lucide-react";
import { listPlayEvents } from "@/database/history";
import { useI18n } from "@/i18n/provider";
import { SectionHeader } from "@/components/layout/section-header";
import { formatDurationLong } from "@/lib/utils";
import { useLibraryStore } from "@/store/library-store";
import type { PlayEvent } from "@/types";

/**
 * Personal listening stats computed locally from IndexedDB play events.
 * Nothing leaves the device; the chart is a 14-day histogram.
 */
export function ListeningStats() {
  const { t, intlLocale } = useI18n();
  const [events, setEvents] = useState<PlayEvent[]>([]);
  const localRefresh = useLibraryStore((state) => state.recent.length);

  useEffect(() => {
    const since = Date.now() - 28 * 24 * 60 * 60 * 1000;
    void listPlayEvents(since).then(setEvents).catch(() => setEvents([]));
  }, [localRefresh]);

  const stats = useMemo(() => {
    const totalSeconds = events.reduce((sum, event) => sum + (event.listenedSeconds || 0), 0);
    const artistCounts = new Map<string, number>();
    for (const event of events) artistCounts.set(event.artist, (artistCounts.get(event.artist) ?? 0) + 1);
    const topArtists = [...artistCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

    const byDay = new Map<string, number>();
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      byDay.set(date.toISOString().slice(0, 10), 0);
    }
    for (const event of events) {
      const key = new Date(event.playedAt).toISOString().slice(0, 10);
      if (byDay.has(key)) byDay.set(key, (byDay.get(key) ?? 0) + Math.max(1, Math.round(event.listenedSeconds / 60)));
    }
    const series = [...byDay.entries()].map(([date, minutes]) => ({
      date,
      label: new Intl.DateTimeFormat(intlLocale, { day: "numeric" }).format(new Date(date)),
      minutes,
    }));
    return { totalSeconds, totalPlays: events.length, topArtists, series };
  }, [events, intlLocale]);

  if (events.length === 0) {
    return (
      <section>
        <SectionHeader title={t("home.statsTitle")} subtitle={t("home.statsSubtitle")} />
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-dashed border-white/10 p-5">
          <span className="grid size-10 place-items-center rounded-xl bg-white/6 text-muted-foreground">
            <TrendingUp className="size-5" />
          </span>
          <p className="text-[12.5px] text-muted-foreground">{t("home.noStats")}</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <SectionHeader title={t("home.statsTitle")} subtitle={t("home.statsSubtitle")} />
      <div className="mt-4 grid gap-3 lg:grid-cols-[1.35fr_1fr]">
        <div className="rounded-2xl border border-white/8 bg-card/50 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{t("home.listeningTime")}</p>
              <p className="mt-1 font-display text-2xl font-bold tracking-tight">
                {formatDurationLong(stats.totalSeconds, intlLocale.slice(0, 2))}
              </p>
            </div>
            <div className="flex gap-3 text-right">
              <div>
                <p className="text-[10.5px] uppercase tracking-wide text-muted-foreground">{t("home.playsCount")}</p>
                <p className="font-display text-lg font-semibold">{stats.totalPlays}</p>
              </div>
            </div>
          </div>
          <div className="mt-3 h-[112px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.series} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="label" hide />
                <RechartsTooltip
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  contentStyle={{
                    background: "#121217",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    fontSize: 11,
                    color: "#f6f6f8",
                  }}
                  formatter={(value: number) => [`${value} ${t("common.minutes")}`, t("home.listeningTime")]}
                  labelFormatter={(label: string) => label}
                />
                <Bar dataKey="minutes" fill="url(#vybeBar)" radius={[4, 4, 2, 2]} />
                <defs>
                  <linearGradient id="vybeBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.55} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-card/50 p-4">
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            <Headphones className="size-3" /> {t("home.topArtists")}
          </p>
          <ul className="mt-3 space-y-2">
            {stats.topArtists.map(([artist, plays], index) => (
              <li key={artist} className="flex items-center gap-2.5">
                <span className="w-4 text-[11px] tabular-nums text-muted-foreground">{index + 1}</span>
                <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium">{artist}</span>
                <span className="flex items-center gap-1 text-[10.5px] text-muted-foreground">
                  <Clock3 className="size-3" />
                  {plays}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
