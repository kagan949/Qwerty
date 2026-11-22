import { Suspense } from "react";
import type { Metadata } from "next";
import { LibraryView } from "@/components/library/library-view";
import { TrackRowSkeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Your Library",
  description: "Everything you've saved, uploaded or liked — stored locally on your device.",
};

export default function LibraryPage() {
  return (
    <Suspense fallback={<div className="p-6"><TrackRowSkeleton count={8} /></div>}>
      <LibraryView />
    </Suspense>
  );
}
