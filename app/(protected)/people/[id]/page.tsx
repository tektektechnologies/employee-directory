import type { Metadata } from "next";
import { requireVerifiedUser } from "@/lib/auth/verified-user";

export const metadata: Metadata = { title: "Profile · Mathematics, Inc." };

export default async function PersonPage({ params }: PageProps<"/people/[id]">) {
  const { id } = await params;
  await requireVerifiedUser(`/people/${encodeURIComponent(id)}`);

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
      <p className="mt-2 text-stone-600">This person&apos;s profile will appear here.</p>
    </>
  );
}
