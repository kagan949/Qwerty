"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

interface GlobalSearchInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  autoFocus?: boolean;
  loading?: boolean;
  size?: "md" | "lg" | "xl";
  placeholder?: string;
  className?: string;
}

/**
 * Search field with a `/` shortcut, clear button and optimistic typing.
 * On pages without an onChange handler it navigates to /search on submit.
 */
export function GlobalSearchInput({
  value,
  onChange,
  onSubmit,
  autoFocus,
  loading,
  size = "md",
  placeholder,
  className,
}: GlobalSearchInputProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [internal, setInternal] = useState(value ?? "");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const controlled = value !== undefined;

  // Adjusting state during render is React's recommended way to sync a
  // controlled prop into local state — no extra effect pass, no stale frame.
  const [lastValue, setLastValue] = useState(value);
  if (controlled && value !== lastValue) {
    setLastValue(value);
    setInternal(value as string);
  }

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== "/") return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || target?.isContentEditable) return;
      event.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const handleChange = (next: string) => {
    setInternal(next);
    onChange?.(next);
  };

  const submit = () => {
    const trimmed = internal.trim();
    if (!trimmed) return;
    if (onSubmit) onSubmit(trimmed);
    else router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const heights = { md: "h-11", lg: "h-13", xl: "h-14 sm:h-16" } as const;
  const radii = { md: "rounded-full", lg: "rounded-2xl", xl: "rounded-2xl" } as const;
  const iconSizes = { md: "size-4", lg: "size-5", xl: "size-5" } as const;
  const textSizes = { md: "text-[13.5px]", lg: "text-[14.5px]", xl: "text-[15px] sm:text-base" } as const;

  return (
    <div className={cn("group relative", className)}>
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
        {loading ? <Loader2 className={cn(iconSizes[size], "animate-spin")} /> : <Search className={iconSizes[size]} />}
      </span>
      <input
        ref={inputRef}
        type="search"
        role="searchbox"
        enterKeyHint="search"
        autoComplete="off"
        spellCheck={false}
        value={internal}
        onChange={(event) => handleChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") submit();
          if (event.key === "Escape") {
            handleChange("");
            inputRef.current?.blur();
          }
        }}
        placeholder={placeholder ?? t("search.placeholder")}
        aria-label={t("search.title")}
        autoFocus={autoFocus}
        className={cn(
          "w-full border bg-white/5 pl-11 pr-24 outline-none transition-all",
          "border-white/10 placeholder:text-muted-foreground/70",
          "focus:border-primary/55 focus:bg-white/7 focus:ring-4 focus:ring-primary/15",
          heights[size],
          radii[size],
          textSizes[size],
          "[&::-webkit-search-cancel-button]:appearance-none",
        )}
      />
      <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
        {internal && (
          <button
            type="button"
            onClick={() => {
              handleChange("");
              inputRef.current?.focus();
            }}
            aria-label={t("common.clear")}
            className="grid size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
        <kbd className="hidden rounded-md border border-white/10 bg-black/30 px-1.5 py-0.5 text-[10px] text-muted-foreground sm:block">
          /
        </kbd>
      </div>
    </div>
  );
}
