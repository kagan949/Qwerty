"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Menu, Search, Settings2 } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { useUiStore } from "@/store/ui-store";
import { useI18n } from "@/i18n/provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  showSearch?: boolean;
  className?: string;
}

/**
 * Sticky top bar used on every route except Home (which has its own hero).
 *
 *  · mobile  — menu button, brand, settings shortcut
 *  · desktop — back (when relevant) and a search pill with its `/` hint
 *
 * Content that scrolls beneath it stays legible thanks to the backdrop blur;
 * the gradient fade avoids a hard seam against the page background.
 */
export function TopBar({ title, showBack = true, showSearch = true, className }: TopBarProps) {
  const router = useRouter();
  const { t } = useI18n();
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 items-center gap-2 px-3 sm:px-6 lg:h-16 lg:px-8",
        "bg-gradient-to-b from-background/95 via-background/80 to-background/40 backdrop-blur-xl",
        className,
      )}
    >
      <Button
        variant="ghost"
        size="icon-sm"
        className="lg:hidden"
        aria-label={t("nav.menu")}
        onClick={() => setSidebarOpen(true)}
      >
        <Menu className="size-5" />
      </Button>

      {showBack && title !== undefined && (
        <Button variant="ghost" size="icon-sm" aria-label={t("common.back")} onClick={() => router.back()}>
          <ArrowLeft className="size-5" />
        </Button>
      )}

      {title ? (
        <h1 className="min-w-0 flex-1 truncate font-display text-[15px] font-semibold tracking-tight">{title}</h1>
      ) : (
        <div className="flex flex-1 items-center lg:hidden">
          <Brand />
        </div>
      )}

      <div className="ml-auto flex items-center gap-1.5">
        {showSearch && (
          <Link
            href="/search"
            className="hidden h-9 items-center gap-2 rounded-full border border-white/8 bg-white/5 px-3 text-xs text-muted-foreground transition-colors hover:border-white/12 hover:text-foreground lg:inline-flex"
          >
            <Search className="size-3.5" />
            <span>{t("search.title")}</span>
            <kbd className="ml-3 rounded border border-white/10 bg-black/30 px-1.5 py-0.5 text-[10px]">/</kbd>
          </Link>
        )}
        <Button variant="ghost" size="icon-sm" asChild aria-label={t("nav.settings")}>
          <Link href="/settings">
            <Settings2 className="size-[18px]" />
          </Link>
        </Button>
      </div>
    </header>
  );
}
