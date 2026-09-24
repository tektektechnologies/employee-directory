import Link from "next/link";

const directoryFeatures = [
  {
    title: "Find colleagues",
    description: "Search by name, team, or role to see who does what.",
  },
  {
    title: "Know your teams",
    description: "Browse departments and see how people are organized.",
  },
  {
    title: "Keep details current",
    description: "Employees manage their own profile and contact details.",
  },
];

export default function LandingPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6">
      <header className="flex items-center justify-between py-6">
        <span className="text-sm font-semibold tracking-tight">
          Mathematics, Inc.
        </span>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/sign-in"
            className="rounded-md px-3 py-2 text-stone-700 hover:bg-stone-200/60 hover:text-stone-900"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-md bg-stone-900 px-3 py-2 font-medium text-white hover:bg-stone-700"
          >
            Register
          </Link>
        </nav>
      </header>

      <main className="flex flex-1 flex-col justify-center py-16">
        <p className="text-sm font-medium text-indigo-700">Employee directory</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Everyone at Mathematics, Inc., in one place.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-stone-600">
          Look up colleagues, see which team they belong to, and find the right
          person to talk to. Sign in with your company account to get started.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/sign-in"
            className="rounded-md bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-700"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-md border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-800 hover:border-stone-400"
          >
            Create an account
          </Link>
        </div>

        <ul className="mt-20 grid gap-6 border-t border-stone-200 pt-10 sm:grid-cols-3">
          {directoryFeatures.map((feature) => (
            <li key={feature.title}>
              <h2 className="text-sm font-semibold">{feature.title}</h2>
              <p className="mt-1.5 text-sm text-stone-600">
                {feature.description}
              </p>
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
