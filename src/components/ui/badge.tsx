import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-white/10 text-white/80",
        jamendo: "bg-violet-500/15 text-violet-300 ring-1 ring-inset ring-violet-400/25",
        archive: "bg-cyan-500/15 text-cyan-300 ring-1 ring-inset ring-cyan-400/25",
        local: "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/25",
        curated: "bg-fuchsia-500/15 text-fuchsia-300 ring-1 ring-inset ring-fuchsia-400/25",
        outline: "border border-white/15 text-white/70",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
