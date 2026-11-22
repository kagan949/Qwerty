"use client";

import { use } from "react";
import { CollectionView } from "@/components/collection/collection-view";
import { MIXES } from "@/services/curated";
import { useI18n } from "@/i18n/provider";

export default function MixPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useI18n();
  const mix = MIXES.find((item) => item.id === id);

  return (
    <CollectionView
      endpoint={`/api/mix?id=${encodeURIComponent(id)}`}
      title={mix?.name ?? "Mix"}
      subtitle={mix?.description}
      artworkSeed={mix?.name ?? id}
      artworkUrl={mix?.artwork}
      kindLabel={t("explore.mixTitle")}
      badge={
        mix?.source === "archive"
          ? { label: t("sources.archiveLicense"), variant: "archive" }
          : { label: t("sources.jamendoLicense"), variant: "jamendo" }
      }
      backHref="/explore"
    />
  );
}
