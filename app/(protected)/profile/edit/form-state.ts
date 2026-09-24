import type { ProfileField, ProfileValues } from "@/lib/profiles/fields";

export type ProfileState = {
  status: "idle" | "error" | "success";
  message?: string;
  errors?: Partial<Record<ProfileField, string>>;
  values?: ProfileValues;
};

export const initialState: ProfileState = { status: "idle" };
