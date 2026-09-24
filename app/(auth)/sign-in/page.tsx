import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { safeNextPath } from "@/lib/auth/redirects";
import { getUser } from "@/lib/auth/user";
import { SignInForm, type Notice } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

const notices: Record<string, Notice> = {
  confirmation_failed: {
    tone: "error",
    text: "That confirmation link didn't work. It may have expired, been used already, or been opened in a different browser. Try signing in. If your email isn't confirmed yet, register again to get a new link.",
  },
  signed_out: { tone: "info", text: "You've been signed out." },
};

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const { next, error, notice } = await searchParams;
  const nextPath = safeNextPath(next);

  const { user } = await getUser();
  if (user) {
    redirect(nextPath);
  }

  const key = typeof error === "string" ? error : typeof notice === "string" ? notice : "";

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-1.5 mb-6 text-sm text-stone-600">
        Welcome back. If you haven&apos;t set up your profile yet, you&apos;ll do that next.
      </p>
      <SignInForm next={nextPath} notice={notices[key]} />
    </>
  );
}
