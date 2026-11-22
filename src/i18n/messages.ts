import en from "./locales/en";
import ru from "./locales/ru";
import ky from "./locales/ky";
import kk from "./locales/kk";
import tr from "./locales/tr";
import es from "./locales/es";
import fr from "./locales/fr";
import de from "./locales/de";
import ja from "./locales/ja";
import zh from "./locales/zh";
import type { Locale } from "./config";

export type Messages = typeof en;

export const MESSAGES: Record<Locale, Messages> = {
  en,
  ru,
  ky,
  kk,
  tr,
  es,
  fr,
  de,
  ja,
  zh,
};
