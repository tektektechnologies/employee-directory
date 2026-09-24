"use client";

import Link from "next/link";

type PersonErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function PersonError({ reset }: PersonErrorProps) {
  return (
    <div
      role="alert"
      className="mx-auto max-w-xl rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-900"
    >
      <h1 className="text-xl font-semibold tracking-tight">This profile couldn&apos;t be loaded</h1>
      <p className="mt-2 text-sm">This is usually temporary. Check your connection and try again.</p>
      <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
        <button
          type="button"
          onClick={reset}
          className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-900 hover:border-red-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
        >
          Try again
        </button>
        <Link
          href="/directory"
          className="rounded-md px-4 py-2 text-sm font-medium text-red-900 underline-offset-2 hover:underline"
        >
          Back to directory
        </Link>
      </div>
    </div>
  );
}
