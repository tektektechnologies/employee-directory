const fieldPlaceholders = [1, 2, 3, 4, 5];

export default function EditProfileLoading() {
  return (
    <div role="status" aria-live="polite" className="mx-auto max-w-2xl">
      <span className="sr-only">Loading your profile…</span>
      <div aria-hidden="true" className="animate-pulse">
        <div className="h-7 w-56 rounded bg-stone-200" />
        <div className="mt-3 h-4 w-80 max-w-full rounded bg-stone-100" />
        <div className="mt-8 space-y-6 rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-8">
          {fieldPlaceholders.map((key) => (
            <div key={key} className="space-y-2">
              <div className="h-3 w-24 rounded bg-stone-200" />
              <div className="h-9 rounded bg-stone-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
