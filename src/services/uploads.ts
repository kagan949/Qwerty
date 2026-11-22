import { getDb, type LocalTrackRecord } from "@/database/db";
import { parseAudioMetadata, probeDuration } from "@/services/metadata";
import { MAX_UPLOAD_BYTES, SUPPORTED_AUDIO_EXTENSIONS, SUPPORTED_AUDIO_MIMES } from "@/lib/constants";
import { localRecordToTrack } from "@/database/local-tracks";
import { uid } from "@/lib/utils";
import type { Track } from "@/types";

export type UploadErrorCode =
  | "unsupported"
  | "too_large"
  | "empty"
  | "duplicate"
  | "quota"
  | "unknown";

export class UploadError extends Error {
  constructor(readonly code: UploadErrorCode) {
    super(code);
    this.name = "UploadError";
  }
}

export interface UploadResult {
  track: Track;
  record: LocalTrackRecord;
}

export function validateAudioFile(file: File): void {
  if (file.size === 0) throw new UploadError("empty");
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError("too_large");
  const lower = file.name.toLowerCase();
  const extensionOk = SUPPORTED_AUDIO_EXTENSIONS.some((ext) => lower.endsWith(`.${ext}`));
  // Some browsers report an empty type for FLAC/Opus; only reject when the
  // MIME is present *and* clearly not audio.
  const typeOk = !file.type || file.type.startsWith("audio/") || (SUPPORTED_AUDIO_MIMES as readonly string[]).includes(file.type);
  if (!extensionOk && !typeOk) throw new UploadError("unsupported");
}

/** Cheap content fingerprint: name + size + mtime. Prevents duplicate imports. */
function fingerprint(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

export async function importAudioFile(
  file: File,
  onStage?: (stage: "reading" | "saving") => void,
): Promise<UploadResult> {
  validateAudioFile(file);
  const database = getDb();
  const existing = await database.localTracks.toCollection().toArray();
  if (existing.some((record) => fingerprint(file) === `${record.fileName}:${record.fileSize}:0` || record.fileHash === fingerprint(file))) {
    throw new UploadError("duplicate");
  }

  onStage?.("reading");
  const metadata = await parseAudioMetadata(file);
  let duration = metadata.duration;
  if (!duration) duration = await probeDuration(file);

  const id = uid();
  const now = Date.now();
  const record: LocalTrackRecord = {
    id,
    title: metadata.title || file.name.replace(/\.[^.]+$/, ""),
    artist: metadata.artist || "",
    album: metadata.album,
    genre: metadata.genre,
    year: metadata.year,
    duration,
    blob: file,
    mimeType: file.type || mimeFromExtension(file.name),
    fileName: file.name,
    fileSize: file.size,
    cover: metadata.cover,
    addedAt: now,
    updatedAt: now,
    fileHash: fingerprint(file),
  };

  onStage?.("saving");
  try {
    await database.localTracks.put(record);
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (name === "QuotaExceededError" || name === "AbortError") throw new UploadError("quota");
    throw new UploadError("unknown");
  }

  return { track: localRecordToTrack(record), record };
}

function mimeFromExtension(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "mp3":
      return "audio/mpeg";
    case "wav":
      return "audio/wav";
    case "flac":
      return "audio/flac";
    case "m4a":
    case "m4b":
    case "mp4":
      return "audio/mp4";
    case "aac":
      return "audio/aac";
    case "ogg":
    case "oga":
      return "audio/ogg";
    case "opus":
      return "audio/opus";
    default:
      return "audio/mpeg";
  }
}

export function uploadErrorMessage(code: UploadErrorCode): string {
  switch (code) {
    case "unsupported":
      return "upload.unsupported";
    case "too_large":
      return "upload.tooLarge";
    case "empty":
      return "upload.emptyFile";
    case "duplicate":
      return "upload.duplicate";
    case "quota":
      return "upload.quotaExceeded";
    default:
      return "upload.failed";
  }
}
