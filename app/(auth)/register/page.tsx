import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSafeRedirectPath } from "@/lib/auth/redirects";
import { getVerifiedUser } from "@/lib/auth/verified-user";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Create an account · Mathematics, Inc." };

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const { next } = await searchParams;
  const redirectPath = getSafeRedirectPath(next);

  const { user } = await getVerifiedUser();
  if (user) {
    redirect(redirectPath);
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
      <p className="mt-1.5 mb-6 text-sm text-stone-600">
        Register with your work email to join the directory.
      </p>
      <RegisterForm redirectPath={redirectPath} />
    </>
  );
}
