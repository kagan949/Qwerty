"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, FileAudio, Loader2, ShieldCheck, UploadCloud, X } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { useLibraryStore } from "@/store/library-store";
import { useStorageEstimate } from "@/hooks/use-storage-estimate";
import { usePlayer } from "@/components/providers/player-provider";
import { Button } from "@/components/ui/button";
import { StorageMeter } from "@/components/library/storage-meter";
import { importAudioFile, uploadErrorMessage, UploadError } from "@/services/uploads";
import { MAX_UPLOAD_FILES, SUPPORTED_AUDIO_EXTENSIONS } from "@/lib/constants";
import { cn, formatBytes } from "@/lib/utils";
import { toast } from "@/lib/toast";
import type { Track } from "@/types";

interface QueueItem {
  id: string;
  fileName: string;
  status: "pending" | "reading" | "saving" | "done" | "error";
  error?: string;
}

export function UploadView() {
  const { t } = useI18n();
  const router = useRouter();
  const { playTrackList } = usePlayer();
  const refreshLocal = useLibraryStore((state) => state.refreshLocal);
  const localTracks = useLibraryStore((state) => state.localTracks);
  const { estimate } = useStorageEstimate();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [lastAdded, setLastAdded] = useState<Track[]>([]);
  const dragDepth = useRef(0);

  const processFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList).slice(0, MAX_UPLOAD_FILES);
      if (files.length === 0 || busy) return;
      setBusy(true);
      setLastAdded([]);
      const queue: QueueItem[] = files.map((file, index) => ({
        id: `${Date.now()}-${index}-${file.name}`,
        fileName: file.name,
        status: "pending",
      }));
      setItems(queue);

      const added: Track[] = [];
      let failed = 0;

      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        const queueId = queue[index].id;
        setItems((prev) => prev.map((item) => (item.id === queueId ? { ...item, status: "reading" } : item)));
        try {
          const result = await importAudioFile(file, (stage) => {
            setItems((prev) => prev.map((item) => (item.id === queueId ? { ...item, status: stage } : item)));
          });
          added.push(result.track);
          setItems((prev) => prev.map((item) => (item.id === queueId ? { ...item, status: "done" } : item)));
        } catch (error) {
          failed += 1;
          const code = error instanceof UploadError ? error.code : "unknown";
          setItems((prev) =>
            prev.map((item) =>
              item.id === queueId ? { ...item, status: "error", error: uploadErrorMessage(code) } : item,
            ),
          );
        }
      }

      await refreshLocal();
      setBusy(false);
      setLastAdded(added);
      if (added.length > 0) {
        toast.success(
          `${added.length} ${t("upload.summarized")}${failed ? ` · ${failed} ${t("upload.skipped")}` : ""}`,
          { id: "upload-done" },
        );
      } else if (failed > 0) {
        toast.error(t("toast.uploadFailed"), { id: "upload-failed" });
      }
    },
    [busy, refreshLocal, t],
  );

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    if (event.dataTransfer.files?.length) void processFiles(event.dataTransfer.files);
  };

  const remaining = estimate.supported ? formatBytes(Math.max(0, estimate.quota - estimate.usage)) : null;

  return (
    <div className="relative px-4 pt-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[280px] overflow-hidden opacity-60">
        <div className="aurora" />
      </div>

      <div className="relative">
        <h1 className="font-display text-[26px] font-extrabold tracking-[-0.03em] sm:text-[32px]">{t("upload.title")}</h1>
        <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-muted-foreground">{t("upload.subtitle")}</p>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div
              onDragEnter={(event) => {
                event.preventDefault();
                dragDepth.current += 1;
                setDragging(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={(event) => {
                event.preventDefault();
                dragDepth.current -= 1;
                if (dragDepth.current <= 0) setDragging(false);
              }}
              onDrop={handleDrop}
              className={cn(
                "relative overflow-hidden rounded-3xl border-2 border-dashed p-6 text-center transition-all sm:p-10",
                dragging
                  ? "border-primary bg-primary/10"
                  : "border-white/12 bg-card/30 hover:border-white/20 hover:bg-card/50",
              )}
            >
              <input
                ref={inputRef}
                type="file"
                multiple
                accept=".mp3,.wav,.flac,.m4a,.aac,.ogg,.oga,.opus,audio/*"
                className="sr-only"
                onChange={(event) => {
                  if (event.target.files) void processFiles(event.target.files);
                  event.target.value = "";
                }}
              />
              <motion.div
                animate={dragging ? { scale: 1.06, y: -4 } : { scale: 1, y: 0 }}
                className="mx-auto grid size-16 place-items-center rounded-2xl bg-[linear-gradient(140deg,#8b5cf6,#06b6d4)] shadow-[0_18px_50px_-18px_rgb(124_58_237/0.9)]"
              >
                <UploadCloud className="size-7 text-white" />
              </motion.div>
              <p className="mt-4 font-display text-lg font-bold tracking-tight">
                {dragging ? t("upload.dropActive") : t("upload.dropTitle")}
              </p>
              <p className="mx-auto mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-muted-foreground">{t("upload.dropHint")}</p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <Button variant="gradient" disabled={busy} onClick={() => inputRef.current?.click()}>
                  {busy ? <Loader2 className="size-4 animate-spin" /> : <FileAudio className="size-4" />}
                  {busy ? t("upload.uploading") : t("common.upload")}
                </Button>
                {remaining && (
                  <span className="text-[11.5px] text-muted-foreground">
                    {remaining} {t("library.storageUsed")} · {t("upload.maxSize")}
                  </span>
                )}
              </div>
              <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/80">
                <ShieldCheck className="size-3.5 text-emerald-400" />
                {t("upload.privacyNote")}
              </p>
            </div>

            <AnimatePresence>
              {items.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 overflow-hidden rounded-2xl border border-white/8 bg-card/40"
                >
                  <div className="flex items-center justify-between border-b border-white/6 px-4 py-2.5">
                    <p className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      {items.filter((item) => item.status === "done").length}/{items.length} {t("upload.complete").toLowerCase()}
                    </p>
                    {!busy && (
                      <button
                        type="button"
                        aria-label={t("common.clear")}
                        onClick={() => setItems([])}
                        className="rounded-full p-1 text-muted-foreground hover:bg-white/8 hover:text-foreground"
                      >
                        <X className="size-3.5" />
                      </button>
                    )}
                  </div>
                  <ul className="scrollbar-slim max-h-72 overflow-y-auto p-2">
                    {items.map((item) => (
                      <li key={item.id} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
                        <span className="grid size-7 shrink-0 place-items-center rounded-md bg-white/6">
                          {item.status === "done" ? (
                            <CheckCircle2 className="size-3.5 text-emerald-400" />
                          ) : item.status === "error" ? (
                            <AlertTriangle className="size-3.5 text-amber-400" />
                          ) : item.status === "pending" ? (
                            <FileAudio className="size-3.5 text-muted-foreground" />
                          ) : (
                            <Loader2 className="size-3.5 animate-spin text-primary" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12px] font-medium">{item.fileName}</span>
                          <span
                            className={cn(
                              "block text-[10.5px]",
                              item.status === "error" ? "text-amber-400" : "text-muted-foreground",
                            )}
                          >
                            {item.status === "done"
                              ? t("upload.complete")
                              : item.status === "error"
                                ? t(item.error ?? "upload.failed")
                                : item.status === "reading"
                                  ? t("upload.readingTags")
                                  : item.status === "saving"
                                    ? t("upload.saving")
                                    : t("upload.processing")}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                  {lastAdded.length > 0 && (
                    <div className="flex flex-wrap gap-2 border-t border-white/6 p-3">
                      <Button
                        size="sm"
                        variant="gradient"
                        onClick={() => {
                          void playTrackList(lastAdded, 0, "local");
                        }}
                      >
                        {t("common.play")} {lastAdded.length}
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => router.push("/library?tab=uploads")}>
                        {t("nav.library")}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => inputRef.current?.click()}>
                        {t("upload.addMore")}
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {localTracks.length > 0 && items.length === 0 && (
              <div className="mt-4 rounded-2xl border border-white/8 bg-card/40 p-4">
                <p className="text-[12px] font-semibold">{t("library.uploadsTitle")}</p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11.5px] text-muted-foreground">
                    {localTracks.length} {t("common.songs")}
                  </p>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      void playTrackList(localTracks, 0, "local");
                    }}
                  >
                    {t("library.playAll")}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-3">
            <StorageMeter />
            <div className="rounded-2xl border border-white/8 bg-card/40 p-4">
              <p className="text-[12px] font-semibold">{t("upload.whatYouGet")}</p>
              <ul className="mt-2 space-y-2 text-[11.5px] leading-relaxed text-muted-foreground">
                {[
                  [t("upload.feature1"), t("upload.feature1Desc")],
                  [t("upload.feature2"), t("upload.feature2Desc")],
                  [t("upload.feature3"), t("upload.feature3Desc")],
                ].map(([title, description]) => (
                  <li key={title} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />
                    <span>
                      <span className="block font-medium text-foreground/90">{title}</span>
                      {description}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-white/8 bg-card/40 p-4">
              <p className="text-[12px] font-semibold">{t("upload.supportedTitle")}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {SUPPORTED_AUDIO_EXTENSIONS.filter((ext) => ext !== "oga" && ext !== "m4b" && ext !== "mp4").map((ext) => (
                  <span key={ext} className="rounded-md bg-white/8 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-foreground/80">
                    {ext}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-[10.5px] text-muted-foreground">{t("upload.maxSize")}</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
