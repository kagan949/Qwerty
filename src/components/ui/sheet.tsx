"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

export const SheetContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { side?: "bottom" | "right" | "left" }
>(({ className, children, side = "bottom", ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-md anim-overlay" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-[71] glass-strong shadow-2xl focus:outline-none",
        side === "bottom" &&
          "inset-x-0 bottom-0 max-h-[88vh] rounded-t-3xl border-t p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] anim-sheet",
        side === "right" && "inset-y-0 right-0 w-[86vw] max-w-sm border-l p-5 anim-sheet",
        side === "left" && "inset-y-0 left-0 w-[86vw] max-w-sm border-r p-5 anim-sheet",
        className,
      )}
      {...props}
    >
      {side === "bottom" && (
        <div className="mx-auto mb-4 h-1.5 w-11 rounded-full bg-white/20" aria-hidden />
      )}
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-white/10 hover:text-foreground">
        <X className="size-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
SheetContent.displayName = "SheetContent";

export const SheetTitle = DialogPrimitive.Title;
export const SheetDescription = DialogPrimitive.Description;
