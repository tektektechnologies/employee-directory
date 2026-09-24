const placeholderCardKeys = ["first", "second", "third", "fourth", "fifth", "sixth"];

export function DirectoryResultsSkeleton() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading colleagues…</span>
      <ul aria-hidden="true" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {placeholderCardKeys.map((placeholderKey) => (
          <li
            key={placeholderKey}
            className="animate-pulse rounded-xl border border-stone-200 bg-white p-5 shadow-sm"
          >
            <div className="h-4 w-2/3 rounded bg-stone-200" />
            <div className="mt-2 h-3 w-1/2 rounded bg-stone-200" />
            <div className="mt-2 h-3 w-1/3 rounded bg-stone-100" />
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
