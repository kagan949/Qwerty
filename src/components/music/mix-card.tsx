"use client";

import Link from "next/link";
import { CoverImage } from "@/components/music/artwork";
import { Play } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import type { CuratedMix } from "@/types";

export function MixCard({ mix, className }: { mix: CuratedMix; className?: string }) {
  const { t } = useI18n();
  return (
    <Link
      href={`/mix/${mix.id}`}
      className={cn(
        "group relative flex min-w-[220px] max-w-[280px] flex-col overflow-hidden rounded-2xl border border-white/8 p-4",
        "bg-[linear-gradient(160deg,rgba(139,92,246,0.16),rgba(255,255,255,0.02)_55%)]",
        "transition-all duration-300 hover:border-white/16 hover:shadow-[0_24px_60px_-30px_rgb(124_58_237/0.9)]",
        className,
      )}
    >
      <CoverImage
        src={mix.artwork}
        seed={mix.name}
        rounded="rounded-xl"
        className="aspect-square w-full"
        alt={mix.name}
      />
      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold">{mix.name}</p>
          <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-relaxed text-muted-foreground">{mix.description}</p>
        </div>
        <span
          className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-foreground/10 text-foreground transition-all group-hover:bg-primary group-hover:text-white group-hover:shadow-[0_8px_24px_-8px_rgb(124_58_237/0.9)]"
          aria-label={t("common.play")}
        >
          <Play className="size-3.5 translate-x-px fill-current" />
        </span>
      </div>
    </Link>
  );
}
