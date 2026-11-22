"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ImagePlus, Trash2 } from "lucide-react";
import { useUiStore } from "@/store/ui-store";
import { useLibraryStore } from "@/store/library-store";
import { useI18n } from "@/i18n/provider";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getLocalRecord, updateLocalTrack } from "@/database/local-tracks";
import { toast } from "@/lib/toast";
import { formatBytes } from "@/lib/utils";

const schema = z.object({
  title: z.string().trim().min(1).max(200),
  artist: z.string().trim().max(200),
  album: z.string().trim().max(200),
  genre: z.string().trim().max(80),
  year: z.string().trim().max(4).optional(),
});

type FormValues = z.infer<typeof schema>;

export function EditTrackDialog() {
  const { t } = useI18n();
  const track = useUiStore((state) => state.editTrack);
  const setTrack = useUiStore((state) => state.openEditTrack);
  const refreshLocal = useLibraryStore((state) => state.refreshLocal);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [coverPreview, setCoverPreview] = useState<string | undefined>();
  const [pendingCover, setPendingCover] = useState<{ blob: Blob; url: string } | null>(null);

  const { register, handleSubmit, reset } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!track?.localId) return;
    let revoked: string | undefined;
    void (async () => {
      const record = await getLocalRecord(track.localId as string);
      if (!record) return;
      reset({
        title: record.title,
        artist: record.artist,
        album: record.album ?? "",
        genre: record.genre ?? "",
        year: record.year ? String(record.year) : "",
      });
      setFileName(record.fileName);
      setFileSize(record.fileSize);
      if (record.cover) {
        revoked = URL.createObjectURL(record.cover);
        setCoverPreview(revoked);
      }
    })();
    return () => {
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [reset, track]);

  if (!track?.localId) return null;
  const localId = track.localId;

  const pickCover = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      toast.error(t("playlist.coverTooLarge"));
      return;
    }
    const url = URL.createObjectURL(file);
    setPendingCover({ blob: file, url });
    setCoverPreview(url);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && setTrack(null)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("library.editTrackTitle")}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(async (values) => {
            try {
              await updateLocalTrack(localId, {
                title: values.title,
                artist: values.artist,
                album: values.album || undefined,
                genre: values.genre || undefined,
                year: values.year ? Number(values.year) || undefined : undefined,
                ...(pendingCover ? { cover: pendingCover.blob } : {}),
              });
              await refreshLocal();
              toast.success(t("library.trackUpdated"));
              setTrack(null);
            } catch {
              toast.error(t("toast.saveFailed"));
            }
          })}
          className="mt-4 space-y-4"
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              {coverPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverPreview} alt="" className="size-20 rounded-xl object-cover" />
              ) : (
                <div className="grid size-20 place-items-center rounded-xl bg-white/6 text-muted-foreground">
                  <ImagePlus className="size-6" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-medium">{fileName}</p>
              <p className="text-[11px] text-muted-foreground">{formatBytes(fileSize)}</p>
              <div className="mt-2 flex gap-2">
                <label className="cursor-pointer rounded-full border border-white/10 px-2.5 py-1 text-[11px] transition-colors hover:bg-white/8">
                  {t("playlist.changeCover")}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => pickCover(event.target.files?.[0])}
                  />
                </label>
                {pendingCover && (
                  <button
                    type="button"
                    className="flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-red-400 transition-colors hover:bg-red-500/10"
                    onClick={() => {
                      URL.revokeObjectURL(pendingCover.url);
                      setPendingCover(null);
                      setCoverPreview(undefined);
                    }}
                  >
                    <Trash2 className="size-3" /> {t("playlist.removeCover")}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("common.title")}>
              <input {...register("title")} className={inputClass} />
            </Field>
            <Field label={t("common.artist")}>
              <input {...register("artist")} className={inputClass} />
            </Field>
            <Field label={t("common.album")}>
              <input {...register("album")} className={inputClass} />
            </Field>
            <Field label={t("search.genres")}>
              <input {...register("genre")} className={inputClass} />
            </Field>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setTrack(null)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" variant="gradient">
              {t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const inputClass =
  "h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-[13px] outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/25";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11.5px] font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
