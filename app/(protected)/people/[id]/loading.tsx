export default function PersonLoading() {
  return (
    <div role="status" aria-live="polite" className="mx-auto max-w-3xl">
      <span className="sr-only">Loading profile…</span>
      <div aria-hidden="true" className="animate-pulse">
        <div className="h-4 w-32 rounded bg-stone-200" />
        <div className="mt-4 rounded-xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="size-24 rounded-full bg-stone-200 sm:size-28" />
            <div className="flex-1 space-y-2">
              <div className="h-6 w-1/2 rounded bg-stone-200" />
              <div className="h-4 w-1/3 rounded bg-stone-100" />
            </div>
          </div>
          <div className="mt-8 space-y-2">
            <div className="h-3 rounded bg-stone-100" />
            <div className="h-3 w-5/6 rounded bg-stone-100" />
            <div className="h-3 w-2/3 rounded bg-stone-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
