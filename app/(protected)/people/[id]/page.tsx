import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { primaryButton, textLink } from "@/components/styles";
import { requireUser } from "@/lib/auth/user";
import { PROFILE_COLUMNS, type ProfileRow } from "@/lib/profiles/fields";
import { toContactLink } from "@/lib/profiles/links";
import { getPhotoUrl } from "@/lib/profiles/photos";
import { ProfilePhoto } from "./profile-photo";

export const metadata: Metadata = { title: "Profile" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const sectionHeading = "text-sm font-semibold tracking-wide text-stone-500 uppercase";

export default async function PersonPage({ params }: PageProps<"/people/[id]">) {
  const { id } = await params;
  const { supabase, user } = await requireUser(`/people/${encodeURIComponent(id)}`);

  // Malformed ids can't match a profile; skip the query rather than surface a
  // database type error as a failure.
  if (!UUID.test(id)) {
    notFound();
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(`id, ${PROFILE_COLUMNS}`)
    .eq("id", id)
    .maybeSingle<ProfileRow & { id: string }>();
  if (error) {
    console.error("Loading profile failed:", error.message);
    throw new Error("Couldn't load this profile.");
  }
  if (!profile) {
    notFound();
  }

  const isOwn = profile.id === user.id;
  const photoUrl = await getPhotoUrl(supabase, profile.photo_path);
  const contact = toContactLink(profile.contact_url);
  const roleLine = [profile.job_title, profile.department].filter(Boolean).join(" · ");

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/directory" className={`${textLink} inline-flex items-center gap-1 text-sm`}>
        <span aria-hidden="true">←</span> Back to directory
      </Link>

      <article aria-labelledby="person-name" className="mt-4 rounded-xl border border-stone-200 bg-white shadow-sm">
        <header className="flex flex-col gap-5 border-b border-stone-200 p-5 sm:flex-row sm:items-center sm:p-8">
          <ProfilePhoto photoUrl={photoUrl} fullName={profile.full_name} />
          <div className="min-w-0 flex-1">
            <h1 id="person-name" className="text-2xl font-semibold tracking-tight wrap-break-word">
              {profile.full_name}
              {isOwn && <span className="ml-2 align-middle text-sm font-normal text-stone-500">(you)</span>}
            </h1>
            {roleLine && <p className="mt-1 text-stone-700">{roleLine}</p>}
            {profile.location && (
              <p className="mt-0.5 text-sm text-stone-500">
                <span className="sr-only">Location: </span>
                {profile.location}
              </p>
            )}
          </div>
          {isOwn && (
            <Link href="/profile/edit" className={`${primaryButton} self-start sm:self-center`}>
              Edit profile
            </Link>
          )}
        </header>

        <div className="flex flex-col gap-8 p-5 sm:p-8">
          {profile.bio && (
            <section aria-labelledby="person-about">
              <h2 id="person-about" className={sectionHeading}>
                About
              </h2>
              <p className="mt-2 whitespace-pre-line wrap-break-word text-stone-800">{profile.bio}</p>
            </section>
          )}

          {profile.interests.length > 0 && (
            <section aria-labelledby="person-interests">
              <h2 id="person-interests" className={sectionHeading}>
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

          {contact && (
            <section aria-labelledby="person-contact">
              <h2 id="person-contact" className={sectionHeading}>
                Contact
              </h2>
              <p className="mt-2 break-all">
                <a
                  href={contact.href}
                  {...(contact.kind === "web" ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {})}
                  className={textLink}
                >
                  {contact.kind === "email" ? "Email " : "Visit "}
                  {contact.label}
                  {contact.kind === "web" && <span className="sr-only"> (opens in a new tab)</span>}
                </a>
              </p>
            </section>
          )}
        </div>
      </article>
    </div>
  );
}
