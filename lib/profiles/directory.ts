import type { SupabaseServerClient } from "@/lib/supabase/server";

const MAX_NAME_QUERY_LENGTH = 100;
const BIO_PREVIEW_LENGTH = 160;

export type DirectoryFilters = {
  nameQuery: string;
  department: string;
};

// Only what a card displays. The id is needed for the profile link and is
// never rendered; emails live in auth.users and are never queried here.
export type DirectoryCardProfile = {
  id: string;
  fullName: string;
  jobTitle: string | null;
  department: string | null;
  location: string | null;
  bioPreview: string | null;
};

type DirectoryProfileRow = {
  id: string;
  full_name: string;
  job_title: string | null;
  department: string | null;
  location: string | null;
  bio: string | null;
};

function readFirstSearchParam(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export function parseDirectoryFilters(
  searchParams: Record<string, string | string[] | undefined>,
): DirectoryFilters {
  return {
    nameQuery: readFirstSearchParam(searchParams.q).trim().slice(0, MAX_NAME_QUERY_LENGTH),
    department: readFirstSearchParam(searchParams.department).trim(),
  };
}

// Stops a search for "%" or "_" from acting as a wildcard.
function escapeLikePattern(searchText: string) {
  return searchText.replace(/[\\%_]/g, (character) => `\\${character}`);
}

function buildBioPreview(bio: string | null) {
  if (!bio) return null;
  const collapsedBio = bio.replace(/\s+/g, " ").trim();
  if (collapsedBio.length <= BIO_PREVIEW_LENGTH) return collapsedBio;
  const clippedBio = collapsedBio.slice(0, BIO_PREVIEW_LENGTH);
  const lastSpaceIndex = clippedBio.lastIndexOf(" ");
  return `${clippedBio.slice(0, lastSpaceIndex > 0 ? lastSpaceIndex : BIO_PREVIEW_LENGTH)}…`;
}

export async function fetchDirectoryDepartments(supabase: SupabaseServerClient) {
  const { data, error } = await supabase
    .from("profiles")
    .select("department")
    .not("department", "is", null)
    .overrideTypes<{ department: string }[], { merge: false }>();

  if (error) {
    return { departments: [], loadFailed: true };
  }

  const departments = Array.from(
    new Set(data.map((row) => row.department.trim()).filter(Boolean)),
  ).sort((first, second) => first.localeCompare(second));
  return { departments, loadFailed: false };
}

export async function fetchDirectoryProfiles(
  supabase: SupabaseServerClient,
  { nameQuery, department }: DirectoryFilters,
) {
  let profilesQuery = supabase
    .from("profiles")
    .select("id, full_name, job_title, department, location, bio");

  if (nameQuery) {
    profilesQuery = profilesQuery.ilike("full_name", `%${escapeLikePattern(nameQuery)}%`);
  }
  if (department) {
    profilesQuery = profilesQuery.eq("department", department);
  }

  // A stable order so results don't shuffle between requests.
  const { data, error } = await profilesQuery
    .order("full_name", { ascending: true })
    .overrideTypes<DirectoryProfileRow[], { merge: false }>();

  if (error) {
    return { profiles: null, loadFailed: true };
  }

  const profiles: DirectoryCardProfile[] = data.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    jobTitle: row.job_title,
    department: row.department,
    location: row.location,
    bioPreview: buildBioPreview(row.bio),
  }));
  return { profiles, loadFailed: false };
}
