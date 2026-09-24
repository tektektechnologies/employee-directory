import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { safeNextPath } from "@/lib/auth/redirects";
import { getUser } from "@/lib/auth/user";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Create an account" };

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const { next } = await searchParams;
  const nextPath = safeNextPath(next);

  const { user } = await getUser();
  if (user) {
    redirect(nextPath);
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
      <ol className="mt-2 mb-6 list-inside list-decimal space-y-0.5 text-sm text-stone-600">
        <li>Register with your email and a password.</li>
        <li>Confirm your email using the link we send you.</li>
        <li>Set up your profile, then browse the directory.</li>
      </ol>
      <RegisterForm next={nextPath} />
    </>
  );
}
