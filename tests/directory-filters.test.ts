import { describe, expect, it } from "vitest";
import { getProfiles, parseFilters, type Filters } from "@/lib/profiles/directory";
import { fakeSupabase, findCall } from "./support/fake-supabase";

const noFilters: Filters = { query: "", department: "" };

describe("parseFilters", () => {
  it("trims values and defaults to no filters", () => {
    expect(parseFilters({})).toEqual(noFilters);
    expect(parseFilters({ q: "  ada ", department: " Algebra " })).toEqual({
      query: "ada",
      department: "Algebra",
    });
  });

  it("uses the first value when a parameter is repeated", () => {
    expect(parseFilters({ q: ["ada", "alan"], department: ["Algebra", "Topology"] })).toEqual({
      query: "ada",
      department: "Algebra",
    });
  });

  it("ignores a department that isn't in the list", () => {
    expect(parseFilters({ department: "Research" }).department).toBe("");
  });

  it("caps the name query length", () => {
    expect(parseFilters({ q: "a".repeat(500) }).query).toHaveLength(100);
  });
});

describe("getProfiles", () => {
  const sampleRow = {
    id: "11111111-1111-4111-8111-111111111111",
    full_name: "Ada Lovelace",
    job_title: "Analyst",
    department: "Algebra",
    location: "London",
    bio: "word ".repeat(60),
    photo_path: null,
  };

  async function search(filters: Filters) {
    const fake = fakeSupabase(() => ({ data: [sampleRow], error: null }));
    const result = await getProfiles(fake.client, filters);
    return { result, query: fake.queries[0] };
  }

  it("applies no filters when both are empty", async () => {
    const { query } = await search(noFilters);
    expect(findCall(query, "ilike")).toBeUndefined();
    expect(findCall(query, "eq")).toBeUndefined();
  });

  it("combines name search and department with AND semantics", async () => {
    const { query } = await search({ query: "ada", department: "Algebra" });

    expect(findCall(query, "ilike")?.args).toEqual(["full_name", "%ada%"]);
    expect(findCall(query, "eq")?.args).toEqual(["department", "Algebra"]);
    expect(findCall(query, "or")).toBeUndefined();
    expect(findCall(query, "order")?.args[0]).toBe("full_name");
  });

  it("treats % and _ in a search as literal characters", async () => {
    const { query } = await search({ query: "50%_off\\", department: "" });
    expect(findCall(query, "ilike")?.args[1]).toBe("%50\\%\\_off\\\\%");
  });

  it("selects only card fields and never email", async () => {
    const { query } = await search(noFilters);
    expect(String(findCall(query, "select")?.args[0])).not.toMatch(/email|\*/);
  });

  it("maps rows to cards with a shortened bio", async () => {
    const { result } = await search(noFilters);

    expect(result.failed).toBe(false);
    expect(result.profiles?.[0]).toMatchObject({ fullName: "Ada Lovelace", department: "Algebra" });
    expect(result.profiles?.[0].bio?.length).toBeLessThanOrEqual(161);
    expect(result.profiles?.[0].bio?.endsWith("…")).toBe(true);
  });

  it("reports a load failure distinctly from an empty result", async () => {
    const failing = fakeSupabase(() => ({ data: null, error: { message: "boom" } }));
    const empty = fakeSupabase(() => ({ data: [], error: null }));

    expect(await getProfiles(failing.client, noFilters)).toEqual({ profiles: null, failed: true });
    expect(await getProfiles(empty.client, noFilters)).toEqual({ profiles: [], failed: false });
  });
});
