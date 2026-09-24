"use server";

import type { AuthError } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSafeRedirectPath } from "@/lib/auth/redirects";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AuthFormState } from "./form-state";

const MINIMUM_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readTextField(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);
  return typeof value === "string" ? value : "";
}

function describeAuthError(error: AuthError) {
  switch (error.code) {
    case "invalid_credentials":
      return "That email and password don't match an account.";
    case "email_not_confirmed":
      return "Confirm your email address first. Check your inbox for the confirmation link.";
    case "user_already_exists":
    case "email_exists":
      return "An account with this email already exists. Try signing in instead.";
    case "weak_password":
      return error.message || "Choose a stronger password.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many attempts. Wait a minute and try again.";
    case "signup_disabled":
      return "New registrations are currently disabled.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export async function signInWithPassword(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = readTextField(formData, "email").trim();
  const password = readTextField(formData, "password");
  const redirectPath = getSafeRedirectPath(formData.get("next"));

  const fieldErrors: AuthFormState["fieldErrors"] = {};
  if (!EMAIL_PATTERN.test(email)) fieldErrors.email = "Enter a valid email address.";
  if (!password) fieldErrors.password = "Enter your password.";
  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors,
      submittedEmail: email,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { status: "error", message: describeAuthError(error), submittedEmail: email };
  }

  redirect(redirectPath);
}

export async function registerWithPassword(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = readTextField(formData, "email").trim();
  const password = readTextField(formData, "password");
  const confirmPassword = readTextField(formData, "confirmPassword");
  const redirectPath = getSafeRedirectPath(formData.get("next"));

  const fieldErrors: AuthFormState["fieldErrors"] = {};
  if (!EMAIL_PATTERN.test(email)) fieldErrors.email = "Enter a valid email address.";
  if (password.length < MINIMUM_PASSWORD_LENGTH) {
    fieldErrors.password = `Use at least ${MINIMUM_PASSWORD_LENGTH} characters.`;
  }
  if (confirmPassword !== password) fieldErrors.confirmPassword = "Passwords don't match.";
  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors,
      submittedEmail: email,
    };
  }

  const requestOrigin = (await headers()).get("origin");
  const emailRedirectTo = requestOrigin
    ? `${requestOrigin}/auth/confirm?next=${encodeURIComponent(redirectPath)}`
    : undefined;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo },
  });
  if (error) {
    return { status: "error", message: describeAuthError(error), submittedEmail: email };
  }

  // A session is returned only when email confirmation is disabled.
  if (data.session) {
    redirect(redirectPath);
  }

  // Supabase returns the same response for an already-registered email, so
  // this message deliberately doesn't reveal whether the account exists.
  return {
    status: "success",
    message: `Check ${email} for a confirmation link to finish creating your account. You can close this page.`,
    submittedEmail: email,
  };
}
