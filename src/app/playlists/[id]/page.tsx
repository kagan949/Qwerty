"use client";

import { use } from "react";
import { PlaylistDetail } from "@/components/playlist/playlist-detail";

export default function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <PlaylistDetail playlistId={id} />;
}
