import type { CuratedMix, Genre } from "@/types";
import { GENRES } from "@/lib/constants";

/**
 * Curated mixes are *real queries* against the licensed catalogues, not
 * hard-coded fake tracks. The definitions below describe how each mix is built
 * (a Jamendo tag query or an Internet Archive collection), and the API layer
 * resolves them live.
 */
export interface MixDefinition {
  id: string;
  name: string;
  description: string;
  artwork: string;
  accent: string;
  source: "jamendo" | "archive";
  query: { tag?: string; archiveQuery?: string };
}

export const MIXES: MixDefinition[] = [
  {
    id: "late-night-drive",
    name: "Late Night Drive",
    description: "Neon-lit synths and slow-burning electronica for empty highways.",
    artwork: "/images/mix-late-night.svg",
    accent: "#8b5cf6",
    source: "jamendo",
    query: { tag: "electronic" },
  },
  {
    id: "focus-flow",
    name: "Focus Flow",
    description: "Calm, lyric-free textures that keep your head in the game.",
    artwork: "/images/mix-focus.svg",
    accent: "#22d3ee",
    source: "jamendo",
    query: { tag: "ambient" },
  },
  {
    id: "sunday-morning",
    name: "Sunday Morning",
    description: "Warm acoustics and soft folk for slow coffee and sunlight.",
    artwork: "/images/mix-sunday.svg",
    accent: "#f59e0b",
    source: "jamendo",
    query: { tag: "folk" },
  },
  {
    id: "after-hours",
    name: "After Hours",
    description: "Smoky jazz standards from the open catalogue.",
    artwork: "/images/mix-after-hours.svg",
    accent: "#3b82f6",
    source: "jamendo",
    query: { tag: "jazz" },
  },
  {
    id: "archive-gold",
    name: "Archive Gold",
    description: "Restored 78s and rare shellac transfers in the public domain.",
    artwork: "/images/mix-archive.svg",
    accent: "#ec4899",
    source: "archive",
    query: { archiveQuery: "collection:78rpm" },
  },
  {
    id: "indie-spotlight",
    name: "Indie Spotlight",
    description: "Netlabels pushing left-field pop, rock and everything between.",
    artwork: "/images/mix-indie.svg",
    accent: "#22c55e",
    source: "archive",
    query: { archiveQuery: "collection:netlabels" },
  },
  {
    id: "cinematic-moods",
    name: "Cinematic Moods",
    description: "Sweeping soundtrack cues for your main-character moments.",
    artwork: "/images/mix-cinematic.svg",
    accent: "#a855f7",
    source: "jamendo",
    query: { tag: "soundtrack" },
  },
  {
    id: "global-rhythms",
    name: "Global Rhythms",
    description: "Afrobeat, reggae and Latin grooves from around the world.",
    artwork: "/images/mix-global.svg",
    accent: "#14b8a6",
    source: "jamendo",
    query: { tag: "reggae" },
  },
];

export function mixesToCurated(defs: MixDefinition[] = MIXES): CuratedMix[] {
  return defs.map((mix) => ({
    id: mix.id,
    name: mix.name,
    description: mix.description,
    artwork: mix.artwork,
    accent: mix.accent,
    source: mix.source,
  }));
}

export function getMix(id: string): MixDefinition | undefined {
  return MIXES.find((mix) => mix.id === id);
}

export function genresWithMix(): (Genre & { artwork: string })[] {
  return GENRES.map((genre, index) => ({
    ...genre,
    artwork: MIXES[index % MIXES.length].artwork,
  }));
}

export const GENRE_TAGS: Record<string, string> = {
  electronic: "electronic",
  chill: "chillout",
  hiphop: "hiphop",
  rock: "rock",
  pop: "pop",
  jazz: "jazz",
  classical: "classical",
  folk: "folk",
  metal: "metal",
  reggae: "reggae",
  soundtrack: "soundtrack",
  ambient: "ambient",
};
