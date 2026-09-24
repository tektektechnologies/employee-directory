import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { FormStatusMessage } from "@/components/form-status-message";
import { requireVerifiedUser } from "@/lib/auth/verified-user";
import { fetchDirectoryDepartments, parseDirectoryFilters } from "@/lib/profiles/directory";
import { DirectoryFiltersForm } from "./directory-filters-form";
import { DirectoryResults } from "./directory-results";
import { DirectoryResultsSkeleton } from "./directory-results-skeleton";

export const metadata: Metadata = { title: "Directory · Mathematics, Inc." };

function buildDirectoryHref(nameQuery: string, department: string) {
  const directorySearchParams = new URLSearchParams();
  if (nameQuery) directorySearchParams.set("q", nameQuery);
  if (department) directorySearchParams.set("department", department);
  const queryString = directorySearchParams.toString();
  return queryString ? `/directory?${queryString}` : "/directory";
}

export default async function DirectoryPage({ searchParams }: PageProps<"/directory">) {
  const { supabase, user } = await requireVerifiedUser("/directory");

  const { data: ownProfile, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (error) {
    throw new Error("Couldn't load your profile.");
  }
  if (!ownProfile) {
    redirect("/profile/edit");
  }

  const resolvedSearchParams = await searchParams;
  const filters = parseDirectoryFilters(resolvedSearchParams);
  const { departments, loadFailed: departmentsLoadFailed } =
    await fetchDirectoryDepartments(supabase);
  const isWelcome = resolvedSearchParams.welcome === "1";

  return (
    <>
      {isWelcome && (
        <div className="mb-8 flex flex-col gap-3">
          <FormStatusMessage
            tone="success"
            message="Your profile is set up. Colleagues can now find you in the directory."
          />
          <p className="text-sm text-stone-600">
            <Link
              href={`/people/${user.id}`}
              className="font-medium text-indigo-700 underline-offset-2 hover:underline"
            >
              See how your profile looks
            </Link>{" "}
            or{" "}
            <Link
              href="/profile/edit"
              className="font-medium text-indigo-700 underline-offset-2 hover:underline"
            >
              make changes
            </Link>
            .
          </p>
        </div>
      )}

      <h1 className="text-2xl font-semibold tracking-tight">Directory</h1>
      <p className="mt-2 mb-6 text-stone-600">Find colleagues by name or department.</p>

      <DirectoryFiltersForm
        key={`${filters.nameQuery}|${filters.department}`}
        filters={filters}
        departments={departments}
        departmentsLoadFailed={departmentsLoadFailed}
      />

      <Suspense
        key={`${filters.nameQuery}|${filters.department}`}
        fallback={<DirectoryResultsSkeleton />}
      >
        <DirectoryResults
          supabase={supabase}
          filters={filters}
          retryHref={buildDirectoryHref(filters.nameQuery, filters.department)}
        />
      </Suspense>
    </>
  );
}
