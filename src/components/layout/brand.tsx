"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative grid size-9 place-items-center rounded-[11px] bg-[linear-gradient(140deg,#a78bfa,#7c3aed_45%,#06b6d4)] shadow-[0_8px_22px_-8px_rgb(124_58_237/0.95)]",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none">
        <path
          d="M4 14.5 8.2 9.6l3.4 4.3L15.4 7l4.6 6.3"
          stroke="white"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="8.2" cy="9.6" r="1.3" fill="white" />
      </svg>
    </span>
  );
}

export function Brand({ compact }: { compact?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label="VYBE — home">
      <BrandMark />
      {!compact && (
        <span className="font-display text-[19px] font-extrabold tracking-[-0.045em]">
          VYBE
          <span className="text-primary">.</span>
        </span>
      )}
    </Link>
  );
}
