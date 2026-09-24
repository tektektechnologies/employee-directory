import { describe, expect, it } from "vitest";
import {
  fetchDirectoryDepartments,
  fetchDirectoryProfiles,
  parseDirectoryFilters,
} from "@/lib/profiles/directory";
import { createFakeSupabase, findCall } from "./support/fake-supabase";

describe("parseDirectoryFilters", () => {
  it("trims values and defaults to no filters", () => {
    expect(parseDirectoryFilters({})).toEqual({ nameQuery: "", department: "" });
    expect(parseDirectoryFilters({ q: "  ada ", department: " Research " })).toEqual({
      nameQuery: "ada",
      department: "Research",
    });
  });

  it("uses the first value when a parameter is repeated", () => {
    expect(parseDirectoryFilters({ q: ["ada", "alan"], department: ["Research", "Ops"] })).toEqual({
      nameQuery: "ada",
      department: "Research",
    });
  });

  it("caps the name query length", () => {
    expect(parseDirectoryFilters({ q: "a".repeat(500) }).nameQuery).toHaveLength(100);
  });
});

describe("fetchDirectoryProfiles", () => {
  const sampleRow = {
    id: "11111111-1111-4111-8111-111111111111",
    full_name: "Ada Lovelace",
    job_title: "Analyst",
    department: "Research",
    location: "London",
    bio: "word ".repeat(60),
  };

  function runDirectoryQuery(filters: { nameQuery: string; department: string }) {
    const fakeSupabase = createFakeSupabase(() => ({ data: [sampleRow], error: null }));
    return {
      resultPromise: fetchDirectoryProfiles(fakeSupabase.client, filters),
      recordedQueries: fakeSupabase.recordedQueries,
    };
  }

  it("applies no filters when both are empty", async () => {
    const { resultPromise, recordedQueries } = runDirectoryQuery({ nameQuery: "", department: "" });
    await resultPromise;
    expect(findCall(recordedQueries[0], "ilike")).toBeUndefined();
    expect(findCall(recordedQueries[0], "eq")).toBeUndefined();
  });

  it("combines name search and department with AND semantics", async () => {
    const { resultPromise, recordedQueries } = runDirectoryQuery({
      nameQuery: "ada",
      department: "Research",
    });
    await resultPromise;

    const [directoryQuery] = recordedQueries;
    expect(findCall(directoryQuery, "ilike")?.args).toEqual(["full_name", "%ada%"]);
    expect(findCall(directoryQuery, "eq")?.args).toEqual(["department", "Research"]);
    expect(findCall(directoryQuery, "or")).toBeUndefined();
    expect(findCall(directoryQuery, "order")?.args[0]).toBe("full_name");
  });

  it("treats % and _ in a search as literal characters", async () => {
    const { resultPromise, recordedQueries } = runDirectoryQuery({
      nameQuery: "50%_off\\",
      department: "",
    });
    await resultPromise;
    expect(findCall(recordedQueries[0], "ilike")?.args[1]).toBe("%50\\%\\_off\\\\%");
  });

  it("selects only card fields and never email", async () => {
    const { resultPromise, recordedQueries } = runDirectoryQuery({ nameQuery: "", department: "" });
    await resultPromise;
    const selectedColumns = String(findCall(recordedQueries[0], "select")?.args[0]);
    expect(selectedColumns).not.toMatch(/email|\*/);
  });

  it("maps rows to cards with a shortened bio preview", async () => {
    const { resultPromise } = runDirectoryQuery({ nameQuery: "", department: "" });
    const { profiles, loadFailed } = await resultPromise;

    expect(loadFailed).toBe(false);
    expect(profiles?.[0]).toMatchObject({ fullName: "Ada Lovelace", department: "Research" });
    expect(profiles?.[0].bioPreview?.length).toBeLessThanOrEqual(161);
    expect(profiles?.[0].bioPreview?.endsWith("…")).toBe(true);
  });

  it("reports a load failure distinctly from an empty result", async () => {
    const failingSupabase = createFakeSupabase(() => ({ data: null, error: { message: "boom" } }));
    const emptySupabase = createFakeSupabase(() => ({ data: [], error: null }));
    const noFilters = { nameQuery: "", department: "" };

    expect(await fetchDirectoryProfiles(failingSupabase.client, noFilters)).toEqual({
      profiles: null,
      loadFailed: true,
    });
    expect(await fetchDirectoryProfiles(emptySupabase.client, noFilters)).toEqual({
      profiles: [],
      loadFailed: false,
    });
  });
});

describe("fetchDirectoryDepartments", () => {
  it("returns unique, trimmed, alphabetized department names", async () => {
    const fakeSupabase = createFakeSupabase(() => ({
      data: [
        { department: "Research" },
        { department: " Operations " },
        { department: "Research" },
        { department: "" },
      ],
      error: null,
    }));

    expect(await fetchDirectoryDepartments(fakeSupabase.client)).toEqual({
      departments: ["Operations", "Research"],
      loadFailed: false,
    });
  });
});
