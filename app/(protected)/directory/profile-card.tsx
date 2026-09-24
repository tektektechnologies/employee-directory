import Link from "next/link";
import { EmptyAvatar } from "@/components/empty-avatar";
import type { CardProfile } from "@/lib/profiles/directory";

type ProfileCardProps = {
  profile: CardProfile;
  photoUrl: string | null;
  isYou: boolean;
};

export function ProfileCard({ profile, photoUrl, isYou }: ProfileCardProps) {
  const roleLine = [profile.jobTitle, profile.department].filter(Boolean).join(" · ");

  return (
    <li className="relative flex flex-col rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-indigo-600 hover:border-stone-300 hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className="size-14 shrink-0 overflow-hidden rounded-full border border-stone-200 bg-stone-100">
          {photoUrl ? (
            // The name is right beside the photo, so it's decorative for screen readers.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
          ) : (
            <EmptyAvatar className="p-2.5" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="flex items-start justify-between gap-2 text-base font-semibold text-stone-900">
            {/* The link covers the whole card, so the card is one tab stop. */}
            <Link
              href={`/people/${profile.id}`}
              className="min-w-0 wrap-break-word outline-none after:absolute after:inset-0 after:rounded-xl"
            >
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
            <p className="mt-0.5 text-sm text-stone-500">
              <span className="sr-only">Location: </span>
              {profile.location}
            </p>
          )}
        </div>
      </div>

      {profile.bio && <p className="mt-4 line-clamp-3 text-sm text-stone-600">{profile.bio}</p>}
    </li>
  );
}
