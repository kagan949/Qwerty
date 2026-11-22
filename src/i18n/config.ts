export const LOCALES = [
  { code: "en", label: "English", native: "English", flag: "🇬🇧" },
  { code: "ru", label: "Russian", native: "Русский", flag: "🇷🇺" },
  { code: "ky", label: "Kyrgyz", native: "Кыргызча", flag: "🇰🇬" },
  { code: "kk", label: "Kazakh", native: "Қазақша", flag: "🇰🇿" },
  { code: "tr", label: "Turkish", native: "Türkçe", flag: "🇹🇷" },
  { code: "es", label: "Spanish", native: "Español", flag: "🇪🇸" },
  { code: "fr", label: "French", native: "Français", flag: "🇫🇷" },
  { code: "de", label: "German", native: "Deutsch", flag: "🇩🇪" },
  { code: "ja", label: "Japanese", native: "日本語", flag: "🇯🇵" },
  { code: "zh", label: "Chinese", native: "中文", flag: "🇨🇳" },
] as const;

export type Locale = (typeof LOCALES)[number]["code"];

export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && LOCALES.some((l) => l.code === value);
}

/** Map a browser language tag (e.g. `ru-RU`) onto a supported locale. */
export function detectLocale(candidates: readonly string[] = []): Locale {
  for (const raw of candidates) {
    const base = raw.toLowerCase().split("-")[0];
    if (isLocale(base)) return base;
    if (base === "ky" || base === "kir") return "ky";
    if (base === "zh") return "zh";
  }
  return DEFAULT_LOCALE;
}

export const INTL_LOCALE: Record<Locale, string> = {
  en: "en-US",
  ru: "ru-RU",
  ky: "ky-KG",
  kk: "kk-KZ",
  tr: "tr-TR",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  ja: "ja-JP",
  zh: "zh-CN",
};
