import type { ServerClient } from "@/lib/supabase/server";

const MAX_QUERY_LENGTH = 100;
const BIO_PREVIEW_LENGTH = 160;

export type Filters = {
  query: string;
  department: string;
};

// Only what a card shows. The id is used for the profile link and never
// rendered; emails live in auth.users and are never queried here.
export type CardProfile = {
  id: string;
  fullName: string;
  jobTitle: string | null;
  department: string | null;
  location: string | null;
  bio: string | null;
};

type CardRow = {
  id: string;
  full_name: string;
  job_title: string | null;
  department: string | null;
  location: string | null;
  bio: string | null;
};

function first(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export function parseFilters(params: Record<string, string | string[] | undefined>): Filters {
  return {
    query: first(params.q).trim().slice(0, MAX_QUERY_LENGTH),
    department: first(params.department).trim(),
  };
}

export function directoryHref({ query, department }: Filters) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (department) params.set("department", department);
  const search = params.toString();
  return search ? `/directory?${search}` : "/directory";
}

// Makes % and _ match literally instead of acting as wildcards.
function escapeLike(text: string) {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}

function shortBio(bio: string | null) {
  if (!bio) return null;
  const text = bio.replace(/\s+/g, " ").trim();
  if (text.length <= BIO_PREVIEW_LENGTH) return text;
  const cut = text.slice(0, BIO_PREVIEW_LENGTH);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : BIO_PREVIEW_LENGTH)}…`;
}

export async function hasProfile(supabase: ServerClient, userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    throw new Error("Couldn't check your profile.");
  }
  return Boolean(data);
}

export async function getDepartments(supabase: ServerClient) {
  const { data, error } = await supabase
    .from("profiles")
    .select("department")
    .not("department", "is", null)
    .overrideTypes<{ department: string }[], { merge: false }>();

  if (error) {
    return { departments: [], failed: true };
  }

  const departments = Array.from(new Set(data.map((row) => row.department.trim()).filter(Boolean)));
  departments.sort((a, b) => a.localeCompare(b));
  return { departments, failed: false };
}

export async function getProfiles(supabase: ServerClient, { query, department }: Filters) {
  let request = supabase.from("profiles").select("id, full_name, job_title, department, location, bio");

  if (query) {
    request = request.ilike("full_name", `%${escapeLike(query)}%`);
  }
  if (department) {
    request = request.eq("department", department);
  }

  // Stable order so results don't shuffle between requests.
  const { data, error } = await request
    .order("full_name", { ascending: true })
    .overrideTypes<CardRow[], { merge: false }>();

  if (error) {
    return { profiles: null, failed: true };
  }

  const profiles: CardProfile[] = data.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    jobTitle: row.job_title,
    department: row.department,
    location: row.location,
    bio: shortBio(row.bio),
  }));
  return { profiles, failed: false };
}
