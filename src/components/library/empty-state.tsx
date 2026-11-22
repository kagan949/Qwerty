"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type IconComponent = React.ComponentType<{ className?: string }>;

interface EmptyStateProps {
  icon: IconComponent;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  compact?: boolean;
}

export function EmptyState({ icon: Icon, title, description, action, compact }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 text-center",
        compact ? "px-4 py-6" : "px-6 py-12",
      )}
    >
      <span className={cn("grid place-items-center rounded-2xl bg-white/6 text-muted-foreground", compact ? "size-10" : "size-14")}>
        <Icon className={compact ? "size-5" : "size-6"} />
      </span>
      <p className={cn("font-display font-semibold", compact ? "mt-2.5 text-[13px]" : "mt-3 text-[15px]")}>{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-[12px] leading-relaxed text-muted-foreground">{description}</p>
      )}
      {action && (
        <Button size="sm" variant="secondary" className="mt-3" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
