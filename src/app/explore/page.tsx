import type { Metadata } from "next";
import { ExploreView } from "@/components/explore/explore-view";

export const metadata: Metadata = {
  title: "Explore",
  description: "Genres, moods and curated collections from licensed open catalogues.",
};

export default function ExplorePage() {
  return <ExploreView />;
}
