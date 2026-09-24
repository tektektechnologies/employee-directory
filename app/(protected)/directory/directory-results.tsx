import Link from "next/link";
import { fetchDirectoryProfiles, type DirectoryFilters } from "@/lib/profiles/directory";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import { ProfileCard } from "./profile-card";

type DirectoryResultsProps = {
  supabase: SupabaseServerClient;
  filters: DirectoryFilters;
  retryHref: string;
};

function describeActiveFilters({ nameQuery, department }: DirectoryFilters) {
  const descriptions = [
    nameQuery && `names containing “${nameQuery}”`,
    department && `the ${department} department`,
  ].filter(Boolean);
  return descriptions.join(" in ");
}

export async function DirectoryResults({ supabase, filters, retryHref }: DirectoryResultsProps) {
  const { profiles, loadFailed } = await fetchDirectoryProfiles(supabase, filters);
  const hasActiveFilters = Boolean(filters.nameQuery || filters.department);

  if (loadFailed || !profiles) {
    return (
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-900">
        <h2 className="font-semibold">The directory couldn&apos;t be loaded</h2>
        <p className="mt-1 text-sm">
          This is usually temporary. Check your connection and try again.
        </p>
        <Link
          href={retryHref}
          className="mt-4 inline-block rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-900 hover:border-red-400"
        >
          Try again
        </Link>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div role="status" className="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center">
        <h2 className="font-semibold text-stone-900">
          {hasActiveFilters ? "No colleagues match your filters" : "No one is in the directory yet"}
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          {hasActiveFilters
            ? `Nobody matched ${describeActiveFilters(filters)}. Try a shorter name or a different department.`
            : "Profiles will appear here as colleagues finish setting them up."}
        </p>
        {hasActiveFilters && (
          <Link
            href="/directory"
            className="mt-4 inline-block text-sm font-medium text-indigo-700 underline-offset-2 hover:underline"
          >
            Clear filters
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      <p role="status" className="mb-4 text-sm text-stone-600">
        {profiles.length === 1 ? "1 colleague" : `${profiles.length} colleagues`}
        {hasActiveFilters && ` matching ${describeActiveFilters(filters)}`}
      </p>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {profiles.map((profile) => (
          <ProfileCard key={profile.id} profile={profile} />
        ))}
      </ul>
    </>
  );
}
