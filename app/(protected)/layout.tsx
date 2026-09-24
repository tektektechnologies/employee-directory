import Link from "next/link";
import { getVerifiedUser } from "@/lib/auth/verified-user";
import { signOut } from "./actions";

// Each page performs its own verified check and redirect; the layout only
// reads the user for display, because layouts don't re-run on every navigation.
export default async function ProtectedLayout({ children }: LayoutProps<"/">) {
  const { user } = await getVerifiedUser();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/directory" className="text-sm font-semibold tracking-tight">
            Mathematics, Inc.
          </Link>
          <nav aria-label="Main" className="flex flex-wrap items-center gap-1 text-sm">
            <Link
              href="/directory"
              className="rounded-md px-3 py-2 text-stone-700 hover:bg-stone-100 hover:text-stone-900"
            >
              Directory
            </Link>
            <Link
              href="/profile/edit"
              className="rounded-md px-3 py-2 text-stone-700 hover:bg-stone-100 hover:text-stone-900"
            >
              My profile
            </Link>
            {user?.email && (
              <span className="hidden px-2 text-stone-500 sm:inline">{user.email}</span>
            )}
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-md border border-stone-300 px-3 py-2 text-stone-800 hover:border-stone-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">{children}</main>
    </div>
  );
}
