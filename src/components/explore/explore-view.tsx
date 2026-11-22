"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import { Compass, Disc3, Music4, Sparkles } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { SectionHeader } from "@/components/layout/section-header";
import { MixCard } from "@/components/music/mix-card";
import { AlbumCard } from "@/components/music/album-card";
import { CardGridSkeleton, Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ExplorePayload } from "@/types";

async function fetchExplore(): Promise<ExplorePayload> {
  const response = await fetch("/api/explore", { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error("explore_failed");
  return (await response.json()) as ExplorePayload;
}

export function ExploreView() {
  const { t } = useI18n();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["explore"],
    queryFn: fetchExplore,
    staleTime: 10 * 60_000,
  });

  return (
    <div className="relative px-4 pt-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[340px] overflow-hidden">
        <div className="aurora opacity-60" />
        <div className="grid-backdrop absolute inset-0" />
      </div>

      <div className="relative">
        <div className="flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          <Compass className="size-3.5 text-primary" /> {t("explore.nowStreaming")}
        </div>
        <h1 className="mt-2 font-display text-[28px] font-extrabold tracking-[-0.035em] sm:text-[36px]">
          {t("explore.title")}
        </h1>
        <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-muted-foreground">{t("explore.subtitle")}</p>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-7"
        >
          <SectionHeader title={t("explore.genresTitle")} subtitle={t("explore.genresSubtitle")} />
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {isLoading
              ? Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="h-[92px] rounded-2xl" />)
              : data?.genres.map((genre) => (
                  <Link
                    key={genre.slug}
                    href={`/genre/${genre.slug}`}
                    className={cn(
                      "group relative flex h-[92px] items-end overflow-hidden rounded-2xl bg-gradient-to-br p-3.5",
                      "border border-white/8 transition-transform duration-300 hover:-translate-y-0.5",
                      genre.accent,
                    )}
                  >
                    <span className="absolute inset-0 bg-[linear-gradient(160deg,rgba(0,0,0,0.05),rgba(0,0,0,0.45))]" />
                    <span className="relative">
                      <span className="block font-display text-[15px] font-bold tracking-tight text-white">{genre.label}</span>
                      <span className="mt-0.5 block text-[10.5px] font-medium uppercase tracking-wider text-white/70">
                        {genre.source === "jamendo" ? t("sources.jamendoLicense") : t("sources.archiveLicense")}
                      </span>
                    </span>
                    <Music4 className="absolute right-3 top-3 size-4 text-white/50 transition-transform duration-300 group-hover:scale-110" />
                  </Link>
                ))}
          </div>
        </motion.section>

        <section className="mt-9">
          <SectionHeader title={t("explore.mixTitle")} subtitle={t("explore.mixSubtitle")} />
          <div className="scrollbar-none -mx-1 mt-4 flex gap-3 overflow-x-auto px-1 pb-1">
            {isLoading ? (
              <CardGridSkeleton count={4} />
            ) : (
              data?.mixes.map((mix) => <MixCard key={mix.id} mix={mix} className="min-w-[240px]" />)
            )}
          </div>
        </section>

        <section className="mt-9">
          <SectionHeader title={t("explore.collectionsTitle")} subtitle={t("explore.collectionsSubtitle")} />
          {isError ? (
            <p className="mt-4 rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-[12.5px] text-amber-200">
              {t("errors.sourceUnavailableHint")}
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
              {isLoading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="space-y-2">
                      <Skeleton className="aspect-square rounded-2xl" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  ))
                : data?.collections.map((album) => <AlbumCard key={album.id} album={album} />)}
            </div>
          )}
        </section>

        <section className="mt-10 rounded-3xl border border-white/8 bg-[linear-gradient(120deg,rgba(139,92,246,0.14),rgba(34,211,238,0.08))] p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="jamendo">Creative Commons</Badge>
            <Badge variant="archive">Public domain</Badge>
            <Badge variant="outline">{t("explore.openSource")}</Badge>
          </div>
          <p className="mt-3 max-w-3xl text-[12px] leading-relaxed text-muted-foreground">{t("explore.licensedNote")}</p>
          <div className="mt-4 flex flex-wrap gap-3 text-[11.5px]">
            <Link href="https://www.jamendo.com" target="_blank" rel="noreferrer noopener" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
              <Sparkles className="size-3" /> {t("credits.jamendo")}
            </Link>
            <Link href="https://archive.org" target="_blank" rel="noreferrer noopener" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
              <Disc3 className="size-3" /> {t("credits.archive")}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
