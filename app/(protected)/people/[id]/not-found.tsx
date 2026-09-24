import Link from "next/link";
import { primaryButton } from "@/components/styles";

export default function PersonNotFound() {
  return (
    <div className="mx-auto max-w-xl rounded-xl border border-dashed border-stone-300 bg-white p-6 text-center sm:p-8">
      <h1 className="text-xl font-semibold tracking-tight">Profile not found</h1>
      <p className="mt-2 text-stone-600">
        The link may be incomplete, or this person hasn&apos;t set up a profile. Try searching for
        them in the directory.
      </p>
      <Link href="/directory" className={`${primaryButton} mt-5`}>
        Back to directory
      </Link>
    </div>
  );
}
