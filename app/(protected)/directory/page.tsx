import type { Metadata } from "next";
import { requireVerifiedUser } from "@/lib/auth/verified-user";

export const metadata: Metadata = { title: "Directory · Mathematics, Inc." };

export default async function DirectoryPage() {
  await requireVerifiedUser("/directory");

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Directory</h1>
      <p className="mt-2 text-stone-600">The employee list will appear here.</p>
    </>
  );
}
