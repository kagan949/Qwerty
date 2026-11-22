"use client";

import { AlertTriangle, HardDrive, ShieldCheck } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { useStorageEstimate } from "@/hooks/use-storage-estimate";
import { formatBytes, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Storage quota meter. Warns at 80% and offers persistent-storage permission so
 * the browser is less likely to evict uploaded music.
 */
export function StorageMeter({ refreshKey }: { refreshKey?: unknown }) {
  const { t } = useI18n();
  const { estimate, requestPersistence } = useStorageEstimate(refreshKey);
  const warning = estimate.percent >= 80;

  return (
    <div className="rounded-2xl border border-white/8 bg-card/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-white/6 text-muted-foreground">
            <HardDrive className="size-4" />
          </span>
          <div>
            <p className="text-[12.5px] font-semibold">{t("library.storageTitle")}</p>
            <p className="text-[10.5px] text-muted-foreground">
              {estimate.supported
                ? `${formatBytes(estimate.usage)} ${t("library.storageUsed")} · ${t("library.storageOf")} ${formatBytes(estimate.quota)}`
                : t("library.storageUnavailable")}
            </p>
          </div>
        </div>
        {estimate.supported && (
          <span className={cn("text-[12px] font-semibold tabular-nums", warning ? "text-amber-400" : "text-muted-foreground")}>
            {estimate.percent.toFixed(0)}%
          </span>
        )}
      </div>

      {estimate.supported && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              warning ? "bg-amber-400" : "bg-[linear-gradient(90deg,#8b5cf6,#22d3ee)]",
            )}
            style={{ width: `${Math.max(2, estimate.percent)}%` }}
          />
        </div>
      )}

      {warning && (
        <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-amber-300">
          <AlertTriangle className="mt-0.5 size-3 shrink-0" />
          {t("library.storageWarning")}
        </p>
      )}

      {estimate.supported && !estimate.persisted && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-white/4 px-3 py-2">
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="size-3.5" /> {t("upload.privacyNote")}
          </p>
          <Button
            size="sm"
            variant="ghost"
            className="shrink-0 text-[11px]"
            onClick={() => void requestPersistence()}
          >
            <ShieldCheck className="size-3" /> {t("settings.offlineMode")}
          </Button>
        </div>
      )}
    </div>
  );
}
