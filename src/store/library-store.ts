"use client";

import { create } from "zustand";
import type { Track } from "@/types";
import { listFavorites, toggleFavorite as toggleFavoriteDb } from "@/database/favorites";
import { listLocalTracks } from "@/database/local-tracks";
import { listPlaylists } from "@/database/playlists";
import { listRecentPlays } from "@/database/history";
import type { Playlist, RecentPlay } from "@/types";

export interface LibraryState {
  hydrated: boolean;
  favorites: Track[];
  favoriteIds: Set<string>;
  localTracks: Track[];
  playlists: Playlist[];
  recent: RecentPlay[];
  loading: boolean;
  refreshAll: () => Promise<void>;
  refreshFavorites: () => Promise<void>;
  refreshLocal: () => Promise<void>;
  refreshPlaylists: () => Promise<void>;
  refreshRecent: () => Promise<void>;
  toggleFavorite: (track: Track) => Promise<boolean>;
  isFavorite: (trackId: string) => boolean;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  hydrated: false,
  favorites: [],
  favoriteIds: new Set(),
  localTracks: [],
  playlists: [],
  recent: [],
  loading: false,
  refreshFavorites: async () => {
    const favorites = await listFavorites();
    set({ favorites, favoriteIds: new Set(favorites.map((track) => track.id)) });
  },
  refreshLocal: async () => {
    const localTracks = await listLocalTracks();
    set({ localTracks });
  },
  refreshPlaylists: async () => {
    const playlists = await listPlaylists();
    set({ playlists });
  },
  refreshRecent: async () => {
    const recent = await listRecentPlays(12);
    set({ recent });
  },
  refreshAll: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const [favorites, localTracks, playlists, recent] = await Promise.all([
        listFavorites(),
        listLocalTracks(),
        listPlaylists(),
        listRecentPlays(12),
      ]);
      set({
        favorites,
        favoriteIds: new Set(favorites.map((track) => track.id)),
        localTracks,
        playlists,
        recent,
        hydrated: true,
      });
    } catch {
      set({ hydrated: true });
    } finally {
      set({ loading: false });
    }
  },
  toggleFavorite: async (track) => {
    const added = await toggleFavoriteDb(track);
    await get().refreshFavorites();
    return added;
  },
  isFavorite: (trackId) => get().favoriteIds.has(trackId),
}));
