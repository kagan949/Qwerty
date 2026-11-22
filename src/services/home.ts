import type { HomePayload, HomeSection, SourceStatus } from "@/types";
import { jamendoNewReleases, jamendoTrending, jamendoArtists } from "@/services/jamendo";
import { archivePopular, archiveRecentlyAdded } from "@/services/archive";
import { MIXES, mixesToCurated } from "@/services/curated";

async function timed<T>(fn: () => Promise<T>): Promise<{ value: T | null; ms: number; error?: string }> {
  const start = Date.now();
  try {
    const value = await fn();
    return { value, ms: Date.now() - start };
  } catch (error) {
    return { value: null, ms: Date.now() - start, error: error instanceof Error ? error.message : "unknown" };
  }
}

export async function buildHomePayload(): Promise<HomePayload> {
  const [trending, fresh, artists, archiveAlbums, archiveNew] = await Promise.all([
    timed(() => jamendoTrending(18)),
    timed(() => jamendoNewReleases(18)),
    timed(() => jamendoArtists(10)),
    timed(() => archivePopular(10)),
    timed(() => archiveRecentlyAdded(8)),
  ]);

  const sources: SourceStatus[] = [
    {
      id: "jamendo",
      name: "Jamendo",
      ok: Boolean(trending.value?.length || artists.value?.length),
      latencyMs: trending.ms,
      error: trending.error,
      license: "Creative Commons",
      homepage: "https://www.jamendo.com",
    },
    {
      id: "archive",
      name: "Internet Archive",
      ok: Boolean(archiveAlbums.value?.length),
      latencyMs: archiveAlbums.ms,
      error: archiveAlbums.error,
      license: "Public domain / open licenses",
      homepage: "https://archive.org",
    },
  ];

  const sections: HomeSection[] = [];

  if (trending.value?.length) {
    sections.push({
      id: "for-you",
      title: "Made for you",
      subtitle: "Fresh picks from the open catalogue",
      kind: "tracks",
      items: trending.value,
    });
  }

  sections.push({
    id: "popular-mixes",
    title: "Popular mixes",
    subtitle: "Hand-tuned playlists for every mood",
    kind: "mixes",
    items: mixesToCurated(MIXES.slice(0, 6)),
  });

  if (archiveAlbums.value?.length) {
    sections.push({
      id: "new-releases",
      title: "New releases",
      subtitle: "Just landed from independent artists",
      kind: "albums",
      items: archiveAlbums.value,
    });
  }

  if (fresh.value?.length) {
    sections.push({
      id: "fresh-jamendo",
      title: "Recent arrivals",
      subtitle: "The newest uploads from Jamendo artists",
      kind: "tracks",
      items: fresh.value,
    });
  }

  if (artists.value?.length) {
    sections.push({
      id: "favorite-artists",
      title: "Favorite artists",
      subtitle: "Voices shaping the open catalogue",
      kind: "artists",
      items: artists.value,
    });
  }

  if (archiveNew.value?.length) {
    sections.push({
      id: "archive-discoveries",
      title: "Archive discoveries",
      subtitle: "Rare recordings from public collections",
      kind: "tracks",
      items: archiveNew.value,
    });
  }

  return { sections, sources, generatedAt: Date.now() };
}
