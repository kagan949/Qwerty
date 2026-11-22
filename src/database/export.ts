import { getDb } from "@/database/db";
import type { PlaylistRecord } from "@/database/db";
import type { Track } from "@/types";
import { unzipSync, zipSync, strToU8, strFromU8 } from "fflate";
import { uid } from "@/lib/utils";

export interface LibraryBackupMeta {
  app: "vybe";
  version: 1 | 2;
  exportedAt: string;
  includesAudio: boolean;
  counts: {
    localTracks: number;
    playlists: number;
    favorites: number;
    settings: number;
  };
}

export interface ParsedBackup {
  meta: LibraryBackupMeta;
  localTracks: {
    id: string;
    title: string;
    artist: string;
    album?: string;
    genre?: string;
    year?: number;
    duration: number;
    mimeType: string;
    fileName: string;
    fileSize: number;
    addedAt: number;
    updatedAt: number;
    file?: Uint8Array;
    cover?: Uint8Array;
    coverType?: string;
  }[];
  playlists: Omit<PlaylistRecord, "cover">[];
  favorites: Track[];
  settings: { key: string; value: unknown }[];
}

/** JSON backup — metadata and settings only. Audio is intentionally excluded. */
export async function exportLibraryJson(): Promise<{ blob: Blob; meta: LibraryBackupMeta }> {
  const database = getDb();
  const [localTracks, playlists, favorites, settings] = await Promise.all([
    database.localTracks.toArray(),
    database.playlists.toArray(),
    database.favorites.toArray(),
    database.settings.toArray(),
  ]);
  const meta: LibraryBackupMeta = {
    app: "vybe",
    version: 1,
    exportedAt: new Date().toISOString(),
    includesAudio: false,
    counts: {
      localTracks: localTracks.length,
      playlists: playlists.length,
      favorites: favorites.length,
      settings: settings.length,
    },
  };
  const payload = {
    meta,
    localTracks: localTracks.map(({ blob, cover, ...rest }) => { void blob; void cover; return rest; }),
    playlists: playlists.map(({ cover, ...rest }) => { void cover; return rest; }),
    favorites: favorites.map((row) => row.track),
    settings: settings.map(({ key, value }) => ({ key, value })),
  };
  return { blob: new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }), meta };
}

/** Full backup including audio bytes, zipped. */
export async function exportLibraryFull(): Promise<{ blob: Blob; meta: LibraryBackupMeta }> {
  const database = getDb();
  const [localTracks, playlists, favorites, settings] = await Promise.all([
    database.localTracks.toArray(),
    database.playlists.toArray(),
    database.favorites.toArray(),
    database.settings.toArray(),
  ]);
  const files: Record<string, Uint8Array> = {};
  for (const row of localTracks) {
    files[`audio/${row.id}.bin`] = new Uint8Array(await row.blob.arrayBuffer());
    if (row.cover) files[`covers/${row.id}.bin`] = new Uint8Array(await row.cover.arrayBuffer());
  }
  const meta: LibraryBackupMeta = {
    app: "vybe",
    version: 2,
    exportedAt: new Date().toISOString(),
    includesAudio: true,
    counts: {
      localTracks: localTracks.length,
      playlists: playlists.length,
      favorites: favorites.length,
      settings: settings.length,
    },
  };
  files["meta.json"] = strToU8(
    JSON.stringify(
      {
        meta,
        localTracks: localTracks.map(({ blob, cover, ...rest }) => {
          // The ZIP branch copies audio as separate files; the JSON keeps only
          // metadata and the cover's MIME type.
          void blob;
          return { ...rest, coverType: cover?.type };
        }),
        playlists: playlists.map(({ cover, ...rest }) => { void cover; return rest; }),
        favorites: favorites.map((row) => row.track),
        settings: settings.map(({ key, value }) => ({ key, value })),
      },
      null,
      2,
    ),
  );
  const zipped = zipSync(files, { level: 0 });
  return { blob: new Blob([zipped as BlobPart], { type: "application/zip" }), meta };
}

export async function parseBackupFile(file: File): Promise<ParsedBackup> {
  if (file.size > 2 * 1024 * 1024 * 1024) throw new Error("backup_too_large");
  const name = file.name.toLowerCase();
  const buffer = new Uint8Array(await file.arrayBuffer());
  if (name.endsWith(".zip") || (buffer[0] === 0x50 && buffer[1] === 0x4b)) {
    const entries = unzipSync(buffer);
    const metaRaw = entries["meta.json"];
    if (!metaRaw) throw new Error("backup_invalid");
    const parsed = JSON.parse(strFromU8(metaRaw));
    return {
      ...parsed,
      localTracks: (parsed.localTracks ?? []).map((row: ParsedBackup["localTracks"][number]) => ({
        ...row,
        file: entries[`audio/${row.id}.bin`],
        cover: entries[`covers/${row.id}.bin`],
      })),
    } as ParsedBackup;
  }
  const parsed = JSON.parse(strFromU8(buffer));
  if (parsed?.meta?.app !== "vybe") throw new Error("backup_invalid");
  return { ...parsed, localTracks: parsed.localTracks ?? [] } as ParsedBackup;
}

export async function importBackup(
  backup: ParsedBackup,
  options: { replace?: boolean } = {},
): Promise<{ localTracks: number; playlists: number; favorites: number; settings: number }> {
  const database = getDb();
  const counts = { localTracks: 0, playlists: 0, favorites: 0, settings: 0 };
  await database.transaction(
    "rw",
    [database.localTracks, database.playlists, database.favorites, database.settings],
    async () => {
      if (options.replace) {
        await Promise.all([
          database.localTracks.clear(),
          database.playlists.clear(),
          database.favorites.clear(),
          database.settings.clear(),
        ]);
      }
      for (const row of backup.localTracks ?? []) {
        if (!row.file) continue;
        const cover = row.cover
          ? new Blob([row.cover as BlobPart], { type: row.coverType || "image/jpeg" })
          : undefined;
        const id = row.id || uid();
        await database.localTracks.put({
          ...row,
          id,
          blob: new Blob([row.file as BlobPart], { type: row.mimeType || "audio/mpeg" }),
          cover,
          fileSize: row.file.byteLength,
        });
        counts.localTracks += 1;
      }
      for (const playlist of backup.playlists ?? []) {
        await database.playlists.put(playlist);
        counts.playlists += 1;
      }
      for (const track of backup.favorites ?? []) {
        await database.favorites.put({ id: track.id, addedAt: Date.now(), track });
        counts.favorites += 1;
      }
      for (const setting of backup.settings ?? []) {
        await database.settings.put({ key: setting.key, value: setting.value, updatedAt: Date.now() });
        counts.settings += 1;
      }
    },
  );
  return counts;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
