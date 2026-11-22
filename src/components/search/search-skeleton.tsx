import { Skeleton, TrackRowSkeleton } from "@/components/ui/skeleton";

export function SearchPageSkeleton() {
  return (
    <div className="px-4 pt-6 sm:px-6 lg:px-8">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mt-3 h-14 w-full max-w-2xl rounded-2xl" />
      <div className="mt-8 max-w-3xl">
        <TrackRowSkeleton count={6} />
      </div>
    </div>
  );
}
