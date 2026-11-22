"use client";

import { create } from "zustand";
import type { Track } from "@/types";

interface ContextMenuState {
  track: Track | null;
  x: number;
  y: number;
}

interface UiState {
  sidebarOpen: boolean;
  mobileNavVisible: boolean;
  installPromptVisible: boolean;
  online: boolean;
  addToPlaylistTrack: Track | null;
  editTrack: Track | null;
  createPlaylistOpen: boolean;
  keyboardHelpOpen: boolean;
  contextMenu: ContextMenuState;
  setSidebarOpen: (open: boolean) => void;
  setInstallPromptVisible: (visible: boolean) => void;
  setOnline: (online: boolean) => void;
  openAddToPlaylist: (track: Track | null) => void;
  openEditTrack: (track: Track | null) => void;
  setCreatePlaylistOpen: (open: boolean) => void;
  setKeyboardHelpOpen: (open: boolean) => void;
  openContextMenu: (track: Track, x: number, y: number) => void;
  closeContextMenu: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  mobileNavVisible: true,
  installPromptVisible: false,
  online: true,
  addToPlaylistTrack: null,
  editTrack: null,
  createPlaylistOpen: false,
  keyboardHelpOpen: false,
  contextMenu: { track: null, x: 0, y: 0 },
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setInstallPromptVisible: (installPromptVisible) => set({ installPromptVisible }),
  setOnline: (online) => set({ online }),
  openAddToPlaylist: (track) => set({ addToPlaylistTrack: track }),
  openEditTrack: (track) => set({ editTrack: track }),
  setCreatePlaylistOpen: (createPlaylistOpen) => set({ createPlaylistOpen }),
  setKeyboardHelpOpen: (keyboardHelpOpen) => set({ keyboardHelpOpen }),
  openContextMenu: (track, x, y) => set({ contextMenu: { track, x, y } }),
  closeContextMenu: () => set({ contextMenu: { track: null, x: 0, y: 0 } }),
}));
