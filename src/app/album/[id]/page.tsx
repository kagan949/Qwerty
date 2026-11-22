"use client";

import { use, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CollectionView } from "@/components/collection/collection-view";
import { useI18n } from "@/i18n/provider";
import { Skeleton } from "@/components/ui/skeleton";

function AlbumInner({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const title = searchParams.get("title") ?? "Album";
  const artist = searchParams.get("artist") ?? "";
  const isArchive = id.startsWith("archive-item:");
  const query = useMemo(() => {
    const params = new URLSearchParams({ id });
    if (title) params.set("title", title);
    if (artist) params.set("artist", artist);
    return params.toString();
  }, [artist, id, title]);

  return (
    <CollectionView
      endpoint={`/api/album?${query}`}
      title={title}
      subtitle={artist}
      artworkSeed={`${artist}-${title}`}
      kindLabel={t("common.album")}
      badge={
        isArchive
          ? { label: t("sources.archiveLicense"), variant: "archive" }
          : { label: t("sources.jamendoLicense"), variant: "jamendo" }
      }
      backHref="/search"
    />
  );
}

export default function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={<div className="p-6"><Skeleton className="h-52 w-full rounded-2xl" /></div>}>
      <AlbumInner id={id} />
    </Suspense>
  );
}
