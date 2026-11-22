import { HomeView } from "@/components/home/home-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VYBE — Free music streaming",
  description:
    "Stream millions of legally licensed tracks, build playlists and upload your own music. No account needed.",
};

export default function HomePage() {
  return <HomeView />;
}
