import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeSupabase, findCall, isWrite, type Query, type QueryResult } from "./support/fake-supabase";

const MY_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_ID = "22222222-2222-4222-8222-222222222222";

const session = vi.hoisted(() => ({
  user: null as { id: string; email: string | null } | null,
  respond: (() => ({ data: null, error: null })) as (query: Query) => QueryResult,
  queries: [] as Query[],
}));

vi.mock("@/lib/auth/user", () => ({
  getUser: async () => {
    const fake = fakeSupabase((query) => session.respond(query));
    session.queries = fake.queries;
    return { supabase: fake.client, user: session.user };
  },
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { saveProfile } = await import("@/app/(protected)/profile/edit/actions");
const { initialState } = await import("@/app/(protected)/profile/edit/form-state");

function profileForm(overrides: Record<string, string> = {}) {
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
  for (const [name, value] of Object.entries(fields)) {
    formData.set(name, value);
  }
  return formData;
}

function writes() {
  return session.queries.filter(isWrite);
}

beforeEach(() => {
  session.user = { id: MY_ID, email: "ada@example.com" };
  session.queries = [];
});

describe("saving your own profile", () => {
  it("updates only the signed-in user's row when a profile already exists", async () => {
    session.respond = () => ({ data: { id: MY_ID }, error: null });

    const result = await saveProfile(initialState, profileForm());

    expect(result.status).toBe("success");
    const [update] = writes();
    expect(update.table).toBe("profiles");
    expect(findCall(update, "eq")?.args).toEqual(["id", MY_ID]);
    expect(findCall(update, "update")?.args[0]).toMatchObject({
      full_name: "Ada Lovelace",
      interests: ["poetry", "mathematics"],
    });
    expect(findCall(update, "update")?.args[0]).not.toHaveProperty("id");
  });

  it("creates the profile under the signed-in user's id on first save, then redirects", async () => {
    session.respond = () => ({ data: null, error: null });

    await expect(saveProfile(initialState, profileForm())).rejects.toThrow(
      "NEXT_REDIRECT:/directory?welcome=1",
    );

    const [insert] = writes();
    expect(findCall(insert, "insert")?.args[0]).toMatchObject({ id: MY_ID });
  });

  it("falls back to an update instead of creating a duplicate when the row already exists", async () => {
    session.respond = (query) => {
      if (findCall(query, "insert")) return { data: null, error: { code: "23505" } };
      if (findCall(query, "update")) return { data: { id: MY_ID }, error: null };
      return { data: null, error: null };
    };

    const result = await saveProfile(initialState, profileForm());

    expect(result.status).toBe("success");
    expect(writes().map((query) => query.calls[0].method)).toEqual(["insert", "update"]);
  });
});

describe("editing someone else's profile", () => {
  it("ignores an owner id smuggled into the form and writes only the signed-in user's row", async () => {
    session.respond = () => ({ data: { id: MY_ID }, error: null });

    await saveProfile(initialState, profileForm({ id: OTHER_ID, userId: OTHER_ID }));

    expect(JSON.stringify(session.queries)).not.toContain(OTHER_ID);
    for (const query of session.queries) {
      expect(findCall(query, "eq")?.args).toEqual(["id", MY_ID]);
    }
  });

  it("reports a failure when the update matches no row (for example, blocked by RLS)", async () => {
    session.respond = (query) =>
      findCall(query, "update") ? { data: null, error: null } : { data: { id: MY_ID }, error: null };

    const result = await saveProfile(initialState, profileForm());

    expect(result.status).toBe("error");
    expect(result.values?.fullName).toBe("Ada Lovelace");
  });

  it("sends a signed-out request to sign-in without touching the database", async () => {
    session.user = null;

    await expect(saveProfile(initialState, profileForm())).rejects.toThrow(
      "NEXT_REDIRECT:/sign-in?next=%2Fprofile%2Fedit",
    );
    expect(session.queries).toHaveLength(0);
  });
});

describe("invalid input", () => {
  it("returns field errors, keeps the entered values, and writes nothing", async () => {
    const result = await saveProfile(
      initialState,
      profileForm({ fullName: "   ", photoUrl: "javascript:alert(1)" }),
    );

    expect(result.status).toBe("error");
    expect(result.errors).toHaveProperty("fullName");
    expect(result.errors).toHaveProperty("photoUrl");
    expect(result.values?.photoUrl).toBe("javascript:alert(1)");
    expect(session.queries).toHaveLength(0);
  });
});
