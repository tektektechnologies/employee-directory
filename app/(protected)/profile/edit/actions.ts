"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signInPath } from "@/lib/auth/redirects";
import { getUser } from "@/lib/auth/user";
import { validateProfile } from "@/lib/profiles/fields";
import { PHOTO_BUCKET } from "@/lib/profiles/photos";
import type { ProfileState } from "./form-state";

const UNIQUE_VIOLATION = "23505";
const CHECK_VIOLATION = "23514";

export async function saveProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  // The owner is always the signed-in user. The form has no id field, and any
  // id a client adds is ignored.
  const { supabase, user } = await getUser();
  if (!user) {
    redirect(signInPath("/profile/edit"));
  }

  const { values, errors, row } = validateProfile(formData, user.id);
  if (!row) {
    const count = Object.keys(errors).length;
    return {
      status: "error",
      message: count === 1 ? "One field needs your attention." : `${count} fields need your attention.`,
      errors,
      values,
    };
  }

  const failed = (code?: string): ProfileState => ({
    status: "error",
    message:
      code === CHECK_VIOLATION
        ? "Some values weren't accepted. Check your entries and try again."
        : "Your profile couldn't be saved. Your changes are still here, so please try again.",
    values,
  });

  const { data: existing, error: lookupError } = await supabase
    .from("profiles")
    .select("id, photo_path")
    .eq("id", user.id)
    .maybeSingle<{ id: string; photo_path: string | null }>();
  if (lookupError) {
    return failed();
  }

  let isNew = !existing;

  if (isNew) {
    const { error } = await supabase.from("profiles").insert({ id: user.id, ...row });
    // A double submit already created the row, so save this as an edit.
    if (error?.code === UNIQUE_VIOLATION) {
      isNew = false;
    } else if (error) {
      return failed(error.code);
    }
  }

  if (!isNew) {
    const { data: updated, error } = await supabase
      .from("profiles")
      .update(row)
      .eq("id", user.id)
      .select("id")
      .maybeSingle();
    if (error || !updated) {
      return failed(error?.code);
    }
  }

  const oldPhoto = existing?.photo_path;
  if (oldPhoto && oldPhoto !== row.photo_path) {
    // Best effort: a leftover file is harmless, so a failure here doesn't
    // fail the save.
    await supabase.storage.from(PHOTO_BUCKET).remove([oldPhoto]);
  }

  revalidatePath("/", "layout");

  if (isNew) {
    redirect("/directory?welcome=1");
  }

  return { status: "success", message: "Your changes are saved.", values };
}
