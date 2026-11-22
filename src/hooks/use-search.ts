"use client";

import { useQuery } from "@tanstack/react-query";
import type { SearchResults } from "@/types";
import { readCache, writeCache } from "@/database/cache";

async function fetchSearch(query: string): Promise<SearchResults> {
  const cached = await readCache<SearchResults>(`search:${query.toLowerCase()}`);
  if (cached) return cached;
  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
    headers: { accept: "application/json" },
  });
  if (response.status === 429) throw new Error("rate_limited");
  if (!response.ok) throw new Error(`search_${response.status}`);
  const data = (await response.json()) as SearchResults;
  const anyOk = data.sources.some((source) => source.ok);
  if (anyOk) await writeCache(`search:${query.toLowerCase()}`, data, 5 * 60_000);
  return data;
}

export function useCatalogSearch(query: string, enabled = true) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => fetchSearch(query),
    enabled: enabled && query.trim().length >= 2,
    staleTime: 2 * 60_000,
    retry: 1,
    placeholderData: (previous) => previous,
  });
}
