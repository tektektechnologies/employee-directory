"use client";

import Link from "next/link";
import { useActionState, useRef } from "react";
import { Field } from "@/components/field";
import { StatusMessage } from "@/components/status-message";
import { primaryButton, textLink } from "@/components/styles";
import { useFocusResult } from "@/components/use-focus-result";
import { signIn } from "../actions";
import { initialState } from "../form-state";

export type Notice = { tone: "error" | "info"; text: string };

type SignInFormProps = {
  next: string;
  notice?: Notice;
};

export function SignInForm({ next, notice }: SignInFormProps) {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  useFocusResult(formRef, messageRef, state);

  const message: Notice | undefined =
    state.status === "error" && state.message ? { tone: "error", text: state.message } : notice;

  return (
    <form ref={formRef} action={formAction} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />

      {message && (
        <StatusMessage ref={messageRef} tone={message.tone}>
          {message.text}
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
        autoComplete="current-password"
        error={state.errors?.password}
      />

      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "Signing in…" : "Sign in"}
      </button>

      <p className="text-center text-sm text-stone-600">
        Don&apos;t have an account?{" "}
        <Link href={`/register?next=${encodeURIComponent(next)}`} className={textLink}>
          Create one
        </Link>
      </p>
    </form>
  );
}
