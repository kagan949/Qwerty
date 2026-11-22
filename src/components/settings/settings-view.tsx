"use client";

import { useRef, useState } from "react";
import {
  Check,
  Database,
  Download,
  Globe,
  HardDrive,
  Info,
  Keyboard,
  Languages,
  Moon,
  Music2,
  Palette,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  Volume2,
} from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { LOCALES } from "@/i18n/config";
import { useSettingsStore } from "@/store/settings-store";
import { useLibraryStore } from "@/store/library-store";
import { useUiStore } from "@/store/ui-store";
import { StorageMeter } from "@/components/library/storage-meter";
import { EqualizerPanel } from "@/components/player/equalizer-panel";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import {
  downloadBlob,
  exportLibraryFull,
  exportLibraryJson,
  importBackup,
  parseBackupFile,
} from "@/database/export";
import { clearPlayEvents, clearRecentPlays, clearSearchHistory } from "@/database/history";
import { getDb } from "@/database/db";
import { resetStoredSettings } from "@/database/settings";
import { APP_NAME } from "@/lib/constants";

export function SettingsView() {
  const { t } = useI18n();
  const settings = useSettingsStore();
  const refreshAll = useLibraryStore((state) => state.refreshAll);
  const setInstallVisible = useUiStore((state) => state.setInstallPromptVisible);

  return (
    <div className="px-4 pt-6 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        <Settings2 className="size-3.5 text-primary" /> VYBE
      </div>
      <h1 className="mt-2 font-display text-[26px] font-extrabold tracking-[-0.03em] sm:text-[32px]">{t("settings.title")}</h1>
      <p className="mt-1 text-[13px] text-muted-foreground">{t("settings.subtitle")}</p>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {/* Appearance + language */}
        <Section icon={Palette} title={t("settings.appearance")}>
          <Row label={t("settings.theme")} hint={t("settings.themeHint")}>
            <div className="flex rounded-full border border-white/10 bg-white/4 p-1">
              {(
                [
                  { value: "dark" as const, label: t("settings.themeDark"), icon: Moon },
                  { value: "light" as const, label: t("settings.themeLight"), icon: Sun },
                ]
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => settings.setTheme(option.value)}
                  aria-pressed={settings.theme === option.value}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors",
                    settings.theme === option.value ? "bg-white/12 text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <option.icon className="size-3.5" />
                  {option.label}
                </button>
              ))}
            </div>
          </Row>
          <div className="mt-3 rounded-2xl border border-white/8 bg-card/40 p-3">
            <div className="flex items-center gap-2">
              <Globe className="size-4 text-primary" />
              <div>
                <p className="text-[12.5px] font-semibold">{t("settings.languageTitle")}</p>
                <p className="text-[10.5px] text-muted-foreground">{t("settings.languageHint")}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {LOCALES.map((locale) => (
                <button
                  key={locale.code}
                  type="button"
                  onClick={() => {
                    settings.setLocale(locale.code);
                    toast.success(`${locale.native} · ${t("common.done")}`, { id: "locale" });
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-colors",
                    settings.locale === locale.code
                      ? "border-primary/45 bg-primary/12"
                      : "border-white/8 hover:border-white/16 hover:bg-white/5",
                  )}
                  aria-pressed={settings.locale === locale.code}
                >
                  <span className="text-base leading-none">{locale.flag}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11.5px] font-medium">{locale.native}</span>
                    <span className="block truncate text-[10px] text-muted-foreground">{locale.label}</span>
                  </span>
                  {settings.locale === locale.code && <Check className="size-3.5 shrink-0 text-primary" />}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* Playback */}
        <Section icon={Volume2} title={t("settings.playback")}>
          <ToggleRow
            label={t("settings.autoplay")}
            hint={t("settings.autoplayHint")}
            checked={settings.autoplay}
            onChange={settings.setAutoplay}
          />
          <ToggleRow
            label={t("settings.shuffle")}
            hint={t("settings.shuffleHint")}
            checked={settings.shuffleDefault}
            onChange={settings.setShuffleDefault}
          />
          <ToggleRow
            label={t("settings.gapless")}
            hint={t("player.gapless")}
            checked={settings.gapless}
            onChange={settings.setGapless}
          />
          <ToggleRow
            label={t("settings.normalizeVolume")}
            hint={t("settings.normalizeVolumeHint")}
            checked={settings.normalizeVolume}
            onChange={settings.setNormalizeVolume}
          />
          <ToggleRow
            label={t("player.visualizer")}
            hint={t("settings.equalizerHint")}
            checked={settings.showVisualizer}
            onChange={settings.setShowVisualizer}
          />
          <div className="mt-2 rounded-2xl border border-white/8 bg-card/40 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-medium">{t("settings.crossfade")}</span>
              <span className="text-[11.5px] tabular-nums text-muted-foreground">
                {settings.crossfadeSeconds === 0 ? t("player.crossfadeOff") : `${settings.crossfadeSeconds} ${t("common.sec")}`}
              </span>
            </div>
            <Slider
              className="mt-2"
              min={0}
              max={12}
              step={1}
              value={[settings.crossfadeSeconds]}
              onValueChange={(values) => settings.setCrossfade(values[0] ?? 0)}
              aria-label={t("settings.crossfade")}
            />
            <p className="mt-1.5 text-[10.5px] text-muted-foreground">{t("player.crossfadeHint")}</p>
          </div>
          <div className="mt-2 rounded-2xl border border-white/8 bg-card/40 p-3">
            <p className="text-[12.5px] font-medium">{t("settings.quality")}</p>
            <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {(
                [
                  { value: "auto" as const, label: t("settings.qualityAuto") },
                  { value: "high" as const, label: t("settings.qualityHigh") },
                  { value: "medium" as const, label: t("settings.qualityMedium") },
                  { value: "low" as const, label: t("settings.qualityLow") },
                ]
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => settings.setQuality(option.value)}
                  className={cn(
                    "rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-colors",
                    settings.quality === option.value
                      ? "border-primary/45 bg-primary/12 text-foreground"
                      : "border-white/8 text-muted-foreground hover:bg-white/5",
                  )}
                  aria-pressed={settings.quality === option.value}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[10.5px] text-muted-foreground">{t("settings.qualityAutoHint")}</p>
          </div>
        </Section>

        {/* Equalizer */}
        <Section icon={Music2} title={t("settings.equalizer")}>
          <EqualizerPanel />
          <p className="mt-2 text-[10.5px] leading-relaxed text-muted-foreground">{t("settings.eqDisabled")}</p>
        </Section>

        {/* Storage */}
        <Section icon={HardDrive} title={t("settings.storage")}>
          <StorageMeter />
          <div className="mt-2 space-y-1.5">
            <ActionRow
              icon={Trash2}
              label={t("settings.clearHistory")}
              hint={t("settings.clearHistoryHint")}
              onClick={async () => {
                await Promise.all([clearRecentPlays(), clearPlayEvents()]);
                await refreshAll();
                toast.success(t("settings.cleared"));
              }}
              danger
            />
            <ActionRow
              icon={Trash2}
              label={t("settings.clearSearchHistory")}
              hint={t("search.recent")}
              onClick={async () => {
                await clearSearchHistory();
                toast.success(t("settings.cleared"));
              }}
              danger
            />
            <ActionRow
              icon={Database}
              label={t("settings.clearAllData")}
              hint={t("settings.clearAllDataHint")}
              onClick={async () => {
                if (!window.confirm(t("settings.clearAllConfirm"))) return;
                const database = getDb();
                await Promise.all([
                  database.localTracks.clear(),
                  database.playlists.clear(),
                  database.favorites.clear(),
                  database.recentPlays.clear(),
                  database.playEvents.clear(),
                  database.searchHistory.clear(),
                  database.cache.clear(),
                ]);
                await resetStoredSettings();
                await refreshAll();
                settings.reset();
                toast.success(t("settings.cleared"));
              }}
              danger
            />
          </div>
        </Section>

        {/* Backup */}
        <BackupSection />

        {/* About */}
        <Section icon={Info} title={t("settings.about")}>
          <div className="rounded-2xl border border-white/8 bg-card/40 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-lg font-extrabold tracking-tight">{APP_NAME}</p>
                <p className="text-[11.5px] text-muted-foreground">{t("settings.version")} 1.0.0</p>
              </div>
              <Badge variant="jamendo">{t("explore.openSource")}</Badge>
            </div>
            <p className="mt-3 text-[11.5px] leading-relaxed text-muted-foreground">{t("credits.body")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => setInstallVisible(true)}>
                <Download className="size-3.5" /> {t("pwa.installButton")}
              </Button>
              <Button size="sm" variant="ghost" asChild>
                <a href="https://www.jamendo.com" target="_blank" rel="noreferrer noopener">
                  {t("credits.jamendo")}
                </a>
              </Button>
              <Button size="sm" variant="ghost" asChild>
                <a href="https://archive.org" target="_blank" rel="noreferrer noopener">
                  {t("credits.archive")}
                </a>
              </Button>
            </div>
          </div>
          <div className="mt-2 rounded-2xl border border-white/8 bg-card/40 p-4">
            <p className="flex items-center gap-1.5 text-[12px] font-semibold">
              <Keyboard className="size-3.5 text-primary" /> {t("settings.shortcuts")}
            </p>
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
              {[
                ["Space", t("settings.shortcutSpace")],
                ["← →", t("settings.shortcutArrows")],
                ["↑ ↓", t("settings.shortcutVolume")],
                ["M", t("common.mute")],
                ["Q", t("settings.shortcutQueue")],
                ["F", t("nav.openPlayer")],
                ["N / P", `${t("common.next")} / ${t("common.previous")}`],
                ["/", t("nav.search")],
              ].map(([key, label]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <kbd className="rounded border border-white/12 bg-black/30 px-1.5 py-0.5 text-[10px] font-semibold">{key}</kbd>
                  <dt className="text-muted-foreground">{label}</dt>
                </div>
              ))}
            </dl>
          </div>
          <div className="mt-2 flex flex-col gap-1.5 rounded-2xl border border-white/8 bg-card/40 p-4">
            <p className="flex items-center gap-1.5 text-[12px] font-semibold">
              <ShieldCheck className="size-3.5 text-emerald-400" /> {t("settings.privacy")}
            </p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">{t("settings.privacyHint")}</p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">{t("settings.offlineHint")}</p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">{t("credits.fonts")}</p>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (!window.confirm(t("settings.resetConfirm"))) return;
                settings.reset();
                toast.success(t("settings.resetDone"));
              }}
            >
              <Sparkles className="size-3.5" /> {t("settings.reset")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                void navigator.storage?.estimate?.().then(() => {
                  toast.success(t("settings.storageHint"));
                });
              }}
            >
              {t("settings.storage")}
            </Button>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/8 bg-surface/50 p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-primary/12 text-primary">
          <Icon className="size-4" />
        </span>
        <h2 className="font-display text-[15px] font-bold tracking-tight">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[13px] font-medium">{label}</p>
        {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/5 py-2.5 last:border-0">
      <div className="min-w-0">
        <p className="text-[13px] font-medium">{label}</p>
        {hint && <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{hint}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}

function ActionRow({
  icon: Icon,
  label,
  hint,
  onClick,
  danger,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint?: string;
  onClick: () => void | Promise<void>;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => void onClick()}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border border-white/8 px-3 py-2.5 text-left transition-colors hover:bg-white/5",
        danger && "hover:border-red-500/30 hover:bg-red-500/8",
      )}
    >
      <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg bg-white/6", danger ? "text-red-400" : "text-muted-foreground")}>
        <Icon className="size-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12.5px] font-medium">{label}</span>
        {hint && <span className="block truncate text-[10.5px] text-muted-foreground">{hint}</span>}
      </span>
    </button>
  );
}

function BackupSection() {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [replace, setReplace] = useState(false);
  const [busy, setBusy] = useState<"json" | "full" | "import" | null>(null);
  const refreshAll = useLibraryStore((state) => state.refreshAll);

  return (
    <Section icon={Database} title={t("settings.backup")}>
      <div className="space-y-1.5">
        <ActionRow
          icon={Download}
          label={busy === "json" ? t("common.loading") : t("settings.exportData")}
          hint={t("settings.exportDataHint")}
          onClick={async () => {
            setBusy("json");
            try {
              const { blob, meta } = await exportLibraryJson();
              downloadBlob(blob, `vybe-backup-${meta.exportedAt.slice(0, 10)}.json`);
              toast.success(t("settings.exportSuccess"));
            } catch {
              toast.error(t("toast.saveFailed"));
            } finally {
              setBusy(null);
            }
          }}
        />
        <ActionRow
          icon={Download}
          label={busy === "full" ? t("common.loading") : t("settings.exportFull")}
          hint={t("settings.exportFullHint")}
          onClick={async () => {
            setBusy("full");
            try {
              const { blob, meta } = await exportLibraryFull();
              downloadBlob(blob, `vybe-full-backup-${meta.exportedAt.slice(0, 10)}.zip`);
              toast.success(t("settings.exportSuccess"));
            } catch {
              toast.error(t("toast.saveFailed"));
            } finally {
              setBusy(null);
            }
          }}
        />
        <ActionRow
          icon={Upload}
          label={busy === "import" ? t("common.loading") : t("settings.importData")}
          hint={t("settings.importHint")}
          onClick={() => inputRef.current?.click()}
        />
        <div className="flex items-center justify-between rounded-xl border border-white/8 px-3 py-2.5">
          <div>
            <p className="text-[12.5px] font-medium">{t("settings.importReplace")}</p>
            <p className="text-[10.5px] text-muted-foreground">{t("settings.clearAllDataHint")}</p>
          </div>
          <Switch checked={replace} onCheckedChange={setReplace} aria-label={t("settings.importReplace")} />
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".json,.zip,application/json,application/zip"
        className="sr-only"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          setBusy("import");
          try {
            const parsed = await parseBackupFile(file);
            const counts = await importBackup(parsed, { replace });
            await refreshAll();
            toast.success(
              `${t("settings.importSuccess")} · ${counts.localTracks} ♪ · ${counts.playlists} ${t("nav.playlists")}`,
              { id: "import" },
            );
          } catch {
            toast.error(t("settings.importError"));
          } finally {
            setBusy(null);
          }
        }}
      />
      <p className="mt-2 flex items-start gap-1.5 text-[10.5px] leading-relaxed text-muted-foreground">
        <Languages className="mt-0.5 size-3 shrink-0" />
        {t("settings.exportDataHint")}
      </p>
    </Section>
  );
}
