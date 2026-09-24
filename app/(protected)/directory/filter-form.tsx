import Link from "next/link";
import { primaryButton, secondaryButton } from "@/components/styles";
import type { Filters } from "@/lib/profiles/directory";
import { DEPARTMENTS } from "@/lib/profiles/fields";

const controlClass =
  "w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-base text-stone-900 shadow-sm outline-none placeholder:text-stone-400 focus-visible:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600/30 sm:text-sm";

// A plain GET form: filters live in the URL, so results can be shared,
// survive a refresh, and work without JavaScript.
export function FilterForm({ filters }: { filters: Filters }) {
  const filtered = Boolean(filters.query || filters.department);

  return (
    <form
      action="/directory"
      method="get"
      role="search"
      aria-label="Search the directory"
      className="mb-6 grid gap-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:mb-8 sm:grid-cols-[1fr_16rem_auto] sm:items-end sm:p-5"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="search-name" className="text-sm font-medium text-stone-800">
          Name
        </label>
        <input
          id="search-name"
          name="q"
          type="search"
          autoComplete="off"
          maxLength={100}
          placeholder="Search by name"
          defaultValue={filters.query}
          className={controlClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="search-department" className="text-sm font-medium text-stone-800">
          Department
        </label>
        <select
          id="search-department"
          name="department"
          defaultValue={filters.department}
          className={controlClass}
        >
          <option value="">All departments</option>
          {DEPARTMENTS.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <button type="submit" className={`${primaryButton} flex-1 py-2 sm:flex-none`}>
          Search
        </button>
        {filtered && (
          <Link href="/directory" className={`${secondaryButton} flex-1 py-2 sm:flex-none`}>
            Clear
          </Link>
        )}
      </div>
    </form>
  );
}
