"use client";

import Link from "next/link";
import { useActionState, useRef } from "react";
import { Field, Select, TextArea } from "@/components/field";
import { StatusMessage } from "@/components/status-message";
import { primaryButton, secondaryButton, textLink } from "@/components/styles";
import { useFocusResult } from "@/components/use-focus-result";
import { DEPARTMENTS, LIMITS, type ProfileValues } from "@/lib/profiles/fields";
import { saveProfile } from "./actions";
import { initialState } from "./form-state";

type ProfileFormProps = {
  saved: ProfileValues;
  isNew: boolean;
  profileHref: string;
};

export function ProfileForm({ saved, isNew, profileHref }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(saveProfile, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  useFocusResult(formRef, messageRef, state);

  const values = state.values ?? saved;
  const errors = state.errors ?? {};

  return (
    <form ref={formRef} action={formAction} noValidate className="flex flex-col gap-6">
      {state.status === "error" && (
        <StatusMessage ref={messageRef} tone="error">
          {state.message}
        </StatusMessage>
      )}
      {state.status === "success" && (
        <StatusMessage ref={messageRef} tone="success">
          {state.message}{" "}
          <Link href={profileHref} className={textLink}>
            View your profile
          </Link>
        </StatusMessage>
      )}

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="mb-4 text-base font-semibold text-stone-900">About you</legend>
        <div className="sm:col-span-2">
          <Field
            name="fullName"
            label="Full name"
            type="text"
            autoComplete="name"
            maxLength={LIMITS.fullName}
            defaultValue={values.fullName}
            error={errors.fullName}
          />
        </div>
        <Field
          name="jobTitle"
          label="Role"
          type="text"
          autoComplete="organization-title"
          maxLength={LIMITS.jobTitle}
          hint="For example, Data Scientist."
          defaultValue={values.jobTitle}
          error={errors.jobTitle}
        />
        <Select
          name="department"
          label="Department"
          options={DEPARTMENTS}
          placeholder="Choose a department"
          defaultValue={values.department}
          error={errors.department}
        />
        <div className="sm:col-span-2">
          <Field
            name="location"
            label="Location"
            type="text"
            autoComplete="address-level2"
            maxLength={LIMITS.location}
            hint="City or office, for example Boston or Remote."
            defaultValue={values.location}
            error={errors.location}
          />
        </div>
        <div className="sm:col-span-2">
          <TextArea
            name="bio"
            label="Bio"
            maxLength={LIMITS.bio}
            hint={`What you work on and how colleagues can help. Up to ${LIMITS.bio} characters.`}
            defaultValue={values.bio}
            error={errors.bio}
          />
        </div>
        <div className="sm:col-span-2">
          <Field
            name="interests"
            label="Interests"
            type="text"
            autoComplete="off"
            hint={`Separate with commas, for example: topology, cycling, chess. Up to ${LIMITS.interestCount}.`}
            defaultValue={values.interests}
            error={errors.interests}
          />
        </div>
      </fieldset>

      <fieldset className="grid gap-5 border-t border-stone-200 pt-6 sm:grid-cols-2">
        <legend className="mb-4 text-base font-semibold text-stone-900">Links</legend>
        <Field
          name="photoUrl"
          label="Photo URL"
          type="url"
          inputMode="url"
          autoComplete="photo"
          required={false}
          maxLength={LIMITS.url}
          hint="Link to an image, starting with https://"
          defaultValue={values.photoUrl}
          error={errors.photoUrl}
        />
        <Field
          name="contactUrl"
          label="Contact link"
          type="text"
          inputMode="url"
          autoComplete="url"
          required={false}
          maxLength={LIMITS.url}
          hint="An https:// link, or mailto:you@example.com"
          defaultValue={values.contactUrl}
          error={errors.contactUrl}
        />
      </fieldset>

      <div className="flex flex-col-reverse gap-3 border-t border-stone-200 pt-6 sm:flex-row sm:items-center sm:justify-end">
        {!isNew && (
          <Link href={profileHref} className={secondaryButton}>
            Cancel
          </Link>
        )}
        <button type="submit" disabled={pending} className={`${primaryButton} px-5`}>
          {pending ? "Saving…" : isNew ? "Save and open directory" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
