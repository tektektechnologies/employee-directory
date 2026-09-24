import Link from "next/link";
import { secondaryButton, textLink } from "@/components/styles";
import { directoryHref, getProfiles, type Filters } from "@/lib/profiles/directory";
import { getPhotoUrls } from "@/lib/profiles/photos";
import type { ServerClient } from "@/lib/supabase/server";
import { ProfileCard } from "./profile-card";

type ResultsProps = {
  supabase: ServerClient;
  filters: Filters;
  userId: string;
};

function describeFilters({ query, department }: Filters) {
  const parts = [query && `matching “${query}”`, department && `in ${department}`].filter(Boolean);
  return parts.join(" ");
}

export async function Results({ supabase, filters, userId }: ResultsProps) {
  const { profiles, failed } = await getProfiles(supabase, filters);
  const filtered = Boolean(filters.query || filters.department);

  if (failed || !profiles) {
    return (
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-900">
        <h2 className="font-semibold">We couldn&apos;t load the directory</h2>
        <p className="mt-1 text-sm">This is usually temporary. Check your connection and try again.</p>
        <Link href={directoryHref(filters)} className={`${secondaryButton} mt-4 border-red-300`}>
          Try again
        </Link>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div role="status" className="rounded-xl border border-dashed border-stone-300 bg-white p-6 text-center sm:p-8">
        <h2 className="font-semibold text-stone-900">
          {filtered ? "No one matches your search" : "No one is in the directory yet"}
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          {filtered
            ? `We couldn't find anyone ${describeFilters(filters)}. Check the spelling, try part of the name, or choose All departments.`
            : "Profiles appear here as colleagues finish setting them up."}
        </p>
        {filtered && (
          <Link href="/directory" className={`${textLink} mt-4 inline-block text-sm`}>
            Clear search and show everyone
          </Link>
        )}
      </div>
    );
  }

  const count = profiles.length === 1 ? "1 person" : `${profiles.length} people`;

  const photoUrls = await getPhotoUrls(
    supabase,
    profiles.flatMap((profile) => (profile.photoPath ? [profile.photoPath] : [])),
  );

  return (
    <>
      <p role="status" className="mb-4 text-sm text-stone-600">
        {filtered ? `${count} ${describeFilters(filters)}` : `Showing all ${count}`}
      </p>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {profiles.map((profile) => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            photoUrl={profile.photoPath ? (photoUrls.get(profile.photoPath) ?? null) : null}
            isYou={profile.id === userId}
          />
        ))}
      </ul>
    </>
  );
}
