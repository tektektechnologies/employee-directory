"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormField } from "@/components/form-field";
import { FormStatusMessage } from "@/components/form-status-message";
import { signInWithPassword } from "../actions";
import { initialAuthFormState } from "../form-state";

type SignInFormProps = {
  redirectPath: string;
  noticeMessage?: string;
};

export function SignInForm({ redirectPath, noticeMessage }: SignInFormProps) {
  const [formState, submitSignIn, isSubmitting] = useActionState(
    signInWithPassword,
    initialAuthFormState,
  );

  return (
    <form action={submitSignIn} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="next" value={redirectPath} />

      {formState.status === "error" && formState.message ? (
        <FormStatusMessage tone="error" message={formState.message} />
      ) : (
        noticeMessage && <FormStatusMessage tone="error" message={noticeMessage} />
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
        autoComplete="current-password"
        errorMessage={formState.fieldErrors?.password}
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Signing in…" : "Sign in"}
      </button>

      <p className="text-center text-sm text-stone-600">
        New here?{" "}
        <Link
          href={`/register?next=${encodeURIComponent(redirectPath)}`}
          className="font-medium text-indigo-700 underline-offset-2 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
