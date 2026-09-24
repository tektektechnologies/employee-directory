import Link from "next/link";
import { secondaryButton } from "@/components/styles";
import { getUser } from "@/lib/auth/user";
import { hasProfile } from "@/lib/profiles/directory";
import { signOut } from "./actions";
import { NavLinks } from "./nav-links";

// Pages do their own sign-in check and redirect. The layout reads the user
// only to decide what the header shows, since layouts don't re-render on every
// navigation.
export default async function ProtectedLayout({ children }: LayoutProps<"/">) {
  const { supabase, user } = await getUser();
  // If the check fails, show the full menu; the page itself will surface the error.
  const profileDone = user ? await hasProfile(supabase, user.id).catch(() => true) : false;

  const links = profileDone && user
    ? [
        { href: "/directory", label: "Directory", activePaths: ["/directory"] },
        {
          href: `/people/${user.id}`,
          label: "My profile",
          activePaths: [`/people/${user.id}`, "/profile/edit"],
        },
      ]
    : [{ href: "/profile/edit", label: "Set up your profile", activePaths: ["/profile/edit"] }];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6 sm:py-4">
          <Link
            href={profileDone ? "/directory" : "/profile/edit"}
            className="rounded text-sm font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Mathematics, Inc.
          </Link>
          <nav aria-label="Main" className="flex flex-wrap items-center gap-1 text-sm">
            <NavLinks links={links} />
            {user?.email && (
              <span className="hidden max-w-48 truncate px-2 text-stone-500 md:inline" title={user.email}>
                {user.email}
              </span>
            )}
            <form action={signOut}>
              <button type="submit" className={`${secondaryButton} ml-1 px-3 py-2`}>
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}
