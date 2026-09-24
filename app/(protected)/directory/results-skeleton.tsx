const placeholders = [1, 2, 3, 4, 5, 6];

export function ResultsSkeleton() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading colleagues…</span>
      <div aria-hidden="true" className="mb-4 h-4 w-32 animate-pulse rounded bg-stone-200" />
      <ul aria-hidden="true" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {placeholders.map((key) => (
          <li key={key} className="animate-pulse rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="size-14 shrink-0 rounded-full bg-stone-200" />
              <div className="flex-1">
                <div className="h-4 w-2/3 rounded bg-stone-200" />
                <div className="mt-2 h-3 w-1/2 rounded bg-stone-200" />
                <div className="mt-2 h-3 w-1/3 rounded bg-stone-100" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-3 rounded bg-stone-100" />
              <div className="h-3 w-5/6 rounded bg-stone-100" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
