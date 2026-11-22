"use client";

import { use } from "react";
import { GENRES } from "@/lib/constants";
import { CollectionView } from "@/components/collection/collection-view";
import { useI18n } from "@/i18n/provider";

export default function GenrePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { t } = useI18n();
  const genre = GENRES.find((item) => item.slug === slug);
  const label = genre?.label ?? slug;

  return (
    <CollectionView
      endpoint={`/api/genre?slug=${encodeURIComponent(slug)}&limit=40`}
      title={label}
      subtitle={t("explore.genresSubtitle")}
      artworkSeed={label}
      kindLabel={t("search.genres")}
      badge={{ label: t("sources.jamendoLicense"), variant: "jamendo" }}
      backHref="/explore"
    />
  );
}
