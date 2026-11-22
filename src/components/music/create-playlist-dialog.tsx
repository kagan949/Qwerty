"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUiStore } from "@/store/ui-store";
import { useLibraryStore } from "@/store/library-store";
import { useI18n } from "@/i18n/provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createPlaylist } from "@/database/playlists";
import { toast } from "@/lib/toast";

const schema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(240).optional(),
});

type FormValues = z.infer<typeof schema>;

export function CreatePlaylistDialog() {
  const { t } = useI18n();
  const open = useUiStore((state) => state.createPlaylistOpen);
  const setOpen = useUiStore((state) => state.setCreatePlaylistOpen);
  const refreshPlaylists = useLibraryStore((state) => state.refreshPlaylists);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: "", description: "" } });

  useEffect(() => {
    if (open) reset({ name: "", description: "" });
  }, [open, reset]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("playlist.createTitle")}</DialogTitle>
          <DialogDescription>{t("playlist.descriptionPlaceholderShort")}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(async (values) => {
            try {
              await createPlaylist(values.name, values.description || undefined);
              await refreshPlaylists();
              toast.success(t("playlist.createSuccess"));
              setOpen(false);
            } catch {
              toast.error(t("toast.saveFailed"));
            }
          })}
          className="mt-4 space-y-4"
        >
          <div>
            <label htmlFor="playlist-name" className="mb-1.5 block text-[12px] font-medium text-muted-foreground">
              {t("playlist.name")}
            </label>
            <input
              id="playlist-name"
              {...register("name")}
              autoFocus
              placeholder={t("playlist.namePlaceholder")}
              className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 text-[13.5px] outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/25"
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name && <p className="mt-1.5 text-[11.5px] text-red-400">{t("playlist.nameRequired")}</p>}
          </div>
          <div>
            <label htmlFor="playlist-description" className="mb-1.5 block text-[12px] font-medium text-muted-foreground">
              {t("playlist.description")}
            </label>
            <textarea
              id="playlist-description"
              {...register("description")}
              rows={3}
              placeholder={t("playlist.descriptionPlaceholder")}
              className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-[13.5px] outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/25"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" variant="gradient" disabled={isSubmitting}>
              {t("common.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
