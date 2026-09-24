import Link from "next/link";
import type { DirectoryFilters } from "@/lib/profiles/directory";

type DirectoryFiltersFormProps = {
  filters: DirectoryFilters;
  departments: string[];
  departmentsLoadFailed: boolean;
};

const controlClassName =
  "w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-base text-stone-900 shadow-sm outline-none focus-visible:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600/30 sm:text-sm";

// A plain GET form: filters live in the URL, so results are shareable,
// survive a refresh, and work without JavaScript.
export function DirectoryFiltersForm({
  filters,
  departments,
  departmentsLoadFailed,
}: DirectoryFiltersFormProps) {
  const departmentOptions =
    filters.department && !departments.includes(filters.department)
      ? [...departments, filters.department]
      : departments;
  const hasActiveFilters = Boolean(filters.nameQuery || filters.department);

  return (
    <form
      action="/directory"
      method="get"
      role="search"
      aria-label="Filter the directory"
      className="mb-8 grid gap-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_16rem_auto] sm:items-end sm:p-5"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="directory-name-search" className="text-sm font-medium text-stone-800">
          Search by name
        </label>
        <input
          id="directory-name-search"
          name="q"
          type="search"
          autoComplete="off"
          maxLength={100}
          placeholder="e.g. Ada"
          defaultValue={filters.nameQuery}
          className={controlClassName}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="directory-department-filter" className="text-sm font-medium text-stone-800">
          Department
        </label>
        <select
          id="directory-department-filter"
          name="department"
          defaultValue={filters.department}
          aria-describedby={departmentsLoadFailed ? "directory-department-filter-error" : undefined}
          className={controlClassName}
        >
          <option value="">All departments</option>
          {departmentOptions.map((departmentName) => (
            <option key={departmentName} value={departmentName}>
              {departmentName}
            </option>
          ))}
        </select>
        {departmentsLoadFailed && (
          <p id="directory-department-filter-error" className="text-xs text-red-700">
            Departments couldn&apos;t be loaded. Name search still works.
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:flex-none"
        >
          Apply
        </button>
        {hasActiveFilters && (
          <Link
            href="/directory"
            className="flex-1 rounded-md border border-stone-300 px-4 py-2 text-center text-sm font-medium text-stone-800 hover:border-stone-400 sm:flex-none"
          >
            Clear
          </Link>
        )}
      </div>
    </form>
  );
}
