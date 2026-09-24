"use server";

import type { AuthError } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { safeNextPath } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";
import type { AuthState } from "./form-state";

const MIN_PASSWORD_LENGTH = 8;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function authErrorMessage(error: AuthError) {
  switch (error.code) {
    case "invalid_credentials":
      return "That email and password don't match an account. Check both and try again.";
    case "email_not_confirmed":
      return "Your email isn't confirmed yet. Open the confirmation link we emailed you, then sign in.";
    case "user_already_exists":
    case "email_exists":
      return "An account with this email already exists. Sign in instead.";
    case "weak_password":
      return "That password is too easy to guess. Try a longer one with a mix of words and numbers.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many attempts in a short time. Wait a minute and try again.";
    case "signup_disabled":
      return "New registrations are turned off right now. Contact your administrator.";
    default:
      return "Something went wrong on our side. Please try again.";
  }
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = getField(formData, "email").trim();
  const password = getField(formData, "password");
  const next = safeNextPath(formData.get("next"));

  const errors: AuthState["errors"] = {};
  if (!EMAIL.test(email)) errors.email = "Enter your email address, like name@example.com.";
  if (!password) errors.password = "Enter your password.";
  if (Object.keys(errors).length > 0) {
    return { status: "error", message: "Please fix the fields below.", errors, email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { status: "error", message: authErrorMessage(error), email };
  }

  redirect(next);
}

export async function register(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = getField(formData, "email").trim();
  const password = getField(formData, "password");
  const confirmPassword = getField(formData, "confirmPassword");
  const next = safeNextPath(formData.get("next"));

  const errors: AuthState["errors"] = {};
  if (!EMAIL.test(email)) errors.email = "Enter your email address, like name@example.com.";
  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (!confirmPassword) {
    errors.confirmPassword = "Enter your password again.";
  } else if (confirmPassword !== password) {
    errors.confirmPassword = "This doesn't match the password above.";
  }
  if (Object.keys(errors).length > 0) {
    return { status: "error", message: "Please fix the fields below.", errors, email };
  }

  const origin = (await headers()).get("origin");
  const emailRedirectTo = origin
    ? `${origin}/auth/confirm?next=${encodeURIComponent(next)}`
    : undefined;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo },
  });
  if (error) {
    return { status: "error", message: authErrorMessage(error), email };
  }

  // Supabase only returns a session when email confirmation is turned off.
  if (data.session) {
    redirect(next);
  }

  // Supabase gives the same response for an existing email, so this message
  // doesn't reveal whether an account already exists.
  return { status: "success", email };
}
