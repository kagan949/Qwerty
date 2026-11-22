"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

export const Slider = React.forwardRef<
  React.ComponentRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & { showThumbOnHover?: boolean }
>(({ className, showThumbOnHover = false, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center group",
      "data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-white/14">
      <SliderPrimitive.Range className="absolute h-full rounded-full bg-[linear-gradient(90deg,#8b5cf6,#a78bfa)] group-hover:bg-[linear-gradient(90deg,#8b5cf6,#22d3ee)] transition-colors" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      className={cn(
        "block size-3 rounded-full bg-white shadow-[0_0_0_4px_rgb(139_92_246/0.25)] transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        showThumbOnHover && "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100",
      )}
    />
  </SliderPrimitive.Root>
));
Slider.displayName = "Slider";
