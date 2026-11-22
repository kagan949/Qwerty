"use client";

import { use, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CollectionView } from "@/components/collection/collection-view";
import { useI18n } from "@/i18n/provider";
import { Skeleton } from "@/components/ui/skeleton";

function ArtistInner({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const name = searchParams.get("name") ?? "";
  const query = useMemo(() => {
    const params = new URLSearchParams({ id });
    if (name) params.set("name", name);
    return params.toString();
  }, [id, name]);

  return (
    <CollectionView
      endpoint={`/api/artist?${query}`}
      title={name || "Artist"}
      subtitle={t("home.favoriteArtists")}
      artworkSeed={name || id}
      kindLabel={t("common.artist")}
      backHref="/search"
    />
  );
}

export default function ArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={<div className="p-6"><Skeleton className="h-52 w-full rounded-2xl" /></div>}>
      <ArtistInner id={id} />
    </Suspense>
  );
}
