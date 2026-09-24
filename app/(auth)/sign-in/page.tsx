import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSafeRedirectPath } from "@/lib/auth/redirects";
import { getVerifiedUser } from "@/lib/auth/verified-user";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in · Mathematics, Inc." };

const noticeMessages: Record<string, string> = {
  confirmation_failed:
    "That confirmation link is invalid or has expired. Sign in, or register again to get a new link.",
};

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const { next, error } = await searchParams;
  const redirectPath = getSafeRedirectPath(next);

  const { user } = await getVerifiedUser();
  if (user) {
    redirect(redirectPath);
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-1.5 mb-6 text-sm text-stone-600">
        Use your company account to open the directory.
      </p>
      <SignInForm
        redirectPath={redirectPath}
        noticeMessage={typeof error === "string" ? noticeMessages[error] : undefined}
      />
    </>
  );
}
