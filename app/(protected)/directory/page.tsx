import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FormStatusMessage } from "@/components/form-status-message";
import { requireVerifiedUser } from "@/lib/auth/verified-user";

export const metadata: Metadata = { title: "Directory · Mathematics, Inc." };

export default async function DirectoryPage({ searchParams }: PageProps<"/directory">) {
  const { supabase, user } = await requireVerifiedUser("/directory");

  const { data: ownProfile, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (error) {
    throw new Error("Couldn't load your profile.");
  }
  if (!ownProfile) {
    redirect("/profile/edit");
  }

  const { welcome } = await searchParams;

  return (
    <>
      {welcome === "1" && (
        <div className="mb-8 flex flex-col gap-3">
          <FormStatusMessage
            tone="success"
            message="Your profile is set up. Colleagues can now find you in the directory."
          />
          <p className="text-sm text-stone-600">
            <Link
              href={`/people/${user.id}`}
              className="font-medium text-indigo-700 underline-offset-2 hover:underline"
            >
              See how your profile looks
            </Link>{" "}
            or{" "}
            <Link
              href="/profile/edit"
              className="font-medium text-indigo-700 underline-offset-2 hover:underline"
            >
              make changes
            </Link>
            .
          </p>
        </div>
      )}
      <h1 className="text-2xl font-semibold tracking-tight">Directory</h1>
      <p className="mt-2 text-stone-600">The employee list will appear here.</p>
    </>
  );
}
