import Link from "next/link";
import { primaryButton } from "@/components/styles";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 text-center">
      <p className="text-sm font-medium text-indigo-700">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-2 text-stone-600">The link may be old or mistyped.</p>
      <Link href="/" className={`${primaryButton} mt-6 self-center`}>
        Go to the home page
      </Link>
    </main>
  );
}
