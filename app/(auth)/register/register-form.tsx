"use client";

import Link from "next/link";
import { useActionState, useRef } from "react";
import { Field } from "@/components/field";
import { StatusMessage } from "@/components/status-message";
import { primaryButton, textLink } from "@/components/styles";
import { useFocusResult } from "@/components/use-focus-result";
import { register } from "../actions";
import { initialState } from "../form-state";

type RegisterFormProps = {
  next: string;
};

export function RegisterForm({ next }: RegisterFormProps) {
  const [state, formAction, pending] = useActionState(register, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  useFocusResult(formRef, messageRef, state);

  const signInHref = `/sign-in?next=${encodeURIComponent(next)}`;

  if (state.status === "success") {
    return (
      <div className="flex flex-col gap-5">
        <StatusMessage ref={messageRef} tone="success">
          <p className="font-medium">Check your inbox</p>
          <p className="mt-1">
            We sent a confirmation link to <strong>{state.email}</strong>. Open it in this browser
            to finish signing up. You&apos;ll then set up your profile.
          </p>
        </StatusMessage>
        <p className="text-sm text-stone-600">
          No email after a few minutes? Check your spam folder, or make sure the address above is
          right and register again.
        </p>
        <Link href={signInHref} className={`${textLink} self-start text-sm`}>
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />

      {state.status === "error" && state.message && (
        <StatusMessage ref={messageRef} tone="error">
          {state.message}
        </StatusMessage>
      )}

      <Field
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        defaultValue={state.email}
        error={state.errors?.email}
      />
      <Field
        name="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        hint="At least 8 characters."
        error={state.errors?.password}
      />
      <Field
        name="confirmPassword"
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        error={state.errors?.confirmPassword}
      />

      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "Creating account…" : "Create account"}
      </button>

      <p className="text-center text-sm text-stone-600">
        Already have an account?{" "}
        <Link href={signInHref} className={textLink}>
          Sign in
        </Link>
      </p>
    </form>
  );
}
