import Link from "next/link";
import type { DirectoryCardProfile } from "@/lib/profiles/directory";

type ProfileCardProps = {
  profile: DirectoryCardProfile;
};

export function ProfileCard({ profile }: ProfileCardProps) {
  const roleAndDepartment = [profile.jobTitle, profile.department].filter(Boolean).join(" · ");

  return (
    <li className="relative flex flex-col rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-indigo-600 hover:shadow-md">
      <h2 className="text-base font-semibold text-stone-900">
        {/* The stretched link makes the whole card clickable with a single tab stop. */}
        <Link
          href={`/people/${profile.id}`}
          className="outline-none after:absolute after:inset-0 after:rounded-xl"
        >
          {profile.fullName}
        </Link>
      </h2>
      {roleAndDepartment && <p className="mt-0.5 text-sm text-stone-700">{roleAndDepartment}</p>}
      {profile.location && (
        <p className="mt-1 text-sm text-stone-500">
          <span className="sr-only">Location: </span>
          {profile.location}
        </p>
      )}
      {profile.bioPreview && (
        <p className="mt-3 line-clamp-3 text-sm text-stone-600">{profile.bioPreview}</p>
      )}
    </li>
  );
}
