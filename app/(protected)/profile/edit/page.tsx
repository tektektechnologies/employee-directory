import type { Metadata } from "next";
import Link from "next/link";
import { textLink } from "@/components/styles";
import { requireUser } from "@/lib/auth/user";
import { PROFILE_COLUMNS, emptyValues, rowToValues, type ProfileRow } from "@/lib/profiles/fields";
import { getPhotoUrl } from "@/lib/profiles/photos";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Your profile" };

export default async function EditProfilePage() {
  const { supabase, user } = await requireUser("/profile/edit");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();
  if (error) {
    console.error("Loading profile failed:", error.message);
    throw new Error("Couldn't load your profile.");
  }

  const isNew = !profile;
  const photoSrc = await getPhotoUrl(supabase, profile?.photo_path ?? null);
  const profileHref = `/people/${user.id}`;

  return (
    <div className="mx-auto max-w-2xl">
      {isNew ? (
        <>
          <p className="text-sm font-medium text-indigo-700">Last step</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Set up your profile</h1>
          <p className="mt-2 text-stone-600">
            Your account is ready. Tell colleagues who you are and what you work on. The directory
            opens as soon as you save, and you can change these details any time.
          </p>
        </>
      ) : (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Edit your profile</h1>
            <p className="mt-1.5 text-stone-600">Colleagues see your changes as soon as you save.</p>
          </div>
          <Link href={profileHref} className={`${textLink} text-sm`}>
            View your profile
          </Link>
        </div>
      )}

      <p className="mt-4 text-sm text-stone-500">
        All fields are required unless marked optional.
      </p>

      <div className="mt-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-8">
        <ProfileForm
          isNew={isNew}
          profileHref={profileHref}
          userId={user.id}
          photoSrc={photoSrc}
          saved={profile ? rowToValues(profile) : emptyValues}
        />
      </div>
    </div>
  );
}
