"use client";

import dynamic from "next/dynamic";
import { AddToPlaylistDialog } from "@/components/music/add-to-playlist-dialog";

/**
 * Modals that can be opened from anywhere (track menus, sidebar, settings).
 * Code-split so their form/decompression dependencies never block first paint.
 */
const CreatePlaylistDialog = dynamic(
  () => import("@/components/music/create-playlist-dialog").then((mod) => mod.CreatePlaylistDialog),
  { ssr: false },
);
const EditTrackDialog = dynamic(
  () => import("@/components/library/edit-track-dialog").then((mod) => mod.EditTrackDialog),
  { ssr: false },
);

export function GlobalModals() {
  return (
    <>
      <AddToPlaylistDialog />
      <CreatePlaylistDialog />
      <EditTrackDialog />
    </>
  );
}
