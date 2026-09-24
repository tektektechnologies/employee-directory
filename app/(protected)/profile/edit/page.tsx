import type { Metadata } from "next";
import Link from "next/link";
import { requireVerifiedUser } from "@/lib/auth/verified-user";
import {
  PROFILE_ROW_COLUMNS,
  emptyProfileFormValues,
  profileRowToFormValues,
  type ProfileRow,
} from "@/lib/profiles/profile-fields";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Your profile · Mathematics, Inc." };

export default async function EditProfilePage() {
  const { supabase, user } = await requireVerifiedUser("/profile/edit");

  const { data: savedProfile, error } = await supabase
    .from("profiles")
    .select(PROFILE_ROW_COLUMNS)
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();
  if (error) {
    throw new Error("Couldn't load your profile.");
  }

  const isFirstSave = !savedProfile;

  return (
    <div className="mx-auto max-w-2xl">
      {isFirstSave ? (
        <>
          <p className="text-sm font-medium text-indigo-700">Welcome to Mathematics, Inc.</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Set up your profile</h1>
          <p className="mt-2 text-stone-600">
            Tell colleagues who you are and what you work on. You&apos;ll see the directory
            as soon as you save, and you can change these details at any time.
          </p>
        </>
      ) : (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Edit your profile</h1>
            <p className="mt-2 text-stone-600">Changes are visible to colleagues once saved.</p>
          </div>
          <Link
            href={`/people/${user.id}`}
            className="text-sm font-medium text-indigo-700 underline-offset-2 hover:underline"
          >
            View your profile
          </Link>
        </div>
      )}

      <div className="mt-8 rounded-xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
        <ProfileForm
          isFirstSave={isFirstSave}
          savedValues={savedProfile ? profileRowToFormValues(savedProfile) : emptyProfileFormValues}
        />
      </div>
    </div>
  );
}
