import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-primary/12 text-primary">
        <Compass className="size-6" />
      </span>
      <p className="mt-4 font-display text-5xl font-extrabold tracking-tight">404</p>
      <h1 className="mt-2 font-display text-lg font-semibold">Page not found</h1>
      <p className="mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Button asChild variant="gradient" className="mt-5">
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  );
}
