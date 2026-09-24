import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { StatusMessage } from "@/components/status-message";
import { textLink } from "@/components/styles";
import { requireUser } from "@/lib/auth/user";
import { hasProfile, parseFilters } from "@/lib/profiles/directory";
import { FilterForm } from "./filter-form";
import { Results } from "./results";
import { ResultsSkeleton } from "./results-skeleton";

export const metadata: Metadata = { title: "Directory" };

export default async function DirectoryPage({ searchParams }: PageProps<"/directory">) {
  const { supabase, user } = await requireUser("/directory");

  if (!(await hasProfile(supabase, user.id))) {
    redirect("/profile/edit");
  }

  const params = await searchParams;
  const filters = parseFilters(params);
  const filterKey = `${filters.query}|${filters.department}`;

  return (
    <>
      {params.welcome === "1" && (
        <div className="mb-6 sm:mb-8">
          <StatusMessage tone="success">
            <p className="font-medium">You&apos;re all set</p>
            <p className="mt-1">
              Your profile is saved and colleagues can now find you.{" "}
              <Link href={`/people/${user.id}`} className={textLink}>
                View your profile
              </Link>
            </p>
          </StatusMessage>
        </div>
      )}

      <h1 className="text-2xl font-semibold tracking-tight">Directory</h1>
      <p className="mt-1.5 mb-5 text-stone-600 sm:mb-6">
        Search by name, filter by department, and open a card to see the full profile.
      </p>

      <FilterForm key={`form-${filterKey}`} filters={filters} />

      <Suspense key={`results-${filterKey}`} fallback={<ResultsSkeleton />}>
        <Results supabase={supabase} filters={filters} userId={user.id} />
      </Suspense>
    </>
  );
}
