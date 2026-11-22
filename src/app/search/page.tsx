import { Suspense } from "react";
import type { Metadata } from "next";
import { SearchView } from "@/components/search/search-view";
import { SearchPageSkeleton } from "@/components/search/search-skeleton";

export const metadata: Metadata = {
  title: "Search",
  description: "Search 600,000+ free tracks, artists and albums, or your own uploaded music.",
};

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageSkeleton />}>
      <SearchView />
    </Suspense>
  );
}
