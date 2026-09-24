import type { ProfileFieldName, ProfileFormValues } from "@/lib/profiles/profile-fields";

export type ProfileFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<Record<ProfileFieldName, string>>;
  values?: ProfileFormValues;
};

export const initialProfileFormState: ProfileFormState = { status: "idle" };
