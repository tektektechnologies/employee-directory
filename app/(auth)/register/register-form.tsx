"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormField } from "@/components/form-field";
import { FormStatusMessage } from "@/components/form-status-message";
import { registerWithPassword } from "../actions";
import { initialAuthFormState } from "../form-state";

type RegisterFormProps = {
  redirectPath: string;
};

export function RegisterForm({ redirectPath }: RegisterFormProps) {
  const [formState, submitRegistration, isSubmitting] = useActionState(
    registerWithPassword,
    initialAuthFormState,
  );

  if (formState.status === "success" && formState.message) {
    return (
      <div className="flex flex-col gap-5">
        <FormStatusMessage tone="success" message={formState.message} />
        <Link
          href={`/sign-in?next=${encodeURIComponent(redirectPath)}`}
          className="text-center text-sm font-medium text-indigo-700 underline-offset-2 hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={submitRegistration} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="next" value={redirectPath} />

      {formState.status === "error" && formState.message && (
        <FormStatusMessage tone="error" message={formState.message} />
      )}

      <FormField
        name="email"
        label="Work email"
        type="email"
        autoComplete="email"
        defaultValue={formState.submittedEmail}
        errorMessage={formState.fieldErrors?.email}
      />
      <FormField
        name="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        hint="At least 8 characters."
        errorMessage={formState.fieldErrors?.password}
      />
      <FormField
        name="confirmPassword"
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        errorMessage={formState.fieldErrors?.confirmPassword}
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Creating account…" : "Create account"}
      </button>

      <p className="text-center text-sm text-stone-600">
        Already registered?{" "}
        <Link
          href={`/sign-in?next=${encodeURIComponent(redirectPath)}`}
          className="font-medium text-indigo-700 underline-offset-2 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
