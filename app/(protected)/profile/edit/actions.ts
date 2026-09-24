"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signInPath } from "@/lib/auth/redirects";
import { getUser } from "@/lib/auth/user";
import { validateProfile } from "@/lib/profiles/fields";
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

  const { values, errors, row } = validateProfile(formData);
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
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
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

  revalidatePath("/", "layout");

  if (isNew) {
    redirect("/directory?welcome=1");
  }

  return { status: "success", message: "Your changes are saved.", values };
}
