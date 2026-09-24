import Link from "next/link";
import { primaryButton, quietLink, secondaryButton } from "@/components/styles";
import { getUser } from "@/lib/auth/user";

const features = [
  {
    title: "Find colleagues",
    description: "Search by name to find someone and see what they work on.",
  },
  {
    title: "Browse by department",
    description: "Filter the directory to see who is on each team.",
  },
  {
    title: "Keep your details current",
    description: "You manage your own profile: role, location, bio, and interests.",
  },
];

export default async function HomePage() {
  const { user } = await getUser();

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 sm:px-6">
      <header className="flex items-center justify-between gap-3 py-5 sm:py-6">
        <span className="text-sm font-semibold tracking-tight">Mathematics, Inc.</span>
        <nav aria-label="Account" className="flex items-center gap-2 text-sm">
          {user ? (
            <Link href="/directory" className={quietLink}>
              Open directory
            </Link>
          ) : (
            <>
              <Link href="/sign-in" className={quietLink}>
                Sign in
              </Link>
              <Link href="/register" className={`${primaryButton} px-3 py-2`}>
                Register
              </Link>
            </>
          )}
        </nav>
      </header>

      <main id="main" className="flex flex-1 flex-col justify-center py-10 sm:py-16">
        <p className="text-sm font-medium text-indigo-700">Employee directory</p>
        <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
          Everyone at Mathematics, Inc., in one place.
        </h1>
        <p className="mt-5 max-w-xl text-base text-stone-600 sm:text-lg">
          Look up colleagues, see which department they are in, and find the right person to
          talk to. New here? Create an account, confirm your email, and set up your profile.
          It takes about two minutes.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {user ? (
            <Link href="/directory" className={`${primaryButton} px-5`}>
              Open the directory
            </Link>
          ) : (
            <>
              <Link href="/register" className={`${primaryButton} px-5`}>
                Create an account
              </Link>
              <Link href="/sign-in" className={`${secondaryButton} px-5`}>
                I already have an account
              </Link>
            </>
          )}
        </div>

        <ul className="mt-14 grid gap-6 border-t border-stone-200 pt-10 sm:mt-20 sm:grid-cols-3">
          {features.map((feature) => (
            <li key={feature.title}>
              <h2 className="text-sm font-semibold">{feature.title}</h2>
              <p className="mt-1.5 text-sm text-stone-600">{feature.description}</p>
            </li>
          ))}
        </ul>
      </main>

      <footer className="py-8 text-xs text-stone-500">
        © {new Date().getFullYear()} Mathematics, Inc.
      </footer>
    </div>
  );
}
