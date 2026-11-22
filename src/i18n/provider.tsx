"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_LOCALE, detectLocale, INTL_LOCALE, isLocale, LOCALES, type Locale } from "./config";
import { MESSAGES } from "./messages";
import { STORAGE_KEYS } from "@/lib/constants";

export type TranslateVars = Record<string, string | number>;

/**
 * Message keys are plain strings on purpose: nested `typeof en` recursion made
 * TypeScript's instantiation depth explode with 470+ leaves. The lookup falls
 * back to English and finally to the key itself, so a typo is visible but never
 * crashes a screen.
 */
export type MessageKey = string;

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, vars?: TranslateVars) => string;
  /** True when the active locale (or the English fallback) defines `key`. */
  hasKey: (key: MessageKey) => boolean;
  intlLocale: string;
  isRtl: boolean;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function lookup(dictionary: unknown, key: string): string | undefined {
  const parts = key.split(".");
  let cursor: unknown = dictionary;
  for (const part of parts) {
    if (cursor && typeof cursor === "object" && part in (cursor as Record<string, unknown>)) {
      cursor = (cursor as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof cursor === "string" ? cursor : undefined;
}

function interpolate(template: string, vars?: TranslateVars) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [hydrated, setHydrated] = useState(false);
  const initialised = useRef(false);

  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;
    let resolved: Locale = DEFAULT_LOCALE;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEYS.localeSeen);
      if (stored && isLocale(stored)) {
        resolved = stored;
      } else {
        const storedSettings = window.localStorage.getItem(STORAGE_KEYS.settings);
        if (storedSettings) {
          const parsed = JSON.parse(storedSettings) as { state?: { locale?: unknown }; locale?: unknown };
          const candidate = parsed.state?.locale ?? parsed.locale;
          if (isLocale(candidate)) resolved = candidate;
        }
      }
      if (!stored) {
        resolved = detectLocale(
          navigator.languages?.length ? navigator.languages : [navigator.language],
        );
      }
    } catch {
      resolved = DEFAULT_LOCALE;
    }
    setLocaleState(resolved);
    setHydrated(true);
    document.documentElement.lang = resolved;
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    document.documentElement.lang = next;
    try {
      window.localStorage.setItem(STORAGE_KEYS.localeSeen, next);
    } catch {
      // Storage unavailable — locale still applies for this session.
    }
  }, []);

  const t = useCallback(
    (key: MessageKey, vars?: TranslateVars) => {
      const dictionary = MESSAGES[locale] ?? MESSAGES[DEFAULT_LOCALE];
      const value = lookup(dictionary, key) ?? lookup(MESSAGES[DEFAULT_LOCALE], key) ?? key;
      return interpolate(value, vars);
    },
    [locale],
  );

  const hasKey = useCallback(
    (key: MessageKey) => {
      const dictionary = MESSAGES[locale] ?? MESSAGES[DEFAULT_LOCALE];
      return lookup(dictionary, key) !== undefined || lookup(MESSAGES[DEFAULT_LOCALE], key) !== undefined;
    },
    [locale],
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale: hydrated ? locale : DEFAULT_LOCALE,
      setLocale,
      t,
      hasKey,
      intlLocale: INTL_LOCALE[locale],
      isRtl: false,
    }),
    [locale, hydrated, setLocale, t, hasKey],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside <I18nProvider>");
  return context;
}

export function useT() {
  return useI18n().t;
}

export { LOCALES };
