import Link from "next/link";
import type { CardProfile } from "@/lib/profiles/directory";

type ProfileCardProps = {
  profile: CardProfile;
  isYou: boolean;
};

export function ProfileCard({ profile, isYou }: ProfileCardProps) {
  const roleLine = [profile.jobTitle, profile.department].filter(Boolean).join(" · ");

  return (
    <li className="relative flex flex-col rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-indigo-600 hover:border-stone-300 hover:shadow-md">
      <h2 className="flex items-start justify-between gap-2 text-base font-semibold text-stone-900">
        {/* The link covers the whole card, so the card is one tab stop. */}
        <Link href={`/people/${profile.id}`} className="outline-none after:absolute after:inset-0 after:rounded-xl">
          {profile.fullName}
        </Link>
        {isYou && (
          <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-800">
            You
          </span>
        )}
      </h2>
      {roleLine && <p className="mt-0.5 text-sm text-stone-700">{roleLine}</p>}
      {profile.location && (
        <p className="mt-1 text-sm text-stone-500">
          <span className="sr-only">Location: </span>
          {profile.location}
        </p>
      )}
      {profile.bio && <p className="mt-3 line-clamp-3 text-sm text-stone-600">{profile.bio}</p>}
    </li>
  );
}
