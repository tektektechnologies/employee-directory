import Link from "next/link";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen flex-col px-4 py-5 sm:px-6 sm:py-6">
      <header className="mx-auto w-full max-w-md">
        <Link
          href="/"
          className="rounded text-sm font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <span aria-hidden="true">←</span> Mathematics, Inc.
        </Link>
      </header>
      <main id="main" className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8 sm:py-10">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
