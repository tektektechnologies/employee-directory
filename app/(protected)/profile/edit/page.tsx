import type { Metadata } from "next";
import { requireVerifiedUser } from "@/lib/auth/verified-user";

export const metadata: Metadata = { title: "Edit profile · Mathematics, Inc." };

export default async function EditProfilePage() {
  await requireVerifiedUser("/profile/edit");

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Edit your profile</h1>
      <p className="mt-2 text-stone-600">The profile form will appear here.</p>
    </>
  );
}
