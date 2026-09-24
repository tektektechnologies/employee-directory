"use client";

import { useActionState } from "react";
import { FormField, TextAreaField } from "@/components/form-field";
import { FormStatusMessage } from "@/components/form-status-message";
import { PROFILE_LIMITS, type ProfileFormValues } from "@/lib/profiles/profile-fields";
import { saveOwnProfile } from "./actions";
import { initialProfileFormState } from "./form-state";

type ProfileFormProps = {
  savedValues: ProfileFormValues;
  isFirstSave: boolean;
};

export function ProfileForm({ savedValues, isFirstSave }: ProfileFormProps) {
  const [formState, submitProfile, isSaving] = useActionState(
    saveOwnProfile,
    initialProfileFormState,
  );
  const fieldValues = formState.values ?? savedValues;
  const fieldErrors = formState.fieldErrors ?? {};

  return (
    <form action={submitProfile} noValidate className="flex flex-col gap-6">
      {formState.message && formState.status !== "idle" && (
        <FormStatusMessage
          tone={formState.status === "success" ? "success" : "error"}
          message={formState.message}
        />
      )}

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="mb-4 text-base font-semibold text-stone-900">About you</legend>
        <div className="sm:col-span-2">
          <FormField
            name="fullName"
            label="Full name"
            type="text"
            autoComplete="name"
            maxLength={PROFILE_LIMITS.fullName}
            defaultValue={fieldValues.fullName}
            errorMessage={fieldErrors.fullName}
          />
        </div>
        <FormField
          name="jobTitle"
          label="Role"
          type="text"
          autoComplete="organization-title"
          maxLength={PROFILE_LIMITS.jobTitle}
          hint="For example, Data Scientist."
          defaultValue={fieldValues.jobTitle}
          errorMessage={fieldErrors.jobTitle}
        />
        <FormField
          name="department"
          label="Department"
          type="text"
          autoComplete="off"
          maxLength={PROFILE_LIMITS.department}
          hint="For example, Applied Research."
          defaultValue={fieldValues.department}
          errorMessage={fieldErrors.department}
        />
        <div className="sm:col-span-2">
          <FormField
            name="location"
            label="Location"
            type="text"
            autoComplete="address-level2"
            maxLength={PROFILE_LIMITS.location}
            hint="City or office, for example Boston or Remote."
            defaultValue={fieldValues.location}
            errorMessage={fieldErrors.location}
          />
        </div>
        <div className="sm:col-span-2">
          <TextAreaField
            name="bio"
            label="Bio"
            maxLength={PROFILE_LIMITS.bio}
            hint={`What you work on and how colleagues can help. Up to ${PROFILE_LIMITS.bio} characters.`}
            defaultValue={fieldValues.bio}
            errorMessage={fieldErrors.bio}
          />
        </div>
        <div className="sm:col-span-2">
          <FormField
            name="interests"
            label="Interests"
            type="text"
            autoComplete="off"
            hint={`Separate with commas, for example: topology, cycling, chess. Up to ${PROFILE_LIMITS.interestCount}.`}
            defaultValue={fieldValues.interests}
            errorMessage={fieldErrors.interests}
          />
        </div>
      </fieldset>

      <fieldset className="grid gap-5 border-t border-stone-200 pt-6 sm:grid-cols-2">
        <legend className="mb-4 text-base font-semibold text-stone-900">Links</legend>
        <FormField
          name="photoUrl"
          label="Photo URL"
          type="url"
          inputMode="url"
          autoComplete="photo"
          required={false}
          maxLength={PROFILE_LIMITS.url}
          hint="A link to an image, starting with https://."
          defaultValue={fieldValues.photoUrl}
          errorMessage={fieldErrors.photoUrl}
        />
        <FormField
          name="contactUrl"
          label="Contact link"
          type="text"
          inputMode="url"
          autoComplete="url"
          required={false}
          maxLength={PROFILE_LIMITS.url}
          hint="An https:// link or mailto:you@example.com."
          defaultValue={fieldValues.contactUrl}
          errorMessage={fieldErrors.contactUrl}
        />
      </fieldset>

      <div className="flex flex-col-reverse gap-3 border-t border-stone-200 pt-6 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-md bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving…" : isFirstSave ? "Save and continue" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
