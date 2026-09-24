import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createFakeSupabase,
  findCall,
  isWriteQuery,
  type FakeQueryResult,
  type RecordedQuery,
} from "./support/fake-supabase";

const SIGNED_IN_USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "22222222-2222-4222-8222-222222222222";

const sessionState = vi.hoisted(() => ({
  user: null as { id: string; email: string | null } | null,
  resolveQuery: (() => ({ data: null, error: null })) as (query: RecordedQuery) => FakeQueryResult,
  recordedQueries: [] as RecordedQuery[],
}));

vi.mock("@/lib/auth/verified-user", () => ({
  getVerifiedUser: async () => {
    const fakeSupabase = createFakeSupabase((query) => sessionState.resolveQuery(query));
    sessionState.recordedQueries = fakeSupabase.recordedQueries;
    return { supabase: fakeSupabase.client, user: sessionState.user };
  },
}));

vi.mock("next/navigation", () => ({
  redirect: (destination: string) => {
    throw new Error(`NEXT_REDIRECT:${destination}`);
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { saveOwnProfile } = await import("@/app/(protected)/profile/edit/actions");
const { initialProfileFormState } = await import("@/app/(protected)/profile/edit/form-state");

function buildValidProfileForm(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  const fields = {
    fullName: "Ada Lovelace",
    department: "Applied Research",
    jobTitle: "Analyst",
    location: "London",
    bio: "Works on analytical engines.",
    interests: "poetry, mathematics",
    photoUrl: "",
    contactUrl: "",
    ...overrides,
  };
  for (const [fieldName, fieldValue] of Object.entries(fields)) {
    formData.set(fieldName, fieldValue);
  }
  return formData;
}

function writeQueries() {
  return sessionState.recordedQueries.filter(isWriteQuery);
}

beforeEach(() => {
  sessionState.user = { id: SIGNED_IN_USER_ID, email: "ada@example.com" };
  sessionState.recordedQueries = [];
});

describe("saving your own profile", () => {
  it("updates only the signed-in user's row when a profile already exists", async () => {
    sessionState.resolveQuery = () => ({ data: { id: SIGNED_IN_USER_ID }, error: null });

    const result = await saveOwnProfile(initialProfileFormState, buildValidProfileForm());

    expect(result.status).toBe("success");
    const [updateQuery] = writeQueries();
    expect(updateQuery.table).toBe("profiles");
    expect(findCall(updateQuery, "eq")?.args).toEqual(["id", SIGNED_IN_USER_ID]);
    expect(findCall(updateQuery, "update")?.args[0]).toMatchObject({
      full_name: "Ada Lovelace",
      interests: ["poetry", "mathematics"],
    });
    expect(findCall(updateQuery, "update")?.args[0]).not.toHaveProperty("id");
  });

  it("creates the profile under the signed-in user's id on first save, then redirects", async () => {
    sessionState.resolveQuery = () => ({ data: null, error: null });

    await expect(
      saveOwnProfile(initialProfileFormState, buildValidProfileForm()),
    ).rejects.toThrow("NEXT_REDIRECT:/directory?welcome=1");

    const [insertQuery] = writeQueries();
    expect(findCall(insertQuery, "insert")?.args[0]).toMatchObject({ id: SIGNED_IN_USER_ID });
  });

  it("falls back to an update instead of creating a duplicate when the row already exists", async () => {
    sessionState.resolveQuery = (query) => {
      if (findCall(query, "insert")) return { data: null, error: { code: "23505" } };
      if (findCall(query, "update")) return { data: { id: SIGNED_IN_USER_ID }, error: null };
      return { data: null, error: null };
    };

    const result = await saveOwnProfile(initialProfileFormState, buildValidProfileForm());

    expect(result.status).toBe("success");
    expect(writeQueries().map((query) => query.calls[0].method)).toEqual(["insert", "update"]);
  });
});

describe("editing someone else's profile", () => {
  it("ignores an owner id smuggled into the form and writes only the signed-in user's row", async () => {
    sessionState.resolveQuery = () => ({ data: { id: SIGNED_IN_USER_ID }, error: null });
    const tamperedForm = buildValidProfileForm({ id: OTHER_USER_ID, userId: OTHER_USER_ID });

    await saveOwnProfile(initialProfileFormState, tamperedForm);

    const allQueryArguments = JSON.stringify(sessionState.recordedQueries);
    expect(allQueryArguments).not.toContain(OTHER_USER_ID);
    for (const query of sessionState.recordedQueries) {
      expect(findCall(query, "eq")?.args).toEqual(["id", SIGNED_IN_USER_ID]);
    }
  });

  it("reports a failure when the update matches no row (for example, blocked by RLS)", async () => {
    sessionState.resolveQuery = (query) =>
      findCall(query, "update")
        ? { data: null, error: null }
        : { data: { id: SIGNED_IN_USER_ID }, error: null };

    const result = await saveOwnProfile(initialProfileFormState, buildValidProfileForm());

    expect(result.status).toBe("error");
    expect(result.values?.fullName).toBe("Ada Lovelace");
  });

  it("sends a signed-out request to sign-in without touching the database", async () => {
    sessionState.user = null;

    await expect(
      saveOwnProfile(initialProfileFormState, buildValidProfileForm()),
    ).rejects.toThrow("NEXT_REDIRECT:/sign-in?next=%2Fprofile%2Fedit");
    expect(sessionState.recordedQueries).toHaveLength(0);
  });
});

describe("invalid input", () => {
  it("returns field errors, keeps the entered values, and writes nothing", async () => {
    const invalidForm = buildValidProfileForm({
      fullName: "   ",
      photoUrl: "javascript:alert(1)",
    });

    const result = await saveOwnProfile(initialProfileFormState, invalidForm);

    expect(result.status).toBe("error");
    expect(result.fieldErrors).toHaveProperty("fullName");
    expect(result.fieldErrors).toHaveProperty("photoUrl");
    expect(result.values?.photoUrl).toBe("javascript:alert(1)");
    expect(sessionState.recordedQueries).toHaveLength(0);
  });
});
