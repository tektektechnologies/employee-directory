import Link from "next/link";

export default function PersonNotFound() {
  return (
    <div className="mx-auto max-w-xl rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center">
      <h1 className="text-xl font-semibold tracking-tight">Profile not found</h1>
      <p className="mt-2 text-stone-600">
        This person may have left, or the link may be incomplete. Try finding them in the
        directory instead.
      </p>
      <Link
        href="/directory"
        className="mt-5 inline-block rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        Back to directory
      </Link>
    </div>
  );
}
