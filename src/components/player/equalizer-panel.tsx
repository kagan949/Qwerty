"use client";

import { useSettingsStore, EQ_PRESETS } from "@/store/settings-store";
import { useI18n } from "@/i18n/provider";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const BANDS = [
  { key: "bass" as const, labelKey: "settings.bass" as const, frequency: "120 Hz" },
  { key: "mid" as const, labelKey: "settings.mid" as const, frequency: "1 kHz" },
  { key: "treble" as const, labelKey: "settings.treble" as const, frequency: "6 kHz" },
];

const PRESETS = [
  { key: "flat" as const, labelKey: "settings.presetFlat" as const },
  { key: "bass" as const, labelKey: "settings.presetBass" as const },
  { key: "vocal" as const, labelKey: "settings.presetVocal" as const },
  { key: "bright" as const, labelKey: "settings.presetBright" as const },
];

/**
 * Equalizer UI. Values are persisted in the settings store and applied by the
 * audio engine through Web Audio BiquadFilters (see hooks/use-equalizer.tsx).
 */
export function EqualizerPanel() {
  const { t } = useI18n();
  const equalizer = useSettingsStore((state) => state.equalizer);
  const setEqualizer = useSettingsStore((state) => state.setEqualizer);

  return (
    <div className="rounded-2xl border border-white/8 bg-card/60 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[13.5px] font-semibold">{t("settings.equalizer")}</p>
          <p className="mt-0.5 text-[11.5px] text-muted-foreground">{t("settings.equalizerHint")}</p>
        </div>
        <Switch
          checked={equalizer.enabled}
          onCheckedChange={(enabled) => setEqualizer({ enabled })}
          aria-label={t("settings.enableEq")}
        />
      </div>

      <div
        className={cn(
          "mt-4 grid grid-cols-3 gap-3 transition-opacity",
          !equalizer.enabled && "pointer-events-none opacity-40",
        )}
      >
        {BANDS.map((band) => (
          <div key={band.key} className="flex flex-col items-center gap-2">
            <span className="text-[10.5px] tabular-nums text-muted-foreground">
              {equalizer[band.key] > 0 ? "+" : ""}
              {equalizer[band.key]} dB
            </span>
            <div className="flex h-28 items-center">
              <Slider
                orientation="vertical"
                aria-label={t(band.labelKey)}
                min={-10}
                max={10}
                step={1}
                value={[equalizer[band.key]]}
                onValueChange={(values) =>
                  setEqualizer({ [band.key]: values[0] ?? 0, preset: "custom" } as never)
                }
                className="h-28"
              />
            </div>
            <span className="text-[11px] font-medium">{t(band.labelKey)}</span>
            <span className="text-[10px] text-muted-foreground/70">{band.frequency}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {PRESETS.map((preset) => (
          <Button
            key={preset.key}
            size="sm"
            variant={equalizer.preset === preset.key ? "secondary" : "ghost"}
            className="h-7 rounded-full text-[11.5px]"
            disabled={!equalizer.enabled}
            onClick={() => setEqualizer({ preset: preset.key, ...EQ_PRESETS[preset.key] })}
          >
            {t(preset.labelKey)}
          </Button>
        ))}
      </div>
    </div>
  );
}
