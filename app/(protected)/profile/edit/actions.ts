"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buildSignInPath } from "@/lib/auth/redirects";
import { getVerifiedUser } from "@/lib/auth/verified-user";
import { parseProfileForm } from "@/lib/profiles/profile-fields";
import type { ProfileFormState } from "./form-state";

const UNIQUE_VIOLATION = "23505";
const CHECK_VIOLATION = "23514";

export async function saveOwnProfile(
  _previousState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  // The owner is always the verified user; the form has no id field, and any
  // id a client sends is ignored.
  const { supabase, user } = await getVerifiedUser();
  if (!user) {
    redirect(buildSignInPath("/profile/edit"));
  }

  const { values, fieldErrors, profileRow } = parseProfileForm(formData);
  if (!profileRow) {
    return {
      status: "error",
      message: "Some fields need attention. Fix the highlighted fields and save again.",
      fieldErrors,
      values,
    };
  }

  const saveFailedState: ProfileFormState = {
    status: "error",
    message: "Your profile couldn't be saved. Please try again.",
    values,
  };

  const { data: existingProfile, error: lookupError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (lookupError) {
    return saveFailedState;
  }

  let isFirstSave = !existingProfile;

  if (isFirstSave) {
    const { error: insertError } = await supabase
      .from("profiles")
      .insert({ id: user.id, ...profileRow });

    // A duplicate submission already created the row, so treat this as an edit.
    if (insertError?.code === UNIQUE_VIOLATION) {
      isFirstSave = false;
    } else if (insertError) {
      return insertError.code === CHECK_VIOLATION
        ? { ...saveFailedState, message: "Some values weren't accepted. Check your entries and try again." }
        : saveFailedState;
    }
  }

  if (!isFirstSave) {
    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update(profileRow)
      .eq("id", user.id)
      .select("id")
      .maybeSingle();
    if (updateError || !updatedProfile) {
      return updateError?.code === CHECK_VIOLATION
        ? { ...saveFailedState, message: "Some values weren't accepted. Check your entries and try again." }
        : saveFailedState;
    }
  }

  revalidatePath("/directory");
  revalidatePath(`/people/${user.id}`);

  if (isFirstSave) {
    redirect("/directory?welcome=1");
  }

  return { status: "success", message: "Your profile has been saved.", values };
}
