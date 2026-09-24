import { ResultsSkeleton } from "./results-skeleton";

export default function DirectoryLoading() {
  return (
    <>
      <div className="h-8 w-40 animate-pulse rounded bg-stone-200" />
      <div className="mt-3 mb-6 h-4 w-72 max-w-full animate-pulse rounded bg-stone-100" />
      <div className="mb-8 h-24 animate-pulse rounded-xl border border-stone-200 bg-white sm:h-20" />
      <ResultsSkeleton />
    </>
  );
}
