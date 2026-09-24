import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireVerifiedUser } from "@/lib/auth/verified-user";
import { getSafeContactLink, getSafeHttpsUrl } from "@/lib/profiles/external-links";
import { PROFILE_ROW_COLUMNS, type ProfileRow } from "@/lib/profiles/profile-fields";
import { ProfilePhoto } from "./profile-photo";

export const metadata: Metadata = { title: "Profile · Mathematics, Inc." };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type PersonProfileRow = ProfileRow & { id: string };

export default async function PersonPage({ params }: PageProps<"/people/[id]">) {
  const { id: requestedProfileId } = await params;
  const { supabase, user } = await requireVerifiedUser(
    `/people/${encodeURIComponent(requestedProfileId)}`,
  );

  // Malformed ids can't match a profile; skip the query rather than surface a
  // database type error as a failure.
  if (!UUID_PATTERN.test(requestedProfileId)) {
    notFound();
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(`id, ${PROFILE_ROW_COLUMNS}`)
    .eq("id", requestedProfileId)
    .maybeSingle<PersonProfileRow>();
  if (error) {
    throw new Error("Couldn't load this profile.");
  }
  if (!profile) {
    notFound();
  }

  const isOwnProfile = profile.id === user.id;
  const safePhotoUrl = getSafeHttpsUrl(profile.photo_url);
  const safeContactLink = getSafeContactLink(profile.contact_url);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/directory"
        className="inline-flex items-center gap-1 rounded text-sm font-medium text-stone-600 hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        <span aria-hidden="true">←</span> Back to directory
      </Link>

      <article
        aria-labelledby="person-name"
        className="mt-4 rounded-xl border border-stone-200 bg-white shadow-sm"
      >
        <header className="flex flex-col gap-5 border-b border-stone-200 p-5 sm:flex-row sm:items-center sm:p-8">
          <ProfilePhoto photoUrl={safePhotoUrl} fullName={profile.full_name} />
          <div className="min-w-0 flex-1">
            <h1 id="person-name" className="text-2xl font-semibold tracking-tight break-words">
              {profile.full_name}
            </h1>
            {(profile.job_title || profile.department) && (
              <p className="mt-1 text-stone-700">
                {[profile.job_title, profile.department].filter(Boolean).join(" · ")}
              </p>
            )}
            {profile.location && <p className="mt-0.5 text-sm text-stone-500">{profile.location}</p>}
          </div>
          {isOwnProfile && (
            <Link
              href="/profile/edit"
              className="self-start rounded-md bg-stone-900 px-4 py-2 text-center text-sm font-medium text-white hover:bg-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:self-center"
            >
              Edit profile
            </Link>
          )}
        </header>

        <div className="flex flex-col gap-8 p-5 sm:p-8">
          {profile.bio && (
            <section aria-labelledby="person-about">
              <h2 id="person-about" className="text-sm font-semibold tracking-wide text-stone-500 uppercase">
                About
              </h2>
              <p className="mt-2 whitespace-pre-line break-words text-stone-800">{profile.bio}</p>
            </section>
          )}

          {profile.interests.length > 0 && (
            <section aria-labelledby="person-interests">
              <h2 id="person-interests" className="text-sm font-semibold tracking-wide text-stone-500 uppercase">
                Interests
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {profile.interests.map((interest) => (
                  <li
                    key={interest}
                    className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-sm text-indigo-900"
                  >
                    {interest}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {safeContactLink && (
            <section aria-labelledby="person-contact">
              <h2 id="person-contact" className="text-sm font-semibold tracking-wide text-stone-500 uppercase">
                Contact
              </h2>
              <p className="mt-2 break-all">
                <a
                  href={safeContactLink.href}
                  {...(safeContactLink.kind === "web"
                    ? { target: "_blank", rel: "noopener noreferrer nofollow" }
                    : {})}
                  className="rounded font-medium text-indigo-700 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  {safeContactLink.kind === "email" ? "Email " : "Visit "}
                  {safeContactLink.label}
                  {safeContactLink.kind === "web" && (
                    <span className="sr-only"> (opens in a new tab)</span>
                  )}
                </a>
              </p>
            </section>
          )}
        </div>
      </article>
    </div>
  );
}
