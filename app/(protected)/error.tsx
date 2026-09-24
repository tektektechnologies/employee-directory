"use client";

import Link from "next/link";
import { secondaryButton, textLink } from "@/components/styles";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ProtectedError({ reset }: ErrorProps) {
  return (
    <div role="alert" className="mx-auto max-w-xl rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-900 sm:p-8">
      <h1 className="text-xl font-semibold tracking-tight">This page couldn&apos;t be loaded</h1>
      <p className="mt-2 text-sm">
        This is usually temporary. Check your connection and try again.
      </p>
      <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button type="button" onClick={reset} className={secondaryButton}>
          Try again
        </button>
        <Link href="/directory" className={`${textLink} text-sm`}>
          Back to directory
        </Link>
      </div>
    </div>
  );
}
