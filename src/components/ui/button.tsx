import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_8px_24px_-10px_rgb(139_92_246/0.9)] hover:bg-primary-strong",
        gradient:
          "bg-[linear-gradient(100deg,#8b5cf6,#6366f1_45%,#22d3ee)] text-white shadow-[0_10px_30px_-12px_rgb(124_58_237/0.9)] hover:brightness-110",
        secondary: "bg-white/8 text-foreground hover:bg-white/14 border border-white/10",
        outline: "border border-border-subtle bg-transparent hover:bg-white/6 text-foreground",
        ghost: "hover:bg-white/8 text-foreground",
        subtle: "bg-card text-foreground hover:bg-card-hover",
        destructive: "bg-red-500/90 text-white hover:bg-red-500",
        link: "text-primary underline-offset-4 hover:underline rounded-md",
        icon: "bg-transparent hover:bg-white/8 text-foreground",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-7 text-[15px]",
        xl: "h-14 px-8 text-base",
        icon: "size-10",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />;
  },
);
Button.displayName = "Button";

export { buttonVariants };
