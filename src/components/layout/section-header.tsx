"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  href?: string;
  actionLabel?: string;
  className?: string;
  children?: React.ReactNode;
}

export function SectionHeader({ title, subtitle, href, actionLabel, className, children }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        <h2 className="font-display text-[19px] font-bold tracking-[-0.02em] sm:text-[22px]">{title}</h2>
        {subtitle && <p className="mt-1 truncate text-[12.5px] text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
      {href && actionLabel && (
        <Link
          href={href}
          className="group flex shrink-0 items-center gap-1 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {actionLabel}
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
