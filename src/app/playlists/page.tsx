import { Suspense } from "react";
import type { Metadata } from "next";
import { PlaylistsView } from "@/components/playlist/playlists-view";
import { CardGridSkeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Playlists",
  description: "Create, rename and organise playlists — stored on your device.",
};

export default function PlaylistsPage() {
  return (
    <Suspense fallback={<div className="p-6"><CardGridSkeleton count={6} /></div>}>
      <PlaylistsView />
    </Suspense>
  );
}
